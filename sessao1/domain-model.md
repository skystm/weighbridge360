# Domain Model — WeighBridge 360

## Core Domain
**Gestão do Ciclo de Pesagem Agrícola**
*O coração do negócio: garantir que cada carregamento de produto agrícola seja pesado, documentado e registrado no SAP de forma automática, rastreável e imutável — do campo ao ERP.*

---

## Entities and Aggregates

### TicketPesagem *(Aggregate Root)*
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| id | TicketId | Identificador único do ticket (UUID) |
| fazendaId | FazendaId | Fazenda onde ocorre a operação |
| balancaId | BalancaId | Balança física utilizada na operação |
| placa | Placa | Placa do caminhão (lida por OCR ou confirmada manualmente) |
| motorista | Motorista | Nome, CPF e CNH do motorista |
| transportadora | String | Nome da transportadora responsável |
| produto | Produto | Soja / Algodão / Milho / Pecuária |
| contratoId | ContratoId | Referência ao Contrato SAP vinculado |
| quantidadeContratada | Decimal | Quantidade (kg) prevista no contrato |
| tara | Peso | Peso registrado na Pesagem 1 (caminhão vazio) |
| pesoBruto | Peso | Peso registrado na Pesagem 2 (caminhão cheio) |
| pesoLiquido | Peso | Calculado automaticamente: pesoBruto − tara |
| status | StatusTicket | AGUARDANDO_TARA → AGUARDANDO_CARGA → AGUARDANDO_BRUTO → AGUARDANDO_DOCUMENTO → CONCLUIDO / DIVERGENCIA / PENDENTE_SAP |
| operadorId | UsuarioId | Balanceiro responsável pelo ticket no turno |
| trilhaAuditoria | TrilhaAuditoria | Log imutável append-only de todas as ações |
| danfe | Documento | DANFe emitido automaticamente após Pesagem 2 |
| cte | Documento | CTe emitido automaticamente após Pesagem 2 |
| modoOffline | Boolean | True se ticket foi criado/avançado sem conectividade |
| sincronizadoSAP | Boolean | True se ticket foi enviado com sucesso ao SAP HANA |
| criadoEm | DateTime | Timestamp de criação do ticket |
| taraRegistradaEm | DateTime | Timestamp da Pesagem 1 |
| cargaIniciadaEm | DateTime | Timestamp de início do carregamento |
| brutoRegistradoEm | DateTime | Timestamp da Pesagem 2 |
| concluidoEm | DateTime | Timestamp de conclusão e liberação |

**Behaviors:**
- `registrarCheckIn(placa, motorista, contratoId, operadorId)` → valida placa contra contrato SAP, cria ticket, status = AGUARDANDO_TARA, registra na trilha
- `registrarTara(peso, fonte, operadorId)` → registra tara (sensor ou manual), avança status para AGUARDANDO_CARGA, registra na trilha, dispara `TaraRegistrada`
- `iniciarCarregamento(operadorId)` → registra timestamp de início, avança status para AGUARDANDO_BRUTO, dispara `CarregamentoIniciado`
- `registrarPesoBruto(peso, fonte, operadorId)` → registra peso bruto, calcula peso líquido, valida contra tara e contrato, avança para AGUARDANDO_DOCUMENTO, dispara `PesoBrutoRegistrado`
- `emitirDocumentos()` → dispara DANFe e CTe via contexto Fiscal, avança para CONCLUIDO, dispara `DocumentosEmitidos`
- `liberarCaminhao(operadorId)` → confirma saída física, registra na trilha, dispara `CaminhaoLiberado`
- `sincronizarSAP()` → envia payload completo ao SAP HANA via CPI, atualiza sincronizadoSAP = true, dispara `TicketSincronizadoSAP`
- `sinalizarDivergencia(motivo, operadorId)` → move ticket para status DIVERGENCIA, registra motivo na trilha, dispara `DivergenciaDetectada`
- `aprovarDivergencia(coordenadorId, justificativa)` → coordenador aprova explicitamente, registra na trilha, retorna fluxo para AGUARDANDO_DOCUMENTO

