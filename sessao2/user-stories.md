# User Stories — WeighBridge 360

> Linguagem ubíqua aplicada conforme `projeto/sessao1/domain-glossary.md`.
> Prioridade MVP: fluxo do Balanceiro (70%) → Coordenador (20%) → Porteiro (10%).

---

## US-01: Check-in automático por OCR de placa

**Como** Porteiro,
**quero** que o sistema leia automaticamente a placa do caminhão na entrada da fazenda,
**para que** o check-in seja registrado sem digitação manual e o caminhão seja validado contra o ContratoSAP ativo.

**Prioridade:** Alta
**Complexidade:** M
**Fluxo relacionado:** Entrada do caminhão na fazenda

### Acceptance Criteria

**AC-01.1: Leitura OCR com alta confiança**
```
DADO que um caminhão se aproxima da câmera OCR na portaria
QUANDO o sensor captura a imagem da placa
E a confiancaOCR é >= 0.85
ENTÃO o sistema cria o CheckInRegistrado com fonte = OCR_AUTOMATICO
E exibe a placa lida e os dados do ContratoSAP vinculado na tela do porteiro
E o TicketPesagem é criado com status AGUARDANDO_TARA
```

**AC-01.2: Leitura OCR com baixa confiança**
```
DADO que um caminhão se aproxima da câmera OCR na portaria
QUANDO o sensor captura a imagem da placa
E a confiancaOCR é < 0.85
ENTÃO o sistema exibe a placa sugerida com alerta de "confirmação necessária"
E o Porteiro deve confirmar ou corrigir manualmente antes de prosseguir
E o CheckInRegistrado é criado com fonte = DIGITACAO_MANUAL
```

**AC-01.3: Placa não encontrada em nenhum ContratoSAP ativo**
```
DADO que a placa foi lida ou digitada pelo Porteiro
QUANDO o sistema valida contra os ContratosSAP ativos da fazenda
E a placa não consta em nenhum contrato ativo, vigente ou com saldo restante
ENTÃO o sistema bloqueia o check-in
E exibe mensagem: "Placa [ABC1D23] não autorizada. Nenhum contrato ativo encontrado."
E nenhum TicketPesagem é criado
```

**AC-01.4: Contrato sem saldo restante**
```
DADO que a placa consta em um ContratoSAP
QUANDO o sistema verifica o saldoRestante do contrato
E saldoRestante = 0
ENTÃO o sistema bloqueia o check-in
E exibe mensagem: "Contrato [ID] encerrado. Saldo zerado."
```

**AC-01.5: Registro na TrilhaAuditoria**
```
DADO que o check-in foi realizado com sucesso
QUANDO o TicketPesagem é criado
ENTÃO a TrilhaAuditoria registra: acao = CHECK_IN, fonte, placa, contratoId, operadorId, timestamp
E esse registro não pode ser alterado ou removido
```

### Implementation Notes
- Câmera OCR deve operar com confiança >= 0.85 para aceite automático
- Em Modo Offline, check-in é registrado localmente e sincronizado ao reconectar

---

## US-02: Registro automático da Tara (Pesagem 1)

**Como** Balanceiro,
**quero** que o sistema capture o peso do caminhão vazio automaticamente via sensor,
**para que** a Tara seja registrada sem digitação e o TicketPesagem avance sem risco de perda de dados.

**Prioridade:** Alta
**Complexidade:** M
**Fluxo relacionado:** Pesagem 1 — Tara

### Acceptance Criteria

**AC-02.1: Captura automática da Tara via sensor**
```
DADO que um TicketPesagem está com status AGUARDANDO_TARA
QUANDO o caminhão estabiliza na balança
E o sensor registra variação < precisao por 3 leituras consecutivas
ENTÃO o sistema exibe o valor da Tara na tela do Balanceiro
E aguarda confirmação do Balanceiro para avançar
```

**AC-02.2: Balanceiro confirma a Tara**
```
DADO que a Tara foi capturada pelo sensor e exibida ao Balanceiro
QUANDO o Balanceiro confirma o valor
ENTÃO o sistema registra a Tara com fonte = SENSOR_AUTOMATICO
E o status do TicketPesagem avança para AGUARDANDO_CARGA
E a TrilhaAuditoria registra: acao = TARA_REGISTRADA, valor, fonte, operadorId, timestamp
E o evento TaraRegistrada é publicado
```

