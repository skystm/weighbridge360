# Product Specification — WeighBridge 360

## Overview
**Problema:** O processo de pesagem de carregamentos agrícolas nas fazendas da SLC Agrícola é inteiramente manual, com sistema legado instável (465 quedas/mês), sem integração SAP e sem rastreabilidade — gerando R$ 4,1 milhões/mês em perdas e risco real de fraude.
**Solução:** Plataforma SAP-native que automatiza o ciclo completo de pesagem — do OCR de placa na portaria ao envio automático ao SAP HANA via CPI — com emissão automática de DANFe/CTe, modo offline resiliente e dashboard em tempo real para o coordenador.
**Usuário primário:** Balanceiro (Ricardo Mendes Souza — perfil treinado, operação presencial, fazenda Paiaguás/MT)
**Value proposition:** O Balanceiro registra pesagens sem digitar nada, com dados protegidos por auditoria imutável e documentos fiscais emitidos em segundos — enquanto o Coordenador monitora filas e volumes em tempo real sem planilha ou WhatsApp.

---

## Escopo do Protótipo

### In Scope
- Check-in automático por leitura OCR de placa com validação contra ContratoSAP
- Captura automática de Tara via sensor da balança (Pesagem 1)
- Captura automática de Peso Bruto via sensor (Pesagem 2) com cálculo automático de PesoLiquido
- Emissão automática de DANFe e CTe após Pesagem 2
- Detecção e gestão de Divergências de peso com aprovação pelo Coordenador
- TrilhaAuditoria imutável em cada TicketPesagem
- Modo offline com sincronização automática ao reconectar
- Sincronização automática de tickets concluídos ao SAP HANA via CPI
- Dashboard SAC em tempo real: FilaEspera, alertas e volume por fazenda/produto
- Relatório de turno automático para o Balanceiro
- Gestão de múltiplas fazendas com configuração por fazenda (ThresholdFila, produtos, balanças)

### Out of Scope (explicitamente)
- Automação do carregamento físico (silos, esteiras, armazéns)
- Integração com sistemas de transportadoras externas
- Substituição ou migração do SAP ERP
- Gestão de contratos de fornecedores (contratos são lidos do SAP, não gerenciados aqui)
- App mobile nativo (web responsivo no BTP é suficiente para o protótipo)
- Outros processos agrícolas: plantio, colheita, irrigação, pecuária além do peso
- Módulo de faturamento ou financeiro
- Multi-tenancy entre clientes SAP (escopo futuro de produto)

---

## Fluxos Principais

### Fluxo 1: Check-in automático na portaria
**Ator:** Porteiro
**Objetivo:** Registrar a chegada do caminhão e validar autorização de entrada
**Pré-condição:** ContratoSAP ativo com a placa cadastrada e saldo restante > 0
**Passos:**
1. Caminhão se aproxima da câmera OCR na portaria
2. Sistema captura imagem e lê a placa automaticamente
3. Se confiancaOCR >= 0.85: placa aceita automaticamente
4. Se confiancaOCR < 0.85: Porteiro confirma ou corrige a placa manualmente
5. Sistema valida placa contra ContratosSAP ativos da fazenda
6. Se válido: TicketPesagem criado com status AGUARDANDO_TARA, CheckInRegistrado na TrilhaAuditoria
7. Porteiro visualiza dados do contrato (produto, transportadora, saldo)

**Pós-condição:** TicketPesagem criado e caminhão autorizado a avançar para a balança

**Exceções:**
- Placa não encontrada em nenhum contrato → bloqueio com mensagem ao Porteiro
- Contrato com saldo zerado → bloqueio com mensagem
- Ticket ativo já existente para a placa → alerta com ID do ticket existente

---

