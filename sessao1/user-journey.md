# User Journey — Ricardo Mendes Souza (Balanceiro)

## Jornada Atual (As-Is)

| # | Etapa | O que Ricardo faz | Ferramentas | Emoção | Dor |
|---|-------|-------------------|-------------|--------|-----|
| 1 | **Chegada e abertura** | Chega às 6h, liga o computador, torce para o sistema não travar | Sistema legado | Ansioso | Sistema pode já iniciar travado |
| 2 | **Check-in do caminhão** | Porteiro registra placa e dados do motorista manualmente no sistema | Sistema legado instável | Neutro | Dados dependem de digitação correta do porteiro — sem validação |
| 3 | **Fila de espera** | Caminhão aguarda vaga na balança — sem previsão de tempo | Nenhuma | Frustrado | Fila pode ultrapassar 24h; motoristas pressionam Ricardo pelo status |
| 4 | **Pesagem 1 — Tara** | Ricardo digita placa, produto, motorista e número do contrato; aciona a balança manualmente; registra o peso | Sistema legado | Concentrado | Qualquer queda aqui apaga tudo; anota no caderno como backup |
| 5 | **Carregamento** | Caminhão vai ao silo/armazém para ser carregado | Externo | Aguardando | Tempo variável; Ricardo não tem visibilidade do andamento |
| 6 | **Pesagem 2 — Bruto** | Caminhão retorna; Ricardo registra peso bruto manualmente | Sistema legado | Aliviado (quase acabou) | Se sistema caiu entre P1 e P2, precisa recomeçar do zero |
| 7 | **Solicitação de DANFe/CTe** | Ricardo envia e-mail para área fiscal solicitando emissão do documento | Outlook | Impotente | Retorno imprevisível: 20 min a 2h; caminhão parado; motorista no pescoço |
| 8 | **Liberação do caminhão** | Recebe documento por e-mail, confirma e libera o caminhão | Outlook + verbal | Aliviado | Se documento demorou, atraso se acumula na fila |
| 9 | **Fechamento do turno** | Confere tickets do turno na planilha Excel própria; passa para o próximo operador | Excel pessoal | Tenso | Qualquer divergência vira problema — o nome dele está nos tickets |
| 10 | **Reporte ao coordenador** | Responde WhatsApp do coordenador informando status da fila | WhatsApp pessoal | Sobrecarregado | Canal informal, não rastreável, depende de Ricardo estar disponível |

**Pontos de maior dor:**
- Etapa 4 e 6: risco de perda total de dados por queda de sistema
- Etapa 7: gargalo completamente fora do controle de Ricardo
- Etapa 9: responsabilidade sem ferramenta confiável de auditoria
- Etapa 10: monitoramento operacional via WhatsApp pessoal

---

## Jornada Ideal (To-Be)

| # | Etapa | O que Ricardo faz | Ferramentas | Emoção | Melhoria |
|---|-------|-------------------|-------------|--------|----------|
| 1 | **Chegada e abertura** | Faz login no sistema — já mostra status da fila e tickets pendentes do turno anterior | SAP BTP Web App | Confiante | Sistema estável, dashboard imediato |
| 2 | **Check-in automático** | Câmera OCR lê a placa do caminhão na entrada; sistema puxa dados do contrato automaticamente | OCR + SAP integrado | Neutro | Zero digitação; validação automática contra contrato SAP |
| 3 | **Fila gerenciada** | Sistema exibe fila ordenada com tempo estimado por caminhão; coordenador vê o mesmo dashboard | SAP BTP Dashboard | Organizado | Motoristas recebem estimativa; pressão sobre Ricardo reduz |
| 4 | **Pesagem 1 — Tara automática** | Ricardo confirma o caminhão na balança; sensor captura o peso automaticamente; sistema salva imediatamente | Balança integrada + SAP | Tranquilo | Auto-save por etapa; sem redigitação; dado imutável com timestamp |
| 5 | **Carregamento monitorado** | Status do carregamento atualizado pelo silo; Ricardo acompanha no dashboard | SAP integrado | Aguardando (informado) | Visibilidade do andamento sem dependência de comunicação manual |
| 6 | **Pesagem 2 — Bruto automático** | Caminhão retorna; sensor captura peso bruto; sistema calcula líquido automaticamente | Balança integrada + SAP | Tranquilo | Cálculo automático; sem erro de digitação; registro auditável |
| 7 | **Emissão automática de DANFe/CTe** | Sistema emite o documento automaticamente ao confirmar Pesagem 2 | SAP + integração fiscal | Aliviado | Zero e-mail; zero espera; documento disponível em segundos |
| 8 | **Liberação imediata** | Ricardo confirma liberação no sistema; cancela automaticamente o slot na fila | SAP BTP Web App | Satisfeito | Fluxo contínuo; caminhão sai sem atraso documental |
| 9 | **Fechamento do turno** | Sistema gera relatório do turno automaticamente — tickets, pesos, divergências sinalizadas | SAP Dashboard | Seguro | Auditoria automática protege Ricardo; sem Excel pessoal |
| 10 | **Coordenador informado automaticamente** | Dashboard do coordenador atualiza em tempo real; alertas automáticos quando fila ultrapassa threshold | SAP BTP Dashboard | Sem sobrecarga | Zero WhatsApp operacional; coordenador age de forma proativa |

---

## Comparativo de Impacto

| Métrica | Hoje (As-Is) | Ideal (To-Be) |
|---------|-------------|--------------|
| Tempo médio por pesagem | >50 min | <15 min |
| Digitação manual por ticket | ~12 campos | 0 campos |
| Risco de perda de dados | Alto (sem auto-save) | Zero (save por etapa) |
| Tempo para emissão DANFe | 20 min a 2h | <30 segundos |
| Visibilidade do coordenador | Reativa (WhatsApp) | Tempo real (dashboard) |
| Rastreabilidade por ticket | Baixa (manual) | Total (log imutável SAP) |
| Canal de backup do Ricardo | Caderno + Excel pessoal | Nenhum necessário |

---

## Momento da Verdade
> A etapa crítica é a **Pesagem 1 (Tara)**. É onde o processo pode ser perdido por completo, onde o risco de fraude começa, e onde a confiança do operador no sistema é testada a cada turno. Resolver essa etapa com auto-save, captura automática e trilha de auditoria transforma toda a jornada downstream.