**AC-02.3: Sensor indisponível — entrada manual com justificativa**
```
DADO que o sensor da balança está OFFLINE
QUANDO o Balanceiro precisa registrar a Tara
ENTÃO o sistema permite entrada manual do valor
E exige preenchimento obrigatório do campo "motivo da entrada manual"
E registra fonte = MANUAL_CONFIRMADO na TrilhaAuditoria
```

**AC-02.4: Auto-save por etapa**
```
DADO que a Tara foi confirmada pelo Balanceiro
QUANDO o sistema registra o valor
ENTÃO os dados são persistidos imediatamente (local em Modo Offline, ou remoto se conectado)
E uma queda de sistema após esse ponto não perde a Tara registrada
```

**AC-02.5: Peso fora dos limites operacionais**
```
DADO que o sensor capturou um valor
QUANDO o valor é <= 0 ou > 150.000 kg
ENTÃO o sistema rejeita a leitura
E exibe alerta: "Leitura inválida. Verifique o equipamento."
E não avança o TicketPesagem
```

### Implementation Notes
- Estabilização: 3 leituras consecutivas com variação < precisao da Balanca
- Modo Offline: persistência local com sync automático ao reconectar

---

## US-03: Registro automático do Peso Bruto (Pesagem 2)

**Como** Balanceiro,
**quero** que o sistema capture o Peso Bruto automaticamente e calcule o PesoLiquido,
**para que** o ciclo de pesagem seja concluído sem digitação e os documentos fiscais sejam disparados automaticamente.

**Prioridade:** Alta
**Complexidade:** M
**Fluxo relacionado:** Pesagem 2 — Bruto

### Acceptance Criteria

**AC-03.1: Captura automática do Peso Bruto**
```
DADO que um TicketPesagem está com status AGUARDANDO_BRUTO
QUANDO o caminhão carregado estabiliza na balança
E o sensor registra variação < precisao por 3 leituras consecutivas
ENTÃO o sistema exibe PesoBruto, Tara e PesoLiquido calculado na tela do Balanceiro
E aguarda confirmação para avançar
```

**AC-03.2: PesoLiquido calculado automaticamente**
```
DADO que PesoBruto e Tara estão registrados
QUANDO o Balanceiro confirma o PesoBruto
ENTÃO PesoLiquido = PesoBruto - Tara é calculado pelo sistema
E o valor nunca é digitado manualmente
```

**AC-03.3: PesoBruto <= Tara — divergência obrigatória**
```
DADO que o PesoBruto capturado é <= Tara registrada
QUANDO o sistema tenta avançar o TicketPesagem
ENTÃO o status muda para DIVERGENCIA
E o evento DivergenciaDetectada é publicado com tipo = PESO_INVALIDO
E o TicketPesagem é bloqueado até aprovação do Coordenador
E a TrilhaAuditoria registra o motivo da divergência
```

**AC-03.4: PesoLiquido excede saldo do ContratoSAP**
```
DADO que o PesoLiquido calculado é > saldoRestante do ContratoSAP
QUANDO o sistema valida contra o contrato
ENTÃO o status muda para DIVERGENCIA com tipo = EXCESSO_CONTRATO
E o TicketPesagem é bloqueado até aprovação do Coordenador
```

**AC-03.5: Emissão automática de documentos após confirmação**
```
DADO que PesoBruto válido foi confirmado e PesoLiquido calculado
QUANDO o Balanceiro confirma a Pesagem 2
ENTÃO o sistema dispara automaticamente a emissão de DANFe e CTe
E o status avança para AGUARDANDO_DOCUMENTO
E o evento PesoBrutoRegistrado é publicado
```

---

## US-04: Emissão automática de DANFe e CTe

**Como** Balanceiro,
**quero** que o DANFe e o CTe sejam emitidos automaticamente após a Pesagem 2,
**para que** o caminhão seja liberado sem e-mail para a área fiscal e sem tempo de espera imprevisível.

**Prioridade:** Alta
**Complexidade:** L
**Fluxo relacionado:** Emissão fiscal — liberação do caminhão

### Acceptance Criteria

**AC-04.1: Emissão automática em menos de 30 segundos**
```
DADO que o evento PesoBrutoRegistrado foi publicado com dados válidos
QUANDO o contexto Fiscal processa o evento
ENTÃO DANFe e CTe são emitidos e autorizados pela SEFAZ
E o status dos documentos muda para AUTORIZADO
E o evento DocumentosEmitidos é publicado
E o tempo total de emissão é < 30 segundos
```