### Fluxo 2: Pesagem 1 — Registro automático da Tara
**Ator:** Balanceiro
**Objetivo:** Registrar o peso do caminhão vazio sem digitação
**Pré-condição:** TicketPesagem com status AGUARDANDO_TARA; caminhão posicionado na balança
**Passos:**
1. Sistema detecta caminhão na balança e inicia leitura do sensor
2. Sensor aguarda estabilização (3 leituras consecutivas com variação < precisão do equipamento)
3. Sistema exibe valor da Tara na tela do Balanceiro
4. Balanceiro confirma o valor
5. Sistema registra Tara com fonte = SENSOR_AUTOMATICO, avança para AGUARDANDO_CARGA
6. TaraRegistrada publicado; TrilhaAuditoria atualizada com valor, fonte, operador e timestamp

**Pós-condição:** Tara persistida, TicketPesagem em AGUARDANDO_CARGA, dado salvo localmente (Modo Offline) ou remotamente

**Exceções:**
- Sensor offline → Balanceiro pode inserir peso manualmente com justificativa obrigatória (BR-14)
- Valor fora dos limites (≤0 ou >150.000 kg) → sistema rejeita e solicita nova leitura

---

### Fluxo 3: Pesagem 2 — Registro do Peso Bruto e emissão de documentos
**Ator:** Balanceiro
**Objetivo:** Registrar o peso do caminhão carregado, calcular PesoLiquido e disparar emissão fiscal automaticamente
**Pré-condição:** TicketPesagem com status AGUARDANDO_BRUTO; caminhão retornou do carregamento
**Passos:**
1. Balanceiro confirma retorno do caminhão na balança
2. Sensor aguarda estabilização e captura Peso Bruto
3. Sistema calcula PesoLiquido = PesoBruto − Tara automaticamente
4. Sistema valida: PesoBruto > Tara E PesoLiquido ≤ saldoRestante do ContratoSAP
5. Se válido: Balanceiro confirma → status avança para AGUARDANDO_DOCUMENTO
6. DANFe e CTe disparados automaticamente via integração SEFAZ (< 30 segundos)
7. Ao autorizar: status avança para CONCLUIDO, CaminhaoLiberado publicado
8. CPI captura evento e envia payload ao SAP HANA

**Pós-condição:** TicketPesagem CONCLUIDO, documentos fiscais emitidos, dados sincronizados ao SAP HANA

**Exceções (Divergência):**
- PesoBruto ≤ Tara → DIVERGENCIA tipo PESO_INVALIDO, ticket bloqueado
- PesoLiquido > saldoRestante → DIVERGENCIA tipo EXCESSO_CONTRATO, ticket bloqueado
- Em ambos os casos: alerta ao Coordenador, fluxo só retoma após aprovação explícita

---

### Fluxo 4: Gestão de Divergência pelo Coordenador
**Ator:** Coordenador
**Objetivo:** Revisar e decidir sobre TicketsPesagem bloqueados por inconsistência de peso
**Pré-condição:** TicketPesagem com status DIVERGENCIA; evento DivergenciaDetectada publicado
**Passos:**
1. Coordenador recebe notificação automática no dashboard SAC
2. Visualiza detalhes: tipo de divergência, valores registrados, histórico da TrilhaAuditoria
3. Analisa situação (contato com o campo se necessário)
4. Registra justificativa (mínimo 20 caracteres) e aprova ou rejeita
5. Se aprovado: ticket retorna a AGUARDANDO_DOCUMENTO, fluxo retoma
6. DivergenciaAprovada registrado na TrilhaAuditoria com coordenadorId e justificativa

**Pós-condição:** TicketPesagem desbloqueado (ou cancelado se rejeitado), decisão auditável

---