**Invariants (regras que nunca podem ser violadas):**
- PesoBruto deve ser sempre maior que Tara (BR-02) — violação → DIVERGENCIA obrigatória
- Ticket só avança de status em sequência estrita — nunca retroage (BR-01)
- TrilhaAuditoria é append-only — nenhum EventoAuditoria pode ser alterado ou deletado (BR-03)
- DANFe e CTe só são emitidos após PesoBruto válido registrado (BR-04)
- Caminhão só é liberado com DANFe e CTe válidos e sincronização SAP confirmada (BR-04 + BR-07)
- Um caminhão (placa) não pode ter dois tickets ATIVOS na mesma fazenda simultaneamente (BR-08)
- Divergência só pode ser resolvida por usuário com perfil COORDENADOR (BR-09)

---

### Fazenda *(Entity)*
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| id | FazendaId | Identificador único |
| nome | String | Nome da fazenda (ex: Paiaguás) |
| codigo | String | Código SAP da filial |
| localizacao | Localizacao | Estado, município, coordenadas GPS |
| balanças | List\<BalancaId\> | IDs das balanças físicas instaladas |
| capacidadeDiaria | Integer | Caminhões/dia suportados pela operação |
| thresholdFila | Integer | Gatilho de alerta: caminhões na fila acima desse valor |
| produtos | List\<Produto\> | Produtos operados na fazenda |
| turnoInicio | Time | Horário de início do turno operacional |
| turnoFim | Time | Horário de encerramento do turno |
| ativa | Boolean | Fazenda com operação ativa |

**Behaviors:**
- `calcularFilaAtual()` → retorna tickets com status AGUARDANDO_TARA ou AGUARDANDO_BRUTO ordenados por criadoEm
- `calcularTempoMedioPesagem(periodo)` → média de (concluidoEm − criadoEm) dos tickets CONCLUIDOS no período
- `emitirAlertaFila()` → dispara `AlertaFilaDisparado` quando len(filaAtual) > thresholdFila
- `gerarRelatorioDeTurno(data, turno)` → consolida todos os tickets do turno com métricas: volume, tempo médio, divergências, tickets pendentes SAP

---

### Balanca *(Entity)*
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| id | BalancaId | Identificador único |
| fazendaId | FazendaId | Fazenda onde está instalada |
| modelo | String | Modelo e fabricante do equipamento |
| capacidadeMaxima | Decimal | Peso máximo suportado (kg) |
| precisao | Decimal | Margem de erro do equipamento (kg) |
| status | StatusBalanca | OPERACIONAL / MANUTENCAO / OFFLINE |
| ultimaLeitura | Peso | Último peso capturado pelo sensor |
| ultimaCalibracaoEm | DateTime | Data da última calibração realizada |
| temOCR | Boolean | True se possui câmera OCR integrada para leitura de placa |

**Behaviors:**
- `capturarPeso()` → aguarda estabilização do sensor (variação < precisao por 3 leituras consecutivas) e retorna Peso com fonte = SENSOR_AUTOMATICO
- `validarLeitura(peso)` → verifica se peso está dentro dos limites: 0 < valor < capacidadeMaxima
- `lerPlaca()` → aciona câmera OCR e retorna placa identificada ou null se leitura falhou
- `reportarStatus(status)` → atualiza status da balança, dispara `BalancaStatusAlterado` se mudou para OFFLINE ou MANUTENCAO

---

### ContratoSAP *(Entity)*
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| id | ContratoId | Identificador SAP do contrato |
| fazendaId | FazendaId | Fazenda onde o contrato será executado |
| transportadoraId | String | ID da transportadora no SAP |
| produto | Produto | Produto contratado |
| quantidadeTotal | Decimal | Quantidade total contratada (kg) |
| quantidadeExecutada | Decimal | Quantidade já pesada e concluída |
| saldoRestante | Decimal | quantidadeTotal − quantidadeExecutada |
| placasAutorizadas | List\<Placa\> | Placas autorizadas a operar neste contrato |
| validoDe | Date | Início da vigência |
| validoAte | Date | Fim da vigência |
| status | StatusContrato | ATIVO / ENCERRADO / SUSPENSO |

