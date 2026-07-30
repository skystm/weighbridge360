# Test Scenarios — WeighBridge 360

---

## Cenários para US-01: Check-in automático por OCR de placa

### TC-01.1: Happy Path — OCR lê placa com alta confiança
**Tipo:** End-to-End
**Prioridade:** Crítica

**Pré-condições:**
- ContratoSAP ativo com placa ABC1D23 cadastrada, saldo restante = 24.700 kg, vigência válida
- Fazenda Paiaguás operacional, câmera OCR funcionando
- Porteiro autenticado com perfil PORTEIRO

**Passos:**
1. Caminhão ABC1D23 se aproxima da câmera OCR
2. Sistema captura imagem e processa leitura
3. confiancaOCR retorna 0.94
4. Sistema valida placa contra ContratosSAP ativos da fazenda
5. Sistema cria TicketPesagem automaticamente

**Resultado esperado:**
- TicketPesagem criado com status AGUARDANDO_TARA
- Tela exibe: placa, produto (SOJA), transportadora, saldo restante (24.700 kg)
- TrilhaAuditoria registra: acao=CHECK_IN, fonte=OCR_AUTOMATICO, confiancaOCR=0.94
- Resposta HTTP 201 em < 2 segundos

**Dados de teste:**
```json
{
  "input": { "fazendaId": "uuid-paiaguas", "placa": "ABC1D23", "fonteIdentificacao": "OCR_AUTOMATICO", "confiancaOCR": 0.94, "operadorId": "uuid-porteiro" },
  "expected": { "status": "AGUARDANDO_TARA", "contrato.produto": "SOJA", "contrato.saldoRestante": 24700 }
}
```

---

### TC-01.2: Edge Case — OCR com confiança abaixo do threshold
**Tipo:** Integration
**Prioridade:** Alta

**Cenário:** Placa suja ou câmera com baixa luminosidade — confiancaOCR = 0.72

**Pré-condições:**
- Mesmas do TC-01.1, mas sensor retorna confiancaOCR = 0.72

**Resultado esperado:**
- Sistema NÃO cria TicketPesagem automaticamente
- Resposta HTTP 400 com `confirmacaoNecessaria: true` e placa sugerida
- Porteiro visualiza campo de confirmação/correção manual
- Após confirmação manual: TicketPesagem criado com fonte=DIGITACAO_MANUAL

---

### TC-01.3: Failure — Placa não encontrada em nenhum contrato ativo
**Tipo:** Unit
**Prioridade:** Alta

**Entrada inválida:**
```json
{ "fazendaId": "uuid-paiaguas", "placa": "XYZ9Z99", "fonteIdentificacao": "OCR_AUTOMATICO", "confiancaOCR": 0.95, "operadorId": "uuid-porteiro" }
```

**Resultado esperado:**
- HTTP 403, erro PLACA_NAO_AUTORIZADA
- Mensagem: "Placa XYZ9Z99 não encontrada em nenhum contrato ativo para esta fazenda."
- Nenhum TicketPesagem criado
- Sistema permanece em estado consistente

---

### TC-01.4: Failure — Ticket ativo já existente para a placa
**Tipo:** Unit
**Prioridade:** Alta

**Cenário:** Placa ABC1D23 já tem TicketPesagem com status AGUARDANDO_BRUTO

**Resultado esperado:**
- HTTP 409, erro TICKET_ATIVO_EXISTENTE
- Resposta inclui ticketId do ticket existente
- Nenhum novo TicketPesagem criado

---

## Cenários para US-02: Registro automático da Tara

### TC-02.1: Happy Path — Sensor captura Tara e Balanceiro confirma
**Tipo:** End-to-End
**Prioridade:** Crítica

**Pré-condições:**
- TicketPesagem ABC1D23 com status AGUARDANDO_TARA
- Sensor da balança operacional (status=OPERACIONAL)
- Balanceiro autenticado

**Passos:**
1. Caminhão vazio posiciona na balança
2. Sensor registra 3 leituras estáveis: 18.490, 18.500, 18.498 kg (variação < precisão)
3. Sistema exibe Tara sugerida: 18.500 kg
4. Balanceiro confirma o valor

