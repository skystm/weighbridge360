# Handoff — Sessão 1 → Sessão 2
## WeighBridge 360 — SLC Agrícola

> Este documento é o pacote de contexto oficial da Sessão 1.
> A Sessão 2 começa aqui — não é necessário reler todos os artefatos para começar.

---

## Resumo da Sessão 1

**Data:** 2026-07-28
**Duração:** ~2h30 (13h00 → 15h30)
**Modo:** Comprimido — problema já estava bem definido pelo time, fases de ideação aceleradas
**Artefatos gerados:** 8 de 8 ✅

---

## O Problema (acordado pelo time)

**HMW:**
> *"Como podemos garantir o registro seguro e em tempo real do peso de produtos e insumos agrícolas — totalmente integrado ao SAP — para prevenir fraudes, reduzir perdas financeiras e aumentar a visibilidade operacional do campo ao ERP?"*

**Dor central (visão do time):**
O processo de pesagem nas fazendas da SLC Agrícola é **inteiramente manual** — porteiro digita placa, balanceiro digita pesos, fiscal recebe e-mail para emitir DANFe, coordenador monitora por WhatsApp. O sistema legado cai 465 vezes/mês sem fallback. Nenhum dado chega ao SAP automaticamente. O custo é R$ 4,1 milhões/mês em atrasos e risco real de fraude sem rastreabilidade.

---

## A Solução Escolhida

**Nome:** WeighBridge 360

**Descrição em uma frase:**
> Plataforma SAP-native que automatiza o fluxo de pesagem agrícola — do campo ao ERP — eliminando trabalho manual, prevenindo fraudes e entregando visibilidade em tempo real para operadores e gestores.

**Arquitetura de alto nível (definida pelo time):**
```
Balança física (sensor)
    │
    ▼
WeighBridge 360 App (SAP BTP)
    │  OCR de placa na entrada
    │  Captura automática de peso
    │  Emissão automática DANFe/CTe
    │  Modo offline com sync
    │
    ▼ evento: CaminhaoLiberado
SAP Integration Suite (CPI)
    │  Transformação e transporte confiável
    │
    ▼
SAP HANA
    │  Persistência transacional
    │
    ▼
SAP Datasphere
    │  Consolidação multi-fazenda + governança
    │
    ▼
SAP Analytics Cloud (SAC Story)
    └─ Dashboard em tempo real para coordenador
```

**Foco de prioridade:** 70% balanceiro (operação) / 30% coordenador + porteiro (monitoramento e entrada)

---

## Persona Principal

**Ricardo Mendes Souza** — Balanceiro, 34 anos, Fazenda Paiaguás (MT)

> *"Eu faço minha parte direito, mas quando o sistema cai, nada que eu fiz antes existiu. Aí a culpa é minha."*

**O que Ricardo precisa:**
- Sistema que salva automaticamente a cada etapa — nunca perde dados
- Captura de peso sem digitação — sensor integrado
- DANFe/CTe em segundos — sem e-mail, sem espera
- Trilha de auditoria que o protege de responsabilizações injustas

---

## Value Proposition

> *"WeighBridge 360 permite que o balanceiro registre pesagens sem digitar nada e que o coordenador enxergue o campo em tempo real — eliminando retrabalho, fraude e atraso documental, economizando até R$ 2,9 milhões por mês para a SLC Agrícola."*

**Métricas de sucesso definidas:**
- Tempo médio de pesagem: >50 min → <15 min
- Campos digitados por ticket: ~12 → 0
- Tempo de emissão DANFe: até 2h → <30 segundos
- 100% dos tickets sincronizados ao SAP HANA automaticamente
- Zero uso de WhatsApp para monitoramento operacional

---

## Decisões Tomadas pelo Time

| Decisão | O que foi decidido |
|---------|-------------------|
| Automação do check-in | OCR de placa na portaria (confiança mínima 0.85; abaixo disso → confirmação manual) |
| Captura de peso | Sensor automático integrado à balança; entrada manual apenas como fallback com justificativa obrigatória |
| Emissão fiscal | DANFe e CTe disparados automaticamente ao registrar Pesagem 2 — sem e-mail |
| Integração SAP | CPI como canal de transporte → SAP HANA → Datasphere → SAC |
| Resiliência | Modo offline obrigatório — sistema opera sem internet e sincroniza ao reconectar |
| Governança | Trilha de auditoria imutável (append-only) em todo ticket — proteção do operador |
| Divergência de peso | Ticket bloqueado automaticamente → aprovação exclusiva do coordenador |
| Padronização | Mesmo fluxo para as 25 fazendas — configuração por fazenda, não customização de fluxo |

