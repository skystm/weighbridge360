# Architecture Decision — WeighBridge 360

## Chosen Stack
- **Frontend:** SAP Fiori Elements (telas padrão) + React customizado para app do Balanceiro
- **Backend:** CAP Node.js (SAP Cloud Application Programming Model)
- **Database:** SAP HANA Cloud (entidades via CDS)
- **SAP Integration:** CAP Remote Service (OData S/4HANA para ContratosSAP) + CPI iFlow (tickets → HANA)
- **Analytics:** SAP Datasphere + SAP Analytics Cloud (SAC Story)
- **Deploy target:** SAP BTP Cloud Foundry

## Skills Activated (Sessão 3)
- [x] `cap-development`
- [ ] `sap-agent-bootstrap`
- [ ] `n8n-workflow`
- [ ] `n8n-sap-mcp-client`
- [ ] `n8n-sap-ai-core`
- [ ] `n8n-sap-task-center`
- [ ] `v0-frontend-app`
- [ ] `mcp-translation-file`
- [x] `setup-solution`
- [x] `deploy-solution`

## Reason for the Choice
O WeighBridge 360 é uma aplicação centrada em dados estruturados (TicketPesagem com ciclo de vida bem definido) e interface operacional para o Balanceiro — padrão CAP Node.js. A integração com S/4HANA (ContratosSAP via OData) é tratada via CAP Remote Service, eliminando chamadas HTTP diretas. Não há necessidade de IA generativa ou orquestração de workflows — o valor está na automação de captura e na rastreabilidade, não em decisão autônoma.

## Accepted Trade-offs
- SAC Story requer dados no Datasphere — para o protótipo, o dashboard pode ser simulado com dados mockados se a replicação HANA→Datasphere não estiver disponível no ambiente
- OCR de placa depende de hardware físico — protótipo usa mock do sensor com valor fixo configurável para demonstração
- Emissão SEFAZ real requer certificado digital da SLC — protótipo simula a autorização com resposta mockada, fluxo completo mantido

## Next Steps
1. Rodar `setup-solution` para criar `solution.yaml` e `asset.yaml`
2. CORE ativa `cap-development` e começa pelo schema CDS (TicketPesagem, Fazenda, Balanca)
3. VOLT implementa a interface do Balanceiro consumindo os endpoints do api-contracts.md
4. SENTINEL faz review contínuo por story
5. `deploy-solution` executado antes do pitch

## Decisão aprovada por
Time WeighBridge 360 — Sessão 3 — 2026-07-28 13h06