**Resultado esperado:**
- Tara registrada: 18.500 kg, fonte=SENSOR_AUTOMATICO
- Status avança para AGUARDANDO_CARGA
- TrilhaAuditoria: acao=TARA_REGISTRADA, valor=18500, fonte=SENSOR_AUTOMATICO, operadorId, timestamp
- Evento TaraRegistrada publicado
- Dado persistido imediatamente (auto-save)

**Dados de teste:**
```json
{
  "input": { "valor": 18500, "fonte": "SENSOR_AUTOMATICO", "operadorId": "uuid-balanceiro" },
  "expected": { "tara.valor": 18500, "tara.fonte": "SENSOR_AUTOMATICO", "status": "AGUARDANDO_CARGA" }
}
```

---

### TC-02.2: Edge Case — Sensor offline, entrada manual com justificativa
**Tipo:** Integration
**Prioridade:** Alta

**Cenário:** Balança com status=OFFLINE — Balanceiro precisa inserir peso manualmente

**Passos:**
1. Sistema detecta sensor offline e exibe aviso
2. Balanceiro seleciona "Entrada manual"
3. Digita 18.500 kg e preenche motivoManual: "Sensor com falha técnica — aguardando manutenção"
4. Confirma

**Resultado esperado:**
- Tara registrada com fonte=MANUAL_CONFIRMADO
- TrilhaAuditoria registra motivo da entrada manual
- Status avança para AGUARDANDO_CARGA normalmente

---

### TC-02.3: Failure — Peso fora dos limites operacionais
**Tipo:** Unit
**Prioridade:** Média

**Entrada inválida:**
```json
{ "valor": 0, "fonte": "SENSOR_AUTOMATICO", "operadorId": "uuid-balanceiro" }
```

**Resultado esperado:**
- HTTP 400, erro PESO_INVALIDO
- Mensagem: "Peso deve ser maior que 0 e menor que 150.000 kg."
- Status do TicketPesagem permanece AGUARDANDO_TARA

---

### TC-02.4: Failure — Ação em status incorreto
**Tipo:** Unit
**Prioridade:** Alta

**Cenário:** Tentativa de registrar Tara em ticket com status AGUARDANDO_BRUTO

**Resultado esperado:**
- HTTP 409, erro STATUS_INVALIDO
- Mensagem informa status atual do ticket
- Nenhuma alteração no ticket

---

## Cenários para US-03: Registro do Peso Bruto

### TC-03.1: Happy Path — Peso Bruto válido, PesoLiquido calculado
**Tipo:** End-to-End
**Prioridade:** Crítica

**Pré-condições:**
- TicketPesagem com status AGUARDANDO_BRUTO, Tara = 18.500 kg
- ContratoSAP com saldoRestante = 30.000 kg

**Passos:**
1. Caminhão carregado retorna à balança
2. Sensor estabiliza em 43.200 kg
3. Sistema calcula: PesoLiquido = 43.200 − 18.500 = 24.700 kg
4. Valida: 24.700 < 30.000 (saldo OK), 43.200 > 18.500 (bruto > tara OK)
5. Balanceiro confirma

**Resultado esperado:**
- PesoBruto = 43.200 kg, PesoLiquido = 24.700 kg (calculado, não digitado)
- Status avança para AGUARDANDO_DOCUMENTO
- Emissão de DANFe/CTe disparada automaticamente
- Evento PesoBrutoRegistrado publicado

**Dados de teste:**
```json
{
  "input": { "valor": 43200, "fonte": "SENSOR_AUTOMATICO", "operadorId": "uuid-balanceiro" },
  "expected": { "pesoBruto.valor": 43200, "pesoLiquido.valor": 24700, "status": "AGUARDANDO_DOCUMENTO", "documentos.emissaoDisparada": true }
}
```

---

### TC-03.2: Failure — PesoBruto menor que Tara (divergência)
**Tipo:** Integration
**Prioridade:** Crítica

**Cenário:** Sensor captura 18.200 kg (< Tara de 18.500 kg)

**Resultado esperado:**
- Status muda para DIVERGENCIA
- divergencia.tipo = PESO_INVALIDO
- Evento DivergenciaDetectada publicado
- Coordenador recebe alerta no dashboard
- TicketPesagem bloqueado até aprovação

---

### TC-03.3: Failure — PesoLiquido excede saldo do contrato
**Tipo:** Integration
**Prioridade:** Alta

