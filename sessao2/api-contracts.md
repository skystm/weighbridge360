# API Contracts — WeighBridge 360

## Convenções Gerais

**Base URL:** `https://<btp-subdomain>.cfapps.<region>.hana.ondemand.com/api/v1`
**Autenticação:** Bearer Token via SAP XSUAA (OAuth 2.0)
**Formato:** JSON (Content-Type: application/json)
**Versionamento:** Prefixo `/v1/` na URL — versões novas não quebram contratos anteriores
**Idioma dos campos:** Português — termos exatamente conforme domain-glossary.md
**Timestamps:** ISO 8601 com timezone UTC (`2026-07-28T13:24:00Z`)
**IDs:** UUID v4

---

## Recurso: TicketPesagem

### POST /tickets
**Descrição:** Registra o check-in de um caminhão na fazenda, valida a placa contra o ContratoSAP ativo e cria o TicketPesagem com status AGUARDANDO_TARA.
**Story relacionada:** US-01

**Request:**
```json
{
  "fazendaId": "uuid (obrigatório) — ID da fazenda onde ocorre o check-in",
  "placa": "string (obrigatório) — formato Mercosul ABC1D23 ou antigo ABC-1234",
  "fonteIdentificacao": "string (obrigatório) — OCR_AUTOMATICO | DIGITACAO_MANUAL",
  "confiancaOCR": "decimal (obrigatório se fonte=OCR_AUTOMATICO) — valor entre 0.0 e 1.0",
  "operadorId": "uuid (obrigatório) — ID do Porteiro ou Balanceiro realizando o check-in"
}
```

**Response 201 — Ticket criado:**
```json
{
  "ticketId": "uuid",
  "fazendaId": "uuid",
  "placa": "ABC1D23",
  "fonteIdentificacao": "OCR_AUTOMATICO",
  "contrato": {
    "contratoId": "string",
    "produto": "SOJA | ALGODAO | MILHO | PECUARIA",
    "transportadora": "string",
    "saldoRestante": "decimal (kg)",
    "validoAte": "date"
  },
  "status": "AGUARDANDO_TARA",
  "criadoEm": "datetime ISO 8601"
}
```

**Response 400 — Placa inválida:**
```json
{
  "erro": "PLACA_INVALIDA",
  "mensagem": "Formato de placa inválido. Use Mercosul (ABC1D23) ou formato antigo (ABC-1234).",
  "campo": "placa"
}
```

**Response 403 — Placa não autorizada:**
```json
{
  "erro": "PLACA_NAO_AUTORIZADA",
  "mensagem": "Placa ABC1D23 não encontrada em nenhum contrato ativo para esta fazenda.",
  "campo": "placa"
}
```

**Response 403 — Contrato sem saldo:**
```json
{
  "erro": "CONTRATO_SEM_SALDO",
  "mensagem": "Contrato [ID] encerrado. Saldo restante: 0 kg.",
  "campo": "placa"
}
```

**Response 409 — Ticket ativo já existe:**
```json
{
  "erro": "TICKET_ATIVO_EXISTENTE",
  "mensagem": "Já existe um TicketPesagem ativo para a placa ABC1D23 nesta fazenda.",
  "ticketId": "uuid do ticket existente"
}
```

**Regras de negócio aplicadas:**
- BR-08: bloqueia criação se já existe ticket ativo para a placa na fazenda
- BR-10: valida placa contra ContratoSAP — ativo, vigente e com saldo
- BR-12: confiancaOCR < 0.85 retorna 400 com campo `confirmacaoNecessaria: true`

---

### PATCH /tickets/{ticketId}/tara
**Descrição:** Registra a Tara do caminhão (Pesagem 1). Avança o TicketPesagem para AGUARDANDO_CARGA e publica o evento TaraRegistrada.
**Story relacionada:** US-02