### Fluxo 5: Monitoramento em tempo real pelo Coordenador
**Ator:** Coordenador
**Objetivo:** Acompanhar a operação das fazendas em tempo real sem WhatsApp ou planilha
**Pré-condição:** Coordenador autenticado no SAC; dados replicados do HANA para o Datasphere
**Passos:**
1. Coordenador acessa a SAC Story no browser
2. Visualiza painel consolidado: FilaEspera por fazenda, volume por produto, tempo médio de pesagem
3. Recebe alertas automáticos quando FilaEspera > ThresholdFila
4. Drilla até fazenda específica para ver tickets ativos, divergências e histórico do dia
5. Exporta relatório do período se necessário

**Pós-condição:** Coordenador informado em tempo real, ação tomada sem dependência de comunicação informal

---

### Fluxo 6: Modo Offline e Sincronização
**Ator:** Sistema (automático)
**Objetivo:** Garantir operação contínua sem conectividade e sincronização sem perda de dados ao reconectar
**Pré-condição:** Conexão com SAP BTP perdida
**Passos:**
1. Sistema detecta perda de conectividade, publica FalhaConectividade
2. App do Balanceiro entra em Modo Offline — exibe indicador visual claro
3. Tickets continuam sendo criados, taras e pesos registrados localmente (IndexedDB / SQLite)
4. Ao restaurar conexão: sistema detecta automaticamente
5. Sincronização em lote: tickets offline enviados em ordem cronológica ao SAP HANA via CPI
6. SincronizacaoRetomada publicado com total de tickets sincronizados

**Pós-condição:** Nenhum ticket perdido, dados consistentes no SAP HANA

---

## Requisitos Funcionais

| ID | Requisito | Prioridade | Fluxo relacionado |
|----|-----------|-----------|------------------|
| FR-01 | Sistema deve ler placa via OCR com score de confiança e exigir confirmação manual se confiancaOCR < 0.85 | Alta | Fluxo 1 |
| FR-02 | Sistema deve validar placa contra ContratoSAP ativo, vigente e com saldo antes de criar TicketPesagem | Alta | Fluxo 1 |
| FR-03 | Sensor da balança deve ser lido automaticamente — Balanceiro apenas confirma, não digita | Alta | Fluxo 2, 3 |
| FR-04 | Sistema deve persistir dados imediatamente após cada confirmação de etapa (auto-save por etapa) | Alta | Fluxo 2, 3 |
| FR-05 | PesoLiquido deve ser calculado automaticamente — nunca digitado | Alta | Fluxo 3 |
| FR-06 | DANFe e CTe devem ser emitidos automaticamente em < 30 segundos após confirmação da Pesagem 2 | Alta | Fluxo 3 |
| FR-07 | Caminhão não pode ser liberado sem DANFe e CTe com status AUTORIZADO | Alta | Fluxo 3 |
| FR-08 | TicketPesagem com PesoBruto ≤ Tara ou PesoLiquido > saldoRestante deve entrar em DIVERGENCIA automaticamente | Alta | Fluxo 3, 4 |
| FR-09 | Somente usuário com perfil COORDENADOR pode aprovar TicketPesagem em DIVERGENCIA | Alta | Fluxo 4 |
| FR-10 | TrilhaAuditoria deve registrar toda ação — humana ou automática — de forma append-only e imutável | Alta | Todos |
| FR-11 | Sistema deve operar em Modo Offline e sincronizar automaticamente ao reconectar | Alta | Fluxo 6 |
| FR-12 | Todo TicketPesagem CONCLUIDO deve ser enviado ao SAP HANA via CPI com retry automático | Alta | Fluxo 3 |
| FR-13 | Dashboard SAC deve exibir FilaEspera em tempo real e disparar alerta quando ultrapassar ThresholdFila | Alta | Fluxo 5 |
| FR-14 | Entrada manual de peso deve exigir justificativa obrigatória registrada na TrilhaAuditoria | Alta | Fluxo 2, 3 |
| FR-15 | Relatório de turno deve ser gerado automaticamente com total de tickets, volumes e pendências | Média | — |
| FR-16 | Sistema deve suportar configuração por fazenda: ThresholdFila, produtos, balanças, turno | Média | Todos |