---

## Fora do Escopo (não tocar na S2)

- Automação do carregamento físico (silos, armazéns)
- Integração com sistemas de transportadoras externas
- Substituição ou migração do SAP ERP
- Gestão de contratos de fornecedores
- Outros processos agrícolas (plantio, colheita, irrigação)
- App mobile nativo (o app do balanceiro é web responsivo no BTP)

---

## Artefatos Gerados — Sessão 1

| Artefato | Arquivo | Status |
|----------|---------|--------|
| Problem Statement | `projeto/sessao1/problem-statement.md` | ✅ |
| Persona (Ricardo) | `projeto/sessao1/persona.md` | ✅ |
| Interview Simulation | `projeto/sessao1/interview-simulation.md` | ✅ |
| User Journey (As-Is / To-Be) | `projeto/sessao1/user-journey.md` | ✅ |
| Insights Cluster + Solução Escolhida | `projeto/sessao1/insights-cluster.md` | ✅ |
| Value Proposition | `projeto/sessao1/value-proposition.md` | ✅ |
| Domain Glossary (19 termos) | `projeto/sessao1/domain-glossary.md` | ✅ |
| Domain Model (14 BR + 5 contextos) | `projeto/sessao1/domain-model.md` | ✅ |

---

## Termos Críticos para a Sessão 2

A Sessão 2 deve usar esses termos exatamente como definidos no glossário:

| Termo | Significado rápido |
|-------|-------------------|
| `TicketPesagem` | Unidade de rastreabilidade — um ciclo completo de pesagem |
| `Tara` | Peso do caminhão vazio (Pesagem 1) |
| `PesoBruto` | Peso do caminhão cheio (Pesagem 2) |
| `PesoLiquido` | Bruto − Tara — sempre calculado, nunca digitado |
| `TrilhaAuditoria` | Log imutável append-only de cada ação no ticket |
| `Divergencia` | Status de bloqueio quando peso é inválido ou inconsistente |
| `ModoOffline` | Operação local sem internet com sync automático ao reconectar |
| `ContratoSAP` | Vínculo que valida placa, produto e quantidade na entrada |

---

## Pontos de Atenção para a Sessão 2

1. **Integração com balança física:** a captura automática de peso via sensor precisa ter seu protocolo de comunicação definido (RS-232, TCP/IP, Modbus?). NEXUS deve incluir isso na especificação técnica ou marcar como dependência de hardware a confirmar com a SLC.

2. **Integração SEFAZ para DANFe/CTe:** emissão automática depende de credenciais e certificado digital da SLC no ambiente SEFAZ. Isso é pré-requisito técnico — verificar se a SLC já tem isso configurado no SAP ou se precisa ser provisionado.

3. **Contrato SAP como fonte de dados:** o WeighBridge 360 valida placas contra contratos ativos no SAP. A Sessão 2 precisa definir como o sistema busca contratos — API SAP, OData, ou replicação para HANA.

4. **Modo offline — escopo do protótipo:** definir até que ponto o modo offline será implementado no protótipo vs. simulado no pitch. Sugestão: implementar offline para Pesagem 1 e 2; sincronização real é demonstrável.

5. **Aprovação de divergência no protótipo:** o fluxo de divergência (coordenador aprova via dashboard) é um diferencial de governança importante para o pitch — vale implementar mesmo que simplificado.

---

## Próximos Passos — Sessão 2

A Sessão 2 deve produzir, nesta ordem:

| Prioridade | Artefato | Agente | Por quê primeiro |
|-----------|----------|--------|-----------------|
| 1 | User Stories com critérios de aceite | NEXUS | Base para tudo — define o que será construído |
| 2 | API Contracts (endpoints principais) | NEXUS | Balanceiro App + CPI precisam de contrato claro |
| 3 | Especificação técnica (product spec) | NEXUS + PRISM | Detalha comportamentos, estados e integrações |
| 4 | Test Scenarios + Validation Matrix | FORGE | Garante que o protótipo pode ser validado no pitch |
| 5 | Revisão S2 | LENS | Valida cobertura antes de iniciar desenvolvimento |

**Sugestão de início da Sessão 2:**
> Diga `"sessão 2"` ou `"vamos especificar"` para ativar o contexto.
> NEXUS lerá este handoff e os artefatos da Sessão 1 automaticamente antes de começar.

---

*Handoff gerado em 2026-07-28 — fim da Sessão 1 do Spark Sessions.*
*Próxima sessão: Sessão 2 — Especificação e Qualidade.*