**Behaviors:**
- `validarPlaca(placa)` → verifica se placa consta em placasAutorizadas e contrato está ATIVO e dentro da vigência
- `registrarExecucao(pesoLiquido)` → incrementa quantidadeExecutada, recalcula saldoRestante
- `verificarSaldo()` → retorna true se saldoRestante > 0, false se contrato totalmente executado

---

### FilaEspera *(Entity — projeção em tempo real)*
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| fazendaId | FazendaId | Fazenda da fila |
| tickets | List\<TicketId\> | Tickets aguardando (AGUARDANDO_TARA ou AGUARDANDO_BRUTO) |
| quantidadeAtual | Integer | Total de caminhões na fila agora |
| tempoMedioEspera | Integer | Minutos médios de espera baseado nos últimos 10 tickets |
| atualizadoEm | DateTime | Último recálculo da fila |

**Behaviors:**
- `adicionarTicket(ticketId)` → insere ticket no final da fila, recalcula métricas
- `removerTicket(ticketId)` → remove ticket da fila (quando avança para carregamento ou conclui)
- `calcularTempoEsperaEstimado()` → tempoMedioEspera × quantidadeAtual

---

### Usuario *(Entity)*
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| id | UsuarioId | Identificador único |
| nome | String | Nome completo |
| cpf | String | CPF (identificação única) |
| perfil | Perfil | BALANCEIRO / COORDENADOR / PORTEIRO |
| fazendaId | FazendaId | Fazenda de atuação principal |
| turno | Turno | MANHA / TARDE / NOITE |
| ativo | Boolean | Usuário habilitado a operar |
| ultimoAcessoEm | DateTime | Timestamp do último login |

**Behaviors:**
- `podeAprovarDivergencia()` → true somente se perfil == COORDENADOR
- `podeOperarBalanca()` → true somente se perfil == BALANCEIRO e ativo == true
- `podeVisualizarDashboard()` → true se perfil == COORDENADOR ou PORTEIRO

---

### Peso *(Value Object)*
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| valor | Decimal | Valor numérico do peso |
| unidade | String | Sempre "kg" neste domínio |
| timestamp | DateTime | Momento exato da captura ou registro |
| fonte | FontePeso | SENSOR_AUTOMATICO / MANUAL_CONFIRMADO |

**Regra de validação:** valor deve ser > 0 e ≤ 150.000 kg (limite operacional de caminhão rodovíario brasileiro)
**Regra de fonte:** fonte MANUAL_CONFIRMADO exige registro explícito na TrilhaAuditoria do motivo da entrada manual

---

### TrilhaAuditoria *(Value Object — append-only)*
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| ticketId | TicketId | Ticket ao qual a trilha pertence |
| eventos | List\<EventoAuditoria\> | Lista imutável de eventos em ordem cronológica |

**EventoAuditoria:**
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| id | UUID | Identificador único do evento |
| acao | AcaoAuditoria | Enum: CHECK_IN / TARA_REGISTRADA / CARGA_INICIADA / BRUTO_REGISTRADO / DOCUMENTO_EMITIDO / CAMINHAO_LIBERADO / DIVERGENCIA_SINALIZADA / DIVERGENCIA_APROVADA / SINCRONIZADO_SAP / MODO_OFFLINE_ATIVADO |
| operadorId | UsuarioId | Quem executou (null para ações automáticas do sistema) |
| fonte | String | SISTEMA_AUTOMATICO / USUARIO_MANUAL |
| timestamp | DateTime | Quando ocorreu (UTC) |
| valorAntes | String | Estado ou valor anterior (se aplicável) |
| valorDepois | String | Estado ou valor resultante |
| metadados | Map\<String,String\> | Dados adicionais contextuais (ex: motivo de divergência) |

**Regras de invariância:**
- Nenhum EventoAuditoria pode ser removido ou alterado após inserido
- Eventos são sempre inseridos em ordem cronológica crescente
- Ações automáticas do sistema registram operadorId = null e fonte = SISTEMA_AUTOMATICO

---

### Documento *(Value Object)*
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| tipo | TipoDocumento | DANFE / CTE |
| numero | String | Número do documento fiscal |
| serie | String | Série do documento |
| chaveAcesso | String | Chave SEFAZ de 44 dígitos |
| status | StatusDocumento | PENDENTE / AUTORIZADO / REJEITADO / CANCELADO |
| emitidoEm | DateTime | Timestamp de emissão |
| autorizadoEm | DateTime | Timestamp de autorização pela SEFAZ |
| url | String | URL do PDF para download |
| xml | String | XML completo do documento (armazenado para reprocessamento) |