**AC-04.2: Documentos disponíveis para download**
```
DADO que DANFe e CTe foram autorizados
QUANDO o Balanceiro acessa o TicketPesagem
ENTÃO os documentos estão disponíveis para visualização e download em PDF
E a chaveAcesso SEFAZ de 44 dígitos está visível
```

**AC-04.3: Falha na emissão — SEFAZ indisponível**
```
DADO que o contexto Fiscal tentou emitir os documentos
QUANDO a SEFAZ retorna erro ou timeout
ENTÃO o sistema mantém o TicketPesagem em status AGUARDANDO_DOCUMENTO
E exibe alerta ao Balanceiro: "Emissão fiscal em andamento. Aguarde."
E realiza retry automático a cada 60 segundos por até 10 tentativas
```

**AC-04.4: Caminhão não pode ser liberado sem documentos autorizados**
```
DADO que o Balanceiro tenta liberar o caminhão
QUANDO DANFe ou CTe ainda não têm status AUTORIZADO
ENTÃO o sistema bloqueia a liberação
E exibe mensagem: "Aguardando autorização SEFAZ. Não é possível liberar o caminhão."
```

---

## US-05: Aprovação de Divergência pelo Coordenador

**Como** Coordenador,
**quero** receber alertas de TicketsPesagem em DIVERGENCIA e poder aprovar ou rejeitar,
**para que** nenhum caminhão seja bloqueado indefinidamente sem decisão formal registrada.

**Prioridade:** Alta
**Complexidade:** M
**Fluxo relacionado:** Gestão de divergências

### Acceptance Criteria

**AC-05.1: Alerta imediato ao Coordenador**
```
DADO que um TicketPesagem entrou em status DIVERGENCIA
QUANDO o evento DivergenciaDetectada é publicado
ENTÃO o Coordenador recebe notificação imediata no dashboard SAC
E o ticket aparece na lista de "Divergências pendentes" com tipo e dados
```

**AC-05.2: Coordenador aprova a divergência**
```
DADO que o Coordenador visualiza um TicketPesagem em DIVERGENCIA
QUANDO o Coordenador registra justificativa e confirma aprovação
ENTÃO o status do ticket retorna para AGUARDANDO_DOCUMENTO
E o evento DivergenciaAprovada é publicado com coordenadorId e justificativa
E a TrilhaAuditoria registra a aprovação com timestamp
```

**AC-05.3: Apenas Coordenador pode aprovar**
```
DADO que um TicketPesagem está em DIVERGENCIA
QUANDO um usuário com perfil BALANCEIRO ou PORTEIRO tenta aprovar
ENTÃO o sistema bloqueia a ação
E exibe mensagem: "Ação não permitida. Somente o Coordenador pode aprovar divergências."
```

---

## US-06: Monitoramento da Fila em tempo real (Coordenador)

**Como** Coordenador,
**quero** visualizar a FilaEspera de cada fazenda em tempo real no dashboard SAC,
**para que** eu possa agir proativamente quando a fila ultrapassar o ThresholdFila sem depender de WhatsApp ou planilha.

**Prioridade:** Alta
**Complexidade:** M
**Fluxo relacionado:** Analytics — visibilidade operacional

### Acceptance Criteria

**AC-06.1: Dashboard mostra fila em tempo real**
```
DADO que o Coordenador acessa a SAC Story
QUANDO há TicketsPesagem com status AGUARDANDO_TARA ou AGUARDANDO_BRUTO
ENTÃO o dashboard exibe quantidadeAtual, tempoMedioEspera e lista de caminhões aguardando
E os dados são atualizados automaticamente sem necessidade de refresh manual
```

**AC-06.2: Alerta automático ao ultrapassar ThresholdFila**
```
DADO que a FilaEspera de uma fazenda ultrapassa o ThresholdFila configurado
QUANDO o evento AlertaFilaDisparado é publicado
ENTÃO o Coordenador recebe notificação destacada no dashboard
E o alerta inclui: fazenda, quantidade atual, threshold, tempo médio de espera
```

**AC-06.3: Visão consolidada multi-fazenda**
```
DADO que o Coordenador acessa a SAC Story
QUANDO existem dados de múltiplas fazendas
ENTÃO o dashboard exibe todas as fazendas ativas em uma única visão
E é possível filtrar por fazenda, produto e período
```