**Request:**
```json
{
  "valor": "decimal (obrigatório) — peso em kg capturado pelo sensor ou digitado",
  "fonte": "string (obrigatório) — SENSOR_AUTOMATICO | MANUAL_CONFIRMADO",
  "motivoManual": "string (obrigatório se fonte=MANUAL_CONFIRMADO) — justificativa da entrada manual",
  "operadorId": "uuid (obrigatório) — Balanceiro confirmando a Tara"
}
```

**Response 200 — Tara registrada:**
```json
{
  "ticketId": "uuid",
  "tara": {
    "valor": "decimal",
    "unidade": "kg",
    "fonte": "SENSOR_AUTOMATICO",
    "timestamp": "datetime ISO 8601"
  },
  "status": "AGUARDANDO_CARGA",
  "trilhaAuditoria": {
    "ultimoEvento": {
      "acao": "TARA_REGISTRADA",
      "operadorId": "uuid",
      "timestamp": "datetime ISO 8601"
    }
  }
}
```

**Response 400 — Peso fora dos limites:**
```json
{
  "erro": "PESO_INVALIDO",
  "mensagem": "Peso deve ser maior que 0 e menor que 150.000 kg.",
  "campo": "valor"
}
```

**Response 400 — Motivo manual ausente:**
```json
{
  "erro": "MOTIVO_OBRIGATORIO",
  "mensagem": "Para entrada manual, o campo motivoManual é obrigatório.",
  "campo": "motivoManual"
}
```

**Response 409 — Status incorreto:**
```json
{
  "erro": "STATUS_INVALIDO",
  "mensagem": "TicketPesagem não está em status AGUARDANDO_TARA. Status atual: [status].",
  "statusAtual": "string"
}
```

**Regras de negócio aplicadas:**
- BR-01: só aceita se status = AGUARDANDO_TARA
- BR-14: fonte MANUAL_CONFIRMADO exige motivoManual preenchido
- Valor deve estar dentro dos limites do Value Object Peso (0 < valor ≤ 150.000)

---

### PATCH /tickets/{ticketId}/carregamento
**Descrição:** Registra o início do carregamento — caminhão liberado para o silo. Avança para AGUARDANDO_BRUTO.
**Story relacionada:** US-03

**Request:**
```json
{
  "operadorId": "uuid (obrigatório) — Balanceiro registrando o início"
}
```

**Response 200:**
```json
{
  "ticketId": "uuid",
  "status": "AGUARDANDO_BRUTO",
  "cargaIniciadaEm": "datetime ISO 8601"
}
```

---

### PATCH /tickets/{ticketId}/peso-bruto
**Descrição:** Registra o Peso Bruto (Pesagem 2), calcula automaticamente o PesoLiquido e dispara emissão de DANFe/CTe se válido. Em caso de divergência, bloqueia o ticket.
**Story relacionada:** US-03, US-04, US-05

**Request:**
```json
{
  "valor": "decimal (obrigatório) — peso bruto em kg",
  "fonte": "string (obrigatório) — SENSOR_AUTOMATICO | MANUAL_CONFIRMADO",
  "motivoManual": "string (obrigatório se fonte=MANUAL_CONFIRMADO)",
  "operadorId": "uuid (obrigatório)"
}
```

**Response 200 — Peso Bruto válido, documentos disparados:**
```json
{
  "ticketId": "uuid",
  "pesoBruto": {
    "valor": "decimal",
    "unidade": "kg",
    "fonte": "SENSOR_AUTOMATICO",
    "timestamp": "datetime ISO 8601"
  },
  "pesoLiquido": {
    "valor": "decimal",
    "unidade": "kg"
  },
  "status": "AGUARDANDO_DOCUMENTO",
  "documentos": {
    "emissaoDisparada": true,
    "previsaoEmissao": "datetime ISO 8601 (estimativa)"
  }
}
```