---

### Placa *(Value Object)*
| Atributo | Tipo | Descrição |
|----------|------|-----------|
| valor | String | Formato Mercosul (ABC1D23) ou antigo (ABC-1234) |
| fonteIdentificacao | FonteIdentificacao | OCR_AUTOMATICO / DIGITACAO_MANUAL |
| confiancaOCR | Decimal | Score de confiança da leitura OCR (0.0 a 1.0) |

**Regra de validação:** confiancaOCR < 0.85 → sinaliza para confirmação manual pelo porteiro

---

## Domain Events

| Evento | Ocorre quando | Dados transportados |
|--------|--------------|---------------------|
| `CheckInRegistrado` | Caminhão autorizado na portaria | ticketId, placa, contratoId, fazendaId, timestamp, fonte (OCR/manual) |
| `TaraRegistrada` | Pesagem 1 concluída com sucesso | ticketId, tara (valor+fonte), operadorId, fazendaId, timestamp |
| `CarregamentoIniciado` | Caminhão liberado para o silo após Pesagem 1 | ticketId, fazendaId, timestamp |
| `PesoBrutoRegistrado` | Pesagem 2 concluída com sucesso | ticketId, pesoBruto, pesoLiquido, produto, contratoId, operadorId, timestamp |
| `DivergenciaDetectada` | Peso inválido ou inconsistente com contrato | ticketId, tipoDivergencia, valorEsperado, valorRegistrado, operadorId, timestamp |
| `DivergenciaAprovada` | Coordenador aprova ticket em DIVERGENCIA | ticketId, coordenadorId, justificativa, timestamp |
| `DocumentosEmitidos` | DANFe e CTe gerados e autorizados pela SEFAZ | ticketId, danfe (numero+chave), cte (numero+chave), timestamp |
| `CaminhaoLiberado` | Ticket concluído, caminhão autorizado a sair | ticketId, pesoLiquido, produto, fazendaId, operadorId, concluidoEm |
| `TicketSincronizadoSAP` | Payload enviado e confirmado pelo SAP HANA via CPI | ticketId, sapDocumentId, fazendaId, timestamp |
| `TicketPendenteSAP` | Sincronização falhou após retries | ticketId, motivo, tentativas, timestamp |
| `AlertaFilaDisparado` | Fila ultrapassa thresholdFila | fazendaId, quantidadeNaFila, threshold, tempoMedioEspera, timestamp |
| `FalhaConectividade` | Sistema perde conexão com SAP BTP | fazendaId, timestamp, ticketsPendentes |
| `SincronizacaoRetomada` | Conexão restaurada, tickets offline enviados | fazendaId, ticketsSincronizados, timestamp |
| `BalancaStatusAlterado` | Balança muda para OFFLINE ou MANUTENCAO | balancaId, fazendaId, statusAnterior, statusNovo, timestamp |
| `ContratoEncerrado` | saldoRestante do contrato atinge zero | contratoId, fazendaId, quantidadeTotal, timestamp |

---

## Business Rules