---

## US-07: Sincronização automática com SAP HANA via CPI

**Como** sistema,
**quero** enviar automaticamente todos os TicketsPesagem concluídos ao SAP HANA via CPI,
**para que** os dados operacionais estejam disponíveis no ERP em tempo real sem entrada manual.

**Prioridade:** Alta
**Complexidade:** L
**Fluxo relacionado:** Integração SAP

### Acceptance Criteria

**AC-07.1: Sincronização automática ao concluir ticket**
```
DADO que um TicketPesagem atingiu status CONCLUIDO
QUANDO o evento CaminhaoLiberado é publicado
ENTÃO a CPI captura o evento e envia o payload ao SAP HANA
E o campo sincronizadoSAP do ticket muda para true
E o evento TicketSincronizadoSAP é publicado com sapDocumentId
```

**AC-07.2: Retry automático em caso de falha**
```
DADO que a CPI tentou enviar o payload ao SAP HANA
QUANDO o HANA retorna erro ou está indisponível
ENTÃO o ticket permanece com status PENDENTE_SAP
E a CPI realiza retry automático a cada 5 minutos
E após 24h sem sucesso, o Coordenador é notificado
```

**AC-07.3: Modo Offline — sincronização em lote ao reconectar**
```
DADO que tickets foram criados e concluídos durante Modo Offline
QUANDO a conectividade é restaurada
ENTÃO o sistema sincroniza todos os tickets pendentes em ordem cronológica
E o evento SincronizacaoRetomada é publicado com total de ticketsSincronizados
```

**AC-07.4: Nenhum dado inserido manualmente no SAP**
```
DADO que um TicketPesagem foi concluído
QUANDO o dado chega ao SAP HANA
ENTÃO ele chega via CPI automaticamente — sem intervenção humana no ERP
E o payload inclui todos os campos do domínio: pesos, produto, contrato, documentos, trilha
```

---

## US-08: Relatório de turno automático

**Como** Balanceiro,
**quero** que o sistema gere automaticamente o relatório do meu turno ao encerrar,
**para que** eu possa fechar o turno com todos os tickets auditados sem precisar de planilha Excel pessoal.

**Prioridade:** Média
**Complexidade:** S
**Fluxo relacionado:** Fechamento de turno

### Acceptance Criteria

**AC-08.1: Relatório gerado automaticamente**
```
DADO que o Balanceiro solicita fechamento de turno
QUANDO o sistema processa a solicitação
ENTÃO gera relatório com: total de tickets, volume por produto, tempo médio de pesagem,
     tickets em DIVERGENCIA, tickets PENDENTE_SAP
E o relatório fica disponível para download
```

**AC-08.2: Divergências destacadas no relatório**
```
DADO que existem tickets em DIVERGENCIA ou PENDENTE_SAP no turno
QUANDO o relatório é gerado
ENTÃO esses tickets aparecem destacados com status e motivo
E o Balanceiro não pode fechar o turno sem reconhecer os pendentes
```

---

## Dependency Map

| Story | Depende de | Pode ser paralelizada com |
|-------|-----------|--------------------------|
| US-01 (Check-in OCR) | — | US-06, US-07 |
| US-02 (Tara) | US-01 | US-06, US-07 |
| US-03 (Peso Bruto) | US-02 | — |
| US-04 (DANFe/CTe) | US-03 | US-05 |
| US-05 (Divergência) | US-03 | US-04 |
| US-06 (Fila/Dashboard) | US-01 | US-07 |
| US-07 (Sync SAP/CPI) | US-04 | US-06 |
| US-08 (Relatório turno) | US-02, US-03 | — |

## Resumo de Prioridade MVP

| Story | Prioridade | Complexidade | Essencial para pitch |
|-------|-----------|-------------|---------------------|
| US-02 Tara automática | Alta | M | ✅ |
| US-03 Peso Bruto + cálculo | Alta | M | ✅ |
| US-04 DANFe/CTe automático | Alta | L | ✅ |
| US-07 Sync SAP via CPI | Alta | L | ✅ |
| US-01 Check-in OCR | Alta | M | ✅ |
| US-05 Aprovação divergência | Alta | M | ✅ |
| US-06 Dashboard fila | Alta | M | ✅ |
| US-08 Relatório turno | Média | S | ⚡ nice-to-have |
