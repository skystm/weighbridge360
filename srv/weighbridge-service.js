const cds = require('@sap/cds')

module.exports = class WeighBridgeService extends cds.ApplicationService {

  async init() {
    const { TicketsPesagem, TrilhaAuditoria, ContratosSAP, Fazendas } = this.entities

    // ─── US-01: Check-in ──────────────────────────────────────────────────────
    this.on('checkIn', async (req) => {
      const { fazendaId, placa, fonteIdentificacao, confiancaOCR, operadorId } = req.data

      if (fonteIdentificacao === 'OCR_AUTOMATICO' && confiancaOCR < 0.85)
        return req.reject(400, 'OCR_BAIXA_CONFIANCA', 'confiancaOCR')

      // Verifica ticket ativo para a mesma placa
      const ativo = await SELECT.one.from(TicketsPesagem)
        .where({ fazenda_ID: fazendaId, placa, status_code: { '!=': 'CONCLUIDO' } })
      if (ativo) return req.reject(409, `TICKET_ATIVO_EXISTENTE: ${ativo.ID}`)

      // Valida contra ContratoSAP
      const contrato = await SELECT.one.from(ContratosSAP)
        .where({ fazenda_ID: fazendaId, ativo: true })
        .and(`validoDe <= CURRENT_DATE AND validoAte >= CURRENT_DATE`)
        .and(`saldoRestante > 0`)
      if (!contrato) return req.reject(403, 'PLACA_NAO_AUTORIZADA')

      const ticketId = cds.utils.uuid()
      await INSERT.into(TicketsPesagem).entries({
        ID:                  ticketId,
        fazenda_ID:          fazendaId,
        placa,
        fonteIdentificacao_code: fonteIdentificacao,
        confiancaOCR,
        contrato_ID:         contrato.ID,
        produto_code:        contrato.produto_code,
        transportadora:      contrato.transportadora,
        status_code:         'AGUARDANDO_TARA',
        modoOffline:         false,
        operador_ID:         operadorId
      })

      await this._audit(ticketId, 'CHECK_IN', operadorId, null,
        `AGUARDANDO_TARA | placa=${placa} | fonte=${fonteIdentificacao}`)

      return SELECT.one.from(TicketsPesagem).where({ ID: ticketId })
    })

    // ─── US-02: Registrar Tara ────────────────────────────────────────────────
    this.on('registrarTara', 'TicketsPesagem', async (req) => {
      const { valor, fonte, motivoManual, operadorId } = req.data
      const { ID } = req.params[0]

      if (!valor || valor <= 0 || valor > 150000)
        return req.reject(400, 'PESO_INVALIDO', 'valor')
      if (fonte === 'MANUAL_CONFIRMADO' && !motivoManual)
        return req.reject(400, 'MOTIVO_OBRIGATORIO', 'motivoManual')

      const n = await UPDATE(TicketsPesagem, ID)
        .where({ status_code: 'AGUARDANDO_TARA' })
        .with({
          taraValor: valor,
          taraFonte_code: fonte,
          taraTimestamp: new Date().toISOString(),
          taraMotivo: motivoManual,
          status_code: 'AGUARDANDO_CARGA'
        })
      if (!n) return req.reject(409, 'STATUS_INVALIDO')

      await this._audit(ID, 'TARA_REGISTRADA', operadorId, null,
        `tara=${valor}kg | fonte=${fonte}${motivoManual ? ' | motivo=' + motivoManual : ''}`)

      return SELECT.one.from(TicketsPesagem).where({ ID })
    })

    // ─── US-03a: Iniciar carregamento ─────────────────────────────────────────
    this.on('iniciarCarregamento', 'TicketsPesagem', async (req) => {
      const { operadorId } = req.data
      const { ID } = req.params[0]

      const n = await UPDATE(TicketsPesagem, ID)
        .where({ status_code: 'AGUARDANDO_CARGA' })
        .with({ cargaIniciadaEm: new Date().toISOString(), status_code: 'AGUARDANDO_BRUTO' })
      if (!n) return req.reject(409, 'STATUS_INVALIDO')

      await this._audit(ID, 'CARGA_INICIADA', operadorId, 'AGUARDANDO_CARGA', 'AGUARDANDO_BRUTO')
      return SELECT.one.from(TicketsPesagem).where({ ID })
    })

    // ─── US-03b: Registrar Peso Bruto ─────────────────────────────────────────
    this.on('registrarPesoBruto', 'TicketsPesagem', async (req) => {
      const { valor, fonte, motivoManual, operadorId } = req.data
      const { ID } = req.params[0]

      if (!valor || valor <= 0 || valor > 150000)
        return req.reject(400, 'PESO_INVALIDO', 'valor')
      if (fonte === 'MANUAL_CONFIRMADO' && !motivoManual)
        return req.reject(400, 'MOTIVO_OBRIGATORIO', 'motivoManual')

      const ticket = await SELECT.one.from(TicketsPesagem).where({ ID })
      if (!ticket) return req.reject(404, 'NAO_ENCONTRADO')
      if (ticket.status_code !== 'AGUARDANDO_BRUTO') return req.reject(409, 'STATUS_INVALIDO')

      const pesoLiquido = valor - ticket.taraValor

      // BR-02: PesoBruto deve ser > Tara
      if (valor <= ticket.taraValor) {
        await UPDATE(TicketsPesagem, ID).with({
          pesoBrutoValor: valor, status_code: 'DIVERGENCIA',
          divergenciaTipo: 'PESO_INVALIDO',
          divergenciaDesc: `PesoBruto (${valor}kg) ≤ Tara (${ticket.taraValor}kg)`
        })
        await this._audit(ID, 'DIVERGENCIA_DETECTADA', operadorId, 'AGUARDANDO_BRUTO',
          `DIVERGENCIA | tipo=PESO_INVALIDO | bruto=${valor} | tara=${ticket.taraValor}`)
        return SELECT.one.from(TicketsPesagem).where({ ID })
      }

      // BR-11: PesoLiquido não pode exceder saldo do contrato
      if (ticket.contrato_ID) {
        const contrato = await SELECT.one.from(ContratosSAP, ticket.contrato_ID)
        if (contrato && pesoLiquido > contrato.saldoRestante) {
          await UPDATE(TicketsPesagem, ID).with({
            pesoBrutoValor: valor, status_code: 'DIVERGENCIA',
            divergenciaTipo: 'EXCESSO_CONTRATO',
            divergenciaDesc: `PesoLíquido (${pesoLiquido}kg) > saldo do contrato (${contrato.saldoRestante}kg)`
          })
          await this._audit(ID, 'DIVERGENCIA_DETECTADA', operadorId, 'AGUARDANDO_BRUTO',
            `DIVERGENCIA | tipo=EXCESSO_CONTRATO | liquido=${pesoLiquido} | saldo=${contrato.saldoRestante}`)
          return SELECT.one.from(TicketsPesagem).where({ ID })
        }
      }

      await UPDATE(TicketsPesagem, ID).with({
        pesoBrutoValor: valor,
        pesoBrutoFonte_code: fonte,
        pesoBrutoTimestamp: new Date().toISOString(),
        pesoLiquidoValor: pesoLiquido,
        status_code: 'AGUARDANDO_DOCUMENTO'
      })

      await this._audit(ID, 'BRUTO_REGISTRADO', operadorId, 'AGUARDANDO_BRUTO',
        `bruto=${valor}kg | liquido=${pesoLiquido}kg | fonte=${fonte}`)

      // Simula emissão automática de DANFe/CTe (mock para protótipo)
      await this._emitirDocumentos(ID)

      return SELECT.one.from(TicketsPesagem).where({ ID })
    })

    // ─── US-05: Aprovar Divergência ───────────────────────────────────────────
    this.on('aprovarDivergencia', 'TicketsPesagem', async (req) => {
      const { coordenadorId, justificativa } = req.data
      const { ID } = req.params[0]

      if (!justificativa || justificativa.length < 20)
        return req.reject(400, 'JUSTIFICATIVA_INVALIDA: mínimo 20 caracteres')

      // BR-09: somente COORDENADOR
      const { Usuarios } = this.entities
      const user = await SELECT.one.from(Usuarios).where({ ID: coordenadorId })
      if (!user || user.perfil_code !== 'COORDENADOR')
        return req.reject(403, 'PERMISSAO_NEGADA')

      const n = await UPDATE(TicketsPesagem, ID)
        .where({ status_code: 'DIVERGENCIA' })
        .with({ status_code: 'AGUARDANDO_DOCUMENTO' })
      if (!n) return req.reject(409, 'STATUS_INVALIDO')

      await this._audit(ID, 'DIVERGENCIA_APROVADA', coordenadorId, 'DIVERGENCIA',
        `AGUARDANDO_DOCUMENTO | justificativa=${justificativa}`)

      await this._emitirDocumentos(ID)
      return SELECT.one.from(TicketsPesagem).where({ ID })
    })

    // ─── US-04: Liberar caminhão ──────────────────────────────────────────────
    this.on('liberarCaminhao', 'TicketsPesagem', async (req) => {
      const { operadorId } = req.data
      const { ID } = req.params[0]

      const ticket = await SELECT.one.from(TicketsPesagem).where({ ID })
      if (!ticket) return req.reject(404, 'NAO_ENCONTRADO')

      // BR-04: documentos autorizados
      if (ticket.danfeStatus !== 'AUTORIZADO' || ticket.cteStatus !== 'AUTORIZADO')
        return req.reject(403, 'DOCUMENTOS_PENDENTES')

      await UPDATE(TicketsPesagem, ID).with({
        status_code: 'CONCLUIDO',
        concluidoEm: new Date().toISOString()
      })

      await this._audit(ID, 'CAMINHAO_LIBERADO', operadorId, 'AGUARDANDO_DOCUMENTO', 'CONCLUIDO')

      // BR-07: dispara sincronização SAP (mock)
      await this._sincronizarSAP(ID)

      return SELECT.one.from(TicketsPesagem).where({ ID })
    })

    // ─── US-06: Fila de espera ────────────────────────────────────────────────
    this.on('filaEspera', async (req) => {
      const { fazendaId } = req.data

      const fazenda = await SELECT.one.from(Fazendas).where({ ID: fazendaId })
      if (!fazenda) return req.reject(404, 'NAO_ENCONTRADO')

      const fila = await SELECT.from(TicketsPesagem)
        .where({ fazenda_ID: fazendaId })
        .and({ status_code: ['AGUARDANDO_TARA', 'AGUARDANDO_BRUTO'] })
        .orderBy('createdAt asc')

      const quantidadeAtual = fila.length

      // Calcula tempo médio baseado nos últimos 10 tickets concluídos
      const concluidos = await SELECT.from(TicketsPesagem)
        .where({ fazenda_ID: fazendaId, status_code: 'CONCLUIDO' })
        .orderBy('concluidoEm desc').limit(10)

      let tempoMedioEspera = 0
      if (concluidos.length > 0) {
        const tempos = concluidos
          .filter(t => t.concluidoEm && t.createdAt)
          .map(t => (new Date(t.concluidoEm) - new Date(t.createdAt)) / 60000)
        tempoMedioEspera = tempos.length
          ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
          : 0
      }

      return {
        fazendaId,
        thresholdFila: fazenda.thresholdFila,
        quantidadeAtual,
        alertaAtivo: quantidadeAtual > fazenda.thresholdFila,
        tempoMedioEspera,
        atualizadoEm: new Date().toISOString()
      }
    })

    // ─── US-08: Relatório de turno ────────────────────────────────────────────
    this.on('relatorioDeTurno', async (req) => {
      const { fazendaId, data } = req.data

      const tickets = await SELECT.from(TicketsPesagem)
        .where({ fazenda_ID: fazendaId })
        .and(`createdAt >= '${data}T00:00:00Z' AND createdAt <= '${data}T23:59:59Z'`)

      const concluidos   = tickets.filter(t => t.status_code === 'CONCLUIDO')
      const divergencias = tickets.filter(t => t.status_code === 'DIVERGENCIA')
      const pendenteSAP  = tickets.filter(t => !t.sincronizadoSAP && t.status_code === 'CONCLUIDO')
      const volumeTotal  = concluidos.reduce((s, t) => s + (t.pesoLiquidoValor || 0), 0)

      const tempos = concluidos
        .filter(t => t.concluidoEm && t.createdAt)
        .map(t => (new Date(t.concluidoEm) - new Date(t.createdAt)) / 60000)
      const tempoMedio = tempos.length
        ? tempos.reduce((a, b) => a + b, 0) / tempos.length
        : 0

      return {
        totalTickets:        tickets.length,
        ticketsConcluidos:   concluidos.length,
        ticketsDivergencia:  divergencias.length,
        ticketsPendenteSAP:  pendenteSAP.length,
        volumeTotalKg:       parseFloat(volumeTotal.toFixed(3)),
        tempoMedioPesagemMin: parseFloat(tempoMedio.toFixed(2))
      }
    })

    await super.init()
  }

  // ─── Helpers privados ──────────────────────────────────────────────────────

  async _audit(ticketId, acao, operadorId, valorAntes, valorDepois) {
    const { TrilhaAuditoria } = this.entities
    await INSERT.into(TrilhaAuditoria).entries({
      ID:         cds.utils.uuid(),
      ticket_ID:  ticketId,
      acao,
      operadorId: operadorId || null,
      fonte:      operadorId ? 'USUARIO_MANUAL' : 'SISTEMA_AUTOMATICO',
      valorAntes: valorAntes || null,
      valorDepois,
      ocorridoEm: new Date().toISOString()
    })
  }

  async _emitirDocumentos(ticketId) {
    const { TicketsPesagem } = this.entities
    // Mock: simula autorização SEFAZ para o protótipo
    const chaveBase = ticketId.replace(/-/g, '').substring(0, 44).padEnd(44, '0')
    await UPDATE(TicketsPesagem, ticketId).with({
      danfeNumero:  `NF-${Date.now()}`,
      danfeChave:   chaveBase,
      danfeStatus:  'AUTORIZADO',
      danfeEmitidoEm: new Date().toISOString(),
      danfeUrl:     `/documentos/${ticketId}/danfe.pdf`,
      cteNumero:    `CT-${Date.now()}`,
      cteChave:     chaveBase.split('').reverse().join(''),
      cteStatus:    'AUTORIZADO',
      cteEmitidoEm: new Date().toISOString(),
      cteUrl:       `/documentos/${ticketId}/cte.pdf`
    })
    await this._audit(ticketId, 'DOCUMENTOS_EMITIDOS', null, 'AGUARDANDO_DOCUMENTO',
      'danfe=AUTORIZADO | cte=AUTORIZADO')
  }

  async _sincronizarSAP(ticketId) {
    const { TicketsPesagem } = this.entities
    // Mock: simula envio ao SAP HANA via CPI
    await UPDATE(TicketsPesagem, ticketId).with({
      sincronizadoSAP: true,
      sapDocumentId:   `ZWB-${Date.now()}`
    })
    await this._audit(ticketId, 'SINCRONIZADO_SAP', null, 'CONCLUIDO',
      `sapDocumentId=ZWB-${Date.now()}`)
  }
}