| ID | Nome | Descrição |
|----|------|-----------|
| BR-01 | Sequência obrigatória de status | Ticket só avança em ordem: AGUARDANDO_TARA → AGUARDANDO_CARGA → AGUARDANDO_BRUTO → AGUARDANDO_DOCUMENTO → CONCLUIDO. Nunca retroage. DIVERGENCIA e PENDENTE_SAP são estados de exceção. |
| BR-02 | Peso líquido positivo | PesoBruto deve ser estritamente maior que Tara. Se PesoBruto ≤ Tara, ticket entra obrigatoriamente em DIVERGENCIA e bloqueia até aprovação do coordenador. |
| BR-03 | Auditoria imutável | Nenhuma ação registrada na TrilhaAuditoria pode ser alterada ou removida após inserida. Toda ação — humana ou automática — é registrada. |
| BR-04 | Documentos antes da liberação | Caminhão não pode ser liberado sem DANFe E CTe com status AUTORIZADO pela SEFAZ. |
| BR-05 | Emissão automática de documentos | DANFe e CTe são disparados automaticamente ao registrar PesoBruto válido — sem intervenção manual ou solicitação por e-mail. |
| BR-06 | Modo offline resiliente | Em caso de falha de conectividade, tickets continuam sendo criados e avançados localmente. Ao restaurar conexão, sincronização automática ocorre na ordem cronológica dos tickets. |
| BR-07 | Sincronização SAP obrigatória | Todo ticket CONCLUIDO deve ser sincronizado ao SAP HANA. Ticket não sincronizado permanece em PENDENTE_SAP com retry automático a cada 5 minutos por até 24h. |
| BR-08 | Um ticket ativo por placa | Uma mesma placa não pode ter dois tickets com status ativo (qualquer status exceto CONCLUIDO) na mesma fazenda simultaneamente. |
| BR-09 | Aprovação de divergência exclusiva do coordenador | Somente usuário com perfil COORDENADOR pode aprovar um ticket em status DIVERGENCIA. Balanceiro não tem permissão para essa ação. |
| BR-10 | Validação de contrato no check-in | Placa só é autorizada a entrar se: (a) consta em placasAutorizadas do contrato, (b) contrato está ATIVO, (c) vigência não expirou, (d) saldoRestante > 0. |
| BR-11 | Peso dentro dos limites do contrato | Peso Líquido não pode exceder saldoRestante do ContratoSAP. Se exceder, ticket entra em DIVERGENCIA com tipo EXCESSO_CONTRATO. |
| BR-12 | Confiança mínima do OCR | Leitura de placa com confiancaOCR < 0.85 não é aceita automaticamente — sinaliza para confirmação manual pelo porteiro antes de criar o ticket. |
| BR-13 | Calibração periódica da balança | Balança com ultimaCalibracaoEm > 30 dias entra em alerta. Sistema notifica coordenador e registra na trilha que pesagens estão sendo realizadas com equipamento fora do prazo de calibração. |
| BR-14 | Peso manual exige justificativa | Se fonte do peso for MANUAL_CONFIRMADO (sensor falhou), o operador deve registrar motivo explícito. Esse registro é obrigatório na TrilhaAuditoria e visível no relatório do turno. |

---

## Relationship Map

```
TicketPesagem ──── pertence a ──────── Fazenda
TicketPesagem ──── referencia ─────── ContratoSAP
TicketPesagem ──── usa ─────────────── Balanca
TicketPesagem ──── operado por ─────── Usuario (Balanceiro)
TicketPesagem ──── contém ──────────── Placa
TicketPesagem ──── contém ──────────── Peso (Tara)
TicketPesagem ──── contém ──────────── Peso (Bruto)
TicketPesagem ──── calcula ─────────── Peso (Liquido)
TicketPesagem ──── contém ──────────── TrilhaAuditoria
TicketPesagem ──── gera ────────────── Documento (DANFe)
TicketPesagem ──── gera ────────────── Documento (CTe)
TicketPesagem ──── dispara ─────────── CheckInRegistrado
TicketPesagem ──── dispara ─────────── TaraRegistrada
TicketPesagem ──── dispara ─────────── CarregamentoIniciado
TicketPesagem ──── dispara ─────────── PesoBrutoRegistrado
TicketPesagem ──── dispara ─────────── DivergenciaDetectada
TicketPesagem ──── dispara ─────────── DocumentosEmitidos
TicketPesagem ──── dispara ─────────── CaminhaoLiberado
TicketPesagem ──── dispara ─────────── TicketSincronizadoSAP
Fazenda ────────── contém ──────────── Balanca (1..N)
Fazenda ────────── projeta ─────────── FilaEspera
Fazenda ────────── dispara ─────────── AlertaFilaDisparado
ContratoSAP ─────── valida ─────────── Placa
ContratoSAP ─────── limita ─────────── Peso (Liquido)
Balanca ────────── captura ─────────── Peso
Balanca ────────── captura ─────────── Placa (via OCR)
Usuario (Coordenador) ── aprova ──────── DivergenciaDetectada
Usuario (Coordenador) ── monitora ────── FilaEspera via SAC Story
```