**Response 200 — Divergência detectada:**
```json
{
  "ticketId": "uuid",
  "status": "DIVERGENCIA",
  "divergencia": {
    "tipo": "PESO_INVALIDO | EXCESSO_CONTRATO",
    "descricao": "PesoBruto (18.200 kg) é menor ou igual à Tara (18.500 kg).",
    "valorRegistrado": "decimal",
    "valorEsperado": "string (descrição do limite)"
  },
  "acaoNecessaria": "Aprovação do Coordenador obrigatória para prosseguir."
}
```

**Regras de negócio aplicadas:**
- BR-02: PesoBruto ≤ Tara → DIVERGENCIA tipo PESO_INVALIDO
- BR-11: PesoLiquido > saldoRestante do contrato → DIVERGENCIA tipo EXCESSO_CONTRATO
- BR-05: emissão automática disparada se peso válido

---

### PATCH /tickets/{ticketId}/divergencia/aprovar
**Descrição:** Coordenador aprova um TicketPesagem em status DIVERGENCIA, registrando justificativa e retomando o fluxo.
**Story relacionada:** US-05

**Request:**
```json
{
  "coordenadorId": "uuid (obrigatório) — deve ter perfil COORDENADOR",
  "justificativa": "string (obrigatório, min 20 caracteres) — motivo da aprovação"
}
```

**Response 200:**
```json
{
  "ticketId": "uuid",
  "status": "AGUARDANDO_DOCUMENTO",
  "divergenciaAprovada": {
    "coordenadorId": "uuid",
    "justificativa": "string",
    "aprovadoEm": "datetime ISO 8601"
  }
}
```

**Response 403 — Perfil insuficiente:**
```json
{
  "erro": "PERMISSAO_NEGADA",
  "mensagem": "Somente usuários com perfil COORDENADOR podem aprovar divergências."
}
```

**Regras de negócio aplicadas:**
- BR-09: somente COORDENADOR pode aprovar

---

### PATCH /tickets/{ticketId}/liberar
**Descrição:** Confirma a saída física do caminhão da fazenda. Só permitido com DANFe e CTe AUTORIZADOS. Dispara sincronização SAP via CPI.
**Story relacionada:** US-04, US-07

**Request:**
```json
{
  "operadorId": "uuid (obrigatório)"
}
```

**Response 200:**
```json
{
  "ticketId": "uuid",
  "status": "CONCLUIDO",
  "concluidoEm": "datetime ISO 8601",
  "sincronizacaoSAP": {
    "iniciada": true,
    "status": "PENDENTE_SAP | SINCRONIZADO"
  }
}
```

**Response 403 — Documentos não autorizados:**
```json
{
  "erro": "DOCUMENTOS_PENDENTES",
  "mensagem": "Não é possível liberar o caminhão. DANFe e/ou CTe aguardando autorização SEFAZ."
}
```

**Regras de negócio aplicadas:**
- BR-04: DANFe e CTe devem ter status AUTORIZADO
- BR-07: dispara sincronização SAP ao liberar

---

### GET /tickets/{ticketId}
**Descrição:** Retorna o estado completo de um TicketPesagem incluindo pesos, documentos e TrilhaAuditoria.
**Story relacionada:** US-02, US-03, US-08

**Response 200:**
```json
{
  "ticketId": "uuid",
  "fazendaId": "uuid",
  "placa": "string",
  "motorista": { "nome": "string", "cpf": "string" },
  "produto": "SOJA | ALGODAO | MILHO | PECUARIA",
  "contratoId": "string",
  "tara": { "valor": "decimal", "unidade": "kg", "fonte": "string", "timestamp": "datetime" },
  "pesoBruto": { "valor": "decimal", "unidade": "kg", "fonte": "string", "timestamp": "datetime" },
  "pesoLiquido": { "valor": "decimal", "unidade": "kg" },
  "status": "AGUARDANDO_TARA | AGUARDANDO_CARGA | AGUARDANDO_BRUTO | AGUARDANDO_DOCUMENTO | CONCLUIDO | DIVERGENCIA | PENDENTE_SAP",
  "documentos": {
    "danfe": { "numero": "string", "chaveAcesso": "string", "status": "string", "url": "string", "emitidoEm": "datetime" },
    "cte":  { "numero": "string", "chaveAcesso": "string", "status": "string", "url": "string", "emitidoEm": "datetime" }
  },
  "sincronizadoSAP": "boolean",
  "trilhaAuditoria": [
    { "acao": "string", "operadorId": "uuid | null", "fonte": "string", "timestamp": "datetime", "valorAntes": "string", "valorDepois": "string" }
  ],
  "criadoEm": "datetime",
  "concluidoEm": "datetime | null"
}
```

