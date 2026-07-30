# Validation Matrix — WeighBridge 360

| Story | Cenário | Tipo | Prioridade | Automatizável | Status |
|-------|---------|------|-----------|--------------|--------|
| US-01 | TC-01.1 OCR alta confiança (happy path) | E2E | Crítica | Sim | ⬜ Pendente |
| US-01 | TC-01.2 OCR baixa confiança (confirmação manual) | Integration | Alta | Sim | ⬜ Pendente |
| US-01 | TC-01.3 Placa não encontrada | Unit | Alta | Sim | ⬜ Pendente |
| US-01 | TC-01.4 Ticket ativo já existente | Unit | Alta | Sim | ⬜ Pendente |
| US-02 | TC-02.1 Tara por sensor (happy path) | E2E | Crítica | Sim | ⬜ Pendente |
| US-02 | TC-02.2 Sensor offline, entrada manual | Integration | Alta | Sim | ⬜ Pendente |
| US-02 | TC-02.3 Peso fora dos limites | Unit | Média | Sim | ⬜ Pendente |
| US-02 | TC-02.4 Ação em status incorreto | Unit | Alta | Sim | ⬜ Pendente |
| US-03 | TC-03.1 Peso Bruto válido, PesoLiquido calculado | E2E | Crítica | Sim | ⬜ Pendente |
| US-03 | TC-03.2 PesoBruto < Tara — divergência | Integration | Crítica | Sim | ⬜ Pendente |
| US-03 | TC-03.3 PesoLiquido excede saldo contrato | Integration | Alta | Sim | ⬜ Pendente |
| US-04 | TC-04.1 DANFe/CTe emitidos em < 30s | E2E | Crítica | Sim | ⬜ Pendente |
| US-04 | TC-04.2 SEFAZ indisponível, retry automático | Integration | Alta | Sim | ⬜ Pendente |
| US-04 | TC-04.3 Liberar sem documentos autorizados | Unit | Crítica | Sim | ⬜ Pendente |
| US-05 | TC-05.1 Coordenador aprova divergência | E2E | Crítica | Sim | ⬜ Pendente |
| US-05 | TC-05.2 Balanceiro tenta aprovar (bloqueado) | Unit | Crítica | Sim | ⬜ Pendente |
| US-06 | TC-06.1 Dashboard fila em tempo real | E2E | Alta | Sim | ⬜ Pendente |
| US-06 | TC-06.2 Alerta de threshold disparado | Integration | Alta | Sim | ⬜ Pendente |
| US-07 | TC-07.1 Sync SAP HANA via CPI | Integration | Crítica | Sim | ⬜ Pendente |
| US-07 | TC-07.2 Modo Offline, sync em lote | E2E | Crítica | Sim | ⬜ Pendente |
| US-07 | TC-07.3 HANA indisponível, retry | Integration | Alta | Sim | ⬜ Pendente |
| DEMO | TC-DEMO Fluxo completo pitch (4 min) | E2E Manual | Crítica | Não (manual) | ⬜ Pendente |

---

## Legenda de Status
- ⬜ Pendente — não implementado
- 🔄 Em andamento — sendo implementado
- ✅ Aprovado — passou no teste
- ❌ Falhou — problema identificado (issue aberto)

---

## Resumo por Prioridade

| Prioridade | Total | Automatizáveis | Manuais |
|-----------|-------|---------------|---------|
| Crítica | 10 | 9 | 1 (TC-DEMO) |
| Alta | 11 | 11 | 0 |
| Média | 1 | 1 | 0 |
| **Total** | **22** | **21** | **1** |

---

## Cobertura por Story

| Story | Cenários | Happy Path | Edge Case | Failure |
|-------|---------|-----------|----------|---------|
| US-01 Check-in OCR | 4 | ✅ | ✅ | ✅ |
| US-02 Tara automática | 4 | ✅ | ✅ | ✅ |
| US-03 Peso Bruto | 3 | ✅ | — | ✅ |
| US-04 DANFe/CTe | 3 | ✅ | — | ✅ |
| US-05 Divergência | 2 | ✅ | — | ✅ |
| US-06 Dashboard fila | 2 | ✅ | ✅ | — |
| US-07 Sync SAP | 3 | ✅ | ✅ | ✅ |
| DEMO Pitch | 1 | ✅ | — | — |

---

## Critérios de Demo Readiness (PROBE executa antes do pitch)

O protótipo está pronto para o pitch quando:
- [ ] Todos os cenários Críticos com status ✅ Aprovado
- [ ] TC-DEMO executado com sucesso pelo menos uma vez em ambiente BTP
- [ ] Zero cenários com status ❌ Falhou sem issue documentado e workaround definido
- [ ] Modo Offline validado (TC-07.2) — cenário mais provável de falha no pitch
- [ ] Tempo da demo cronometrado: < 5 minutos com margem de segurança