---

## Bounded Contexts

### Context Map — Interfaces e Contratos

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORE DOMAIN                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   PESAGEM                                 │   │
│  │  TicketPesagem (AR) · Fazenda · Balanca                  │   │
│  │  ContratoSAP · FilaEspera · Usuario                      │   │
│  │                                                          │   │
│  │  Publica: TaraRegistrada, PesoBrutoRegistrado,           │   │
│  │           CaminhaoLiberado, DivergenciaDetectada         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│    FISCAL       │  │  INTEGRAÇÃO SAP │  │     ANALYTICS       │
│                 │  │                 │  │                     │
│ Consome:        │  │ Consome:        │  │ Consome:            │
│ PesoBruto       │  │ CaminhaoLiberado│  │ Dados do HANA       │
│ Registrado      │  │                 │  │ (read-only)         │
│                 │  │ Transforma e    │  │                     │
│ Emite DANFe/CTe │  │ envia via CPI   │  │ SAP Datasphere      │
│ via SEFAZ       │  │ ao SAP HANA     │  │ → SAC Story         │
│                 │  │                 │  │                     │
│ Publica:        │  │ Publica:        │  │ Publica:            │
│ Documentos      │  │ Ticket          │  │ (somente leitura,   │
│ Emitidos        │  │ SincronizadoSAP │  │ sem eventos)        │
└─────────────────┘  └─────────────────┘  └─────────────────────┘
          │
          ▼
┌─────────────────┐
│   IDENTIDADE    │
│                 │
│ Fornece:        │
│ UsuarioId +     │
│ Perfil para     │
│ todos os        │
│ contextos       │
└─────────────────┘
```

### Detalhamento dos Bounded Contexts

| Contexto | Responsabilidade | Tecnologia | Publica | Consome |
|----------|-----------------|-----------|---------|---------|
| **Pesagem** | Ciclo completo do TicketPesagem — da tara à liberação. Regras de negócio centrais. | SAP BTP (CAP Node.js) | TaraRegistrada, PesoBrutoRegistrado, CaminhaoLiberado, DivergenciaDetectada, AlertaFilaDisparado | ContratoSAP (via SAP), UsuarioId (via Identidade) |
| **Fiscal** | Emissão e gestão de DANFe e CTe via integração SEFAZ | SAP BTP + integração SEFAZ | DocumentosEmitidos | PesoBrutoRegistrado |
| **Integração SAP** | Transporte confiável de dados do WeighBridge 360 ao SAP HANA via CPI. Retry, transformação e log de transmissão. | SAP Integration Suite (CPI) | TicketSincronizadoSAP, TicketPendenteSAP | CaminhaoLiberado |
| **Analytics** | Consolidação multi-fazenda no Datasphere. Dashboard SAC para coordenador. Alertas e KPIs. | SAP Datasphere + SAP Analytics Cloud | — (somente leitura) | Dados do SAP HANA (tabelas de tickets e fazendas) |
| **Identidade** | Autenticação, autorização e gestão de perfis (Balanceiro, Coordenador, Porteiro) | SAP BTP Identity (IAS/IPS) | — | — |

### Interfaces entre Contextos (Anti-Corruption Layer)

| De | Para | Contrato | Protocolo |
|----|------|---------|-----------|
| Pesagem | Fiscal | Evento `PesoBrutoRegistrado` com payload: ticketId, pesoLiquido, produto, contrato, motorista, transportadora | Event-driven (mensageria SAP BTP) |
| Pesagem | Integração SAP | Evento `CaminhaoLiberado` com payload completo do ticket | Event-driven (mensageria SAP BTP) |
| Integração SAP | SAP HANA | Payload transformado: tabela ZWB_TICKETS com todos os campos do ticket | CPI iFlow → HANA |
| SAP HANA | Datasphere | Replicação incremental das tabelas ZWB_* | SAP Datasphere connection |
| Datasphere | SAC | Views analíticas: fila por fazenda, volume por produto, tempo médio, divergências | SAC Live Connection |
| Identidade | Todos | JWT com claims: userId, perfil, fazendaId | OAuth 2.0 / XSUAA |