**Cenário:** PesoLiquido calculado = 31.000 kg, saldoRestante = 30.000 kg

**Resultado esperado:**
- Status muda para DIVERGENCIA
- divergencia.tipo = EXCESSO_CONTRATO
- Evento DivergenciaDetectada publicado com tipo correto

---

## Cenários para US-04: Emissão automática de DANFe e CTe

### TC-04.1: Happy Path — Documentos emitidos em menos de 30 segundos
**Tipo:** End-to-End
**Prioridade:** Crítica

**Pré-condições:**
- TicketPesagem com status AGUARDANDO_DOCUMENTO
- Integração SEFAZ disponível

**Passos:**
1. Evento PesoBrutoRegistrado processado pelo contexto Fiscal
2. Sistema monta payload e envia à SEFAZ
3. SEFAZ retorna autorização

**Resultado esperado:**
- DANFe e CTe com status=AUTORIZADO em < 30 segundos
- chaveAcesso de 44 dígitos presente em ambos os documentos
- URLs de PDF disponíveis para download
- Evento DocumentosEmitidos publicado
- Status do TicketPesagem avança para CONCLUIDO

---

### TC-04.2: Failure — SEFAZ indisponível, retry automático
**Tipo:** Integration
**Prioridade:** Alta

**Cenário:** SEFAZ retorna timeout na primeira tentativa

**Resultado esperado:**
- Status permanece AGUARDANDO_DOCUMENTO
- Sistema agenda retry em 60 segundos
- Balanceiro visualiza: "Emissão fiscal em andamento. Aguarde."
- Após SEFAZ voltar: documentos emitidos e status avança normalmente

---

### TC-04.3: Failure — Tentativa de liberar caminhão sem documentos
**Tipo:** Unit
**Prioridade:** Crítica

**Cenário:** Balanceiro tenta chamar PATCH /tickets/{id}/liberar com DANFe ainda PENDENTE

**Resultado esperado:**
- HTTP 403, erro DOCUMENTOS_PENDENTES
- Mensagem: "Não é possível liberar o caminhão. DANFe e/ou CTe aguardando autorização SEFAZ."
- Status permanece AGUARDANDO_DOCUMENTO

---

## Cenários para US-05: Aprovação de Divergência pelo Coordenador

### TC-05.1: Happy Path — Coordenador aprova divergência com justificativa
**Tipo:** End-to-End
**Prioridade:** Crítica

**Pré-condições:**
- TicketPesagem com status DIVERGENCIA, tipo PESO_INVALIDO
- Usuário autenticado com perfil COORDENADOR

**Passos:**
1. Coordenador acessa alerta no dashboard SAC
2. Visualiza detalhes: Tara 18.500 kg, PesoBruto 18.200 kg
3. Registra justificativa: "Caminhão parcialmente descarregado por erro operacional. Peso conferido fisicamente."
4. Confirma aprovação

**Resultado esperado:**
- Status volta para AGUARDANDO_DOCUMENTO
- TrilhaAuditoria registra: acao=DIVERGENCIA_APROVADA, coordenadorId, justificativa, timestamp
- Evento DivergenciaAprovada publicado
- Fluxo retoma normalmente

---

### TC-05.2: Failure — Balanceiro tenta aprovar divergência
**Tipo:** Unit
**Prioridade:** Crítica

**Cenário:** Usuário com perfil BALANCEIRO tenta PATCH /tickets/{id}/divergencia/aprovar

**Resultado esperado:**
- HTTP 403, erro PERMISSAO_NEGADA
- Mensagem: "Somente usuários com perfil COORDENADOR podem aprovar divergências."
- Status permanece DIVERGENCIA

---

## Cenários para US-06: Monitoramento da Fila em tempo real

### TC-06.1: Happy Path — Dashboard exibe fila atualizada em tempo real
**Tipo:** End-to-End
**Prioridade:** Alta

**Pré-condições:**
- 5 tickets com status AGUARDANDO_TARA ou AGUARDANDO_BRUTO na fazenda Paiaguás
- ThresholdFila configurado = 8

**Resultado esperado:**
- GET /fazendas/{id}/fila retorna quantidadeAtual=5, alertaAtivo=false
- Dashboard exibe os 5 caminhões com tempo de espera estimado
- Dados atualizados sem refresh manual

---