**Response 404:**
```json
{
  "erro": "NAO_ENCONTRADO",
  "mensagem": "TicketPesagem não encontrado."
}
```

---

### GET /tickets?fazendaId={id}&status={status}&data={date}
**Descrição:** Lista TicketsPesagem de uma fazenda com filtros opcionais por status e data. Usado pelo dashboard do Coordenador e relatório de turno.
**Story relacionada:** US-06, US-08

**Query params:**
```
fazendaId  uuid    (obrigatório)
status     string  (opcional) — AGUARDANDO_TARA | DIVERGENCIA | CONCLUIDO | PENDENTE_SAP
data       date    (opcional) — formato YYYY-MM-DD, padrão = hoje
page       int     (opcional) — padrão 1
pageSize   int     (opcional) — padrão 20, máximo 100
```

**Response 200:**
```json
{
  "total": "integer",
  "page": "integer",
  "pageSize": "integer",
  "tickets": [
    {
      "ticketId": "uuid",
      "placa": "string",
      "produto": "string",
      "status": "string",
      "pesoLiquido": "decimal | null",
      "operadorId": "uuid",
      "criadoEm": "datetime",
      "concluidoEm": "datetime | null"
    }
  ]
}
```

---

## Recurso: FilaEspera

### GET /fazendas/{fazendaId}/fila
**Descrição:** Retorna a FilaEspera atual da fazenda em tempo real — tickets aguardando Pesagem 1 ou Pesagem 2. Usado pelo dashboard do Coordenador.
**Story relacionada:** US-06

**Response 200:**
```json
{
  "fazendaId": "uuid",
  "thresholdFila": "integer",
  "quantidadeAtual": "integer",
  "alertaAtivo": "boolean",
  "tempoMedioEspera": "integer (minutos)",
  "atualizadoEm": "datetime ISO 8601",
  "caminhoes": [
    {
      "ticketId": "uuid",
      "placa": "string",
      "produto": "string",
      "status": "AGUARDANDO_TARA | AGUARDANDO_BRUTO",
      "esperandoHa": "integer (minutos)",
      "posicaoNaFila": "integer"
    }
  ]
}
```

---

## Recurso: Relatório de Turno

### GET /fazendas/{fazendaId}/relatorio-turno?data={date}&turno={turno}
**Descrição:** Gera o relatório consolidado do turno para o Balanceiro fechar o dia sem planilha.
**Story relacionada:** US-08

**Query params:**
```
data    date    (obrigatório) — YYYY-MM-DD
turno   string  (opcional)   — MANHA | TARDE | NOITE
```

**Response 200:**
```json
{
  "fazendaId": "uuid",
  "data": "date",
  "turno": "string",
  "resumo": {
    "totalTickets": "integer",
    "ticketsConcluidos": "integer",
    "ticketsDivergencia": "integer",
    "ticketsPendenteSAP": "integer",
    "volumeTotalKg": "decimal",
    "tempoMedioPesagemMin": "decimal"
  },
  "volumePorProduto": [
    { "produto": "string", "totalKg": "decimal", "totalTickets": "integer" }
  ],
  "pendentes": [
    { "ticketId": "uuid", "placa": "string", "status": "string", "motivo": "string" }
  ]
}
```

---

## Integração SAP

### APIs SAP Consumidas