---

## Requisitos Não-Funcionais

| ID | Categoria | Requisito | Critério Mensurável |
|----|-----------|-----------|-------------------|
| NFR-01 | Performance | Tempo de resposta da API | < 2 segundos em 95% das requisições |
| NFR-02 | Performance | Emissão de DANFe/CTe | < 30 segundos do disparo à autorização SEFAZ |
| NFR-03 | Performance | Captura de peso pelo sensor | Estabilização em < 10 segundos após posicionamento |
| NFR-04 | Disponibilidade | Modo Offline | Sistema opera sem internet por até 8h (turno completo) |
| NFR-05 | Segurança | Autenticação | OAuth 2.0 via SAP XSUAA — token obrigatório em todos os endpoints |
| NFR-06 | Segurança | Autorização | Perfis BALANCEIRO / COORDENADOR / PORTEIRO com permissões distintas por endpoint |
| NFR-07 | Imutabilidade | TrilhaAuditoria | Nenhum registro pode ser alterado ou deletado após inserido — validado por constraint de banco |
| NFR-08 | Rastreabilidade | Dados SAP | 100% dos tickets concluídos sincronizados ao HANA — zero entrada manual no ERP |
| NFR-09 | Resiliência | Retry CPI | Falha na sincronização SAP → retry automático a cada 5 min por até 24h |
| NFR-10 | Usabilidade | Interface do Balanceiro | Fluxo completo de pesagem em no máximo 3 cliques de confirmação |
| NFR-11 | Escalabilidade | Multi-fazenda | Sistema deve suportar 25 fazendas simultâneas sem degradação |
| NFR-12 | Conformidade SAP | Stack BTP | Implementação exclusivamente em SAP BTP — sem serviços externos de nuvem |

---

## Restrições do Ambiente SAP

- **Runtime:** SAP BTP Cloud Foundry — aplicação CAP Node.js
- **Banco de dados:** SAP HANA Cloud (via CAP CDS entities)
- **Autenticação:** SAP XSUAA obrigatório — sem autenticação proprietária
- **Integração:** SAP Integration Suite (CPI) para comunicação com S/4HANA e HANA
- **Analytics:** SAP Datasphere + SAP Analytics Cloud — sem Power BI ou Tableau
- **LLM (se usado):** SAP AI Core exclusivamente — sem OpenAI ou Gemini direto
- **Deploy:** `cf push` via SAP BTP CLI ou MTA — artefato `solution.yaml` obrigatório antes do pitch
- **Contratos SAP:** lidos via OData do S/4HANA — não replicados nem gerenciados no WeighBridge 360
- **SEFAZ:** integração via SAP Document and Reporting Compliance — não direta
- **Campos customizados:** placas autorizadas armazenadas em campo Z no ContratoSAP do S/4HANA

---

## Critério Geral de Aceite do Protótipo

O protótipo será considerado bem-sucedido quando:
- [ ] Um caminhão pode fazer check-in com leitura OCR de placa validada contra contrato SAP
- [ ] Tara capturada automaticamente pelo sensor e confirmada pelo Balanceiro sem digitação
- [ ] Peso Bruto capturado automaticamente e PesoLiquido calculado sem digitação
- [ ] DANFe e CTe emitidos automaticamente em < 30 segundos após Pesagem 2
- [ ] TicketPesagem com peso inválido entra em DIVERGENCIA e é desbloqueado apenas pelo Coordenador
- [ ] TrilhaAuditoria completa e imutável visível em cada ticket
- [ ] TicketPesagem concluído aparece no SAP HANA via CPI sem entrada manual
- [ ] Dashboard SAC exibe FilaEspera em tempo real com alerta de threshold
- [ ] Fluxo completo funciona em Modo Offline e sincroniza ao reconectar
- [ ] Demo flow roda do início ao fim sem interrupção em ambiente BTP (ou fallback local documentado)