### TC-06.2: Edge Case — Fila ultrapassa threshold, alerta disparado
**Tipo:** Integration
**Prioridade:** Alta

**Cenário:** 9º caminhão faz check-in, ThresholdFila = 8

**Resultado esperado:**
- Evento AlertaFilaDisparado publicado com fazendaId, quantidadeNaFila=9, threshold=8
- Dashboard exibe alerta destacado ao Coordenador
- alertaAtivo = true na resposta da API

---

## Cenários para US-07: Sincronização automática com SAP HANA

### TC-07.1: Happy Path — Ticket sincronizado ao SAP HANA via CPI
**Tipo:** Integration
**Prioridade:** Crítica

**Pré-condições:**
- TicketPesagem CONCLUIDO, CPI disponível, SAP HANA disponível

**Resultado esperado:**
- Evento CaminhaoLiberado capturado pela CPI
- Payload ZWB_* enviado ao HANA com todos os campos
- sincronizadoSAP = true no ticket
- Evento TicketSincronizadoSAP publicado com sapDocumentId
- Ticket visível no HANA em < 5 minutos

---

### TC-07.2: Edge Case — Modo Offline, sync em lote ao reconectar
**Tipo:** End-to-End
**Prioridade:** Crítica

**Cenário:** 3 tickets concluídos durante Modo Offline

**Passos:**
1. Sistema detecta perda de conectividade
2. 3 tickets criados e concluídos localmente
3. Conectividade restaurada

**Resultado esperado:**
- SincronizacaoRetomada publicado com ticketsSincronizados=3
- Todos os 3 tickets com sincronizadoSAP=true
- Ordem cronológica respeitada no HANA

---

### TC-07.3: Failure — SAP HANA indisponível, retry automático
**Tipo:** Integration
**Prioridade:** Alta

**Cenário:** CPI tenta enviar mas HANA retorna 503

**Resultado esperado:**
- Ticket marcado como PENDENTE_SAP
- Retry automático a cada 5 minutos
- Após 24h sem sucesso: Coordenador notificado
- Dado nunca perdido

---

## TC-DEMO: Fluxo Completo de Demonstração (Pitch)

**Duração estimada:** 4 minutos
**Tipo:** End-to-End Manual
**Prioridade:** Crítica

**Script:**

| # | O que o apresentador faz | O que aparece na tela | Momento WOW |
|---|--------------------------|----------------------|-------------|
| 1 | "Caminhão chegando na fazenda" — aciona câmera OCR | Placa lida automaticamente, dados do contrato carregados | ✨ Zero digitação na portaria |
| 2 | "Balanceiro confirma posição na balança" | Tara capturada: 18.500 kg — botão Confirmar | — |
| 3 | "Confirma Tara" — clica Confirmar | Status: AGUARDANDO_CARGA | — |
| 4 | "Caminhão vai ao silo, volta carregado" | Peso Bruto: 43.200 kg, PesoLiquido: 24.700 kg calculado | ✨ Cálculo automático |
| 5 | "Confirma Pesagem 2" | Tela mostra: "Emitindo DANFe e CTe..." | — |
| 6 | Aguarda < 30 segundos | DANFe e CTe AUTORIZADOS, PDF disponível | ✨ Documento em segundos, sem e-mail |
| 7 | "Caminhão liberado" — clica Liberar | Status: CONCLUIDO, sincronização SAP iniciada | — |
| 8 | Abre dashboard SAC no outro monitor | FilaEspera em tempo real, ticket recém concluído visível | ✨ Campo → ERP sem digitar nada |
| 9 | "E se o peso der errado?" — simula divergência | Ticket entra em DIVERGENCIA, alerta no dashboard | — |
| 10 | Coordenador aprova no dashboard | Fluxo retoma, justificativa na trilha de auditoria | ✨ Governança rastreável |

**Critérios de sucesso da demo:**
- [ ] Check-in OCR sem digitação manual
- [ ] Tara e Peso Bruto capturados pelo sensor
- [ ] DANFe/CTe emitidos em < 30 segundos
- [ ] TicketPesagem aparece no SAP HANA após liberação
- [ ] Dashboard SAC exibe fila em tempo real
- [ ] Fluxo de divergência demonstrável
- [ ] Nenhum crash ou tela em branco durante os 4 minutos