| API SAP | Endpoint | Finalidade | Autenticação |
|---------|---------|-----------|-------------|
| SAP S/4HANA OData | `/sap/opu/odata/sap/API_SALES_CONTRACT_SRV` | Buscar ContratosSAP ativos por fazenda e placa | OAuth 2.0 XSUAA |
| SAP S/4HANA OData | `/sap/opu/odata/sap/API_BUSINESS_PARTNER` | Validar transportadora e motorista | OAuth 2.0 XSUAA |
| SAP Integration Suite (CPI) | iFlow `WB360_TicketToHANA` | Enviar TicketPesagem concluído ao SAP HANA | Client Credentials |
| SAP SEFAZ Integration | Via SAP Document and Reporting Compliance | Emitir DANFe e CTe | Certificate + OAuth |

### Mapeamento SAP → Domínio

| Campo SAP | Campo do Domínio | Transformação |
|-----------|-----------------|--------------|
| `SalesContract` | `contratoId` | Mapeamento direto |
| `SalesContractItem.Material` | `produto` | Lookup: código SAP → enum SOJA/ALGODAO/MILHO/PECUARIA |
| `SalesContractItem.OrderQuantity` | `quantidadeTotal` | Conversão para kg se unidade diferente |
| `SalesContractItem.OpenQuantity` | `saldoRestante` | Calculado: OrderQuantity − executado |
| `AuthorizedPlates (Z-field)` | `placasAutorizadas` | Campo customizado Z no contrato SAP |
| `ValidityStartDate` | `validoDe` | Date format SAP → ISO 8601 |
| `ValidityEndDate` | `validoAte` | Date format SAP → ISO 8601 |

### Payload CPI — TicketPesagem → SAP HANA

```json
{
  "ZWB_TICKET_ID": "uuid",
  "ZWB_FAZENDA_ID": "uuid",
  "ZWB_PLACA": "string",
  "ZWB_PRODUTO": "string",
  "ZWB_CONTRATO_SAP": "string",
  "ZWB_TARA_KG": "decimal",
  "ZWB_PESO_BRUTO_KG": "decimal",
  "ZWB_PESO_LIQUIDO_KG": "decimal",
  "ZWB_DANFE_CHAVE": "string",
  "ZWB_CTE_CHAVE": "string",
  "ZWB_OPERADOR_ID": "uuid",
  "ZWB_CRIADO_EM": "datetime ISO 8601",
  "ZWB_CONCLUIDO_EM": "datetime ISO 8601",
  "ZWB_FONTE_TARA": "string",
  "ZWB_FONTE_BRUTO": "string",
  "ZWB_MODO_OFFLINE": "boolean"
}
```

---

## Códigos de Erro — Referência Rápida

| Código HTTP | Erro | Quando ocorre |
|-------------|------|--------------|
| 400 | `CAMPO_INVALIDO` | Campo obrigatório ausente ou formato incorreto |
| 400 | `PESO_INVALIDO` | Valor fora dos limites (≤0 ou >150.000 kg) |
| 400 | `MOTIVO_OBRIGATORIO` | Entrada manual sem justificativa |
| 400 | `OCR_BAIXA_CONFIANCA` | confiancaOCR < 0.85 — requer confirmação manual |
| 403 | `PLACA_NAO_AUTORIZADA` | Placa não consta em contrato ativo |
| 403 | `CONTRATO_SEM_SALDO` | Contrato com saldoRestante = 0 |
| 403 | `PERMISSAO_NEGADA` | Perfil insuficiente para a ação |
| 403 | `DOCUMENTOS_PENDENTES` | Tentativa de liberar caminhão sem documentos autorizados |
| 409 | `TICKET_ATIVO_EXISTENTE` | Placa já tem ticket ativo na fazenda |
| 409 | `STATUS_INVALIDO` | Ação incompatível com o status atual do ticket |
| 503 | `SEFAZ_INDISPONIVEL` | SEFAZ não respondeu — retry automático ativo |
| 503 | `SAP_INDISPONIVEL` | SAP HANA/CPI indisponível — ticket em PENDENTE_SAP |
