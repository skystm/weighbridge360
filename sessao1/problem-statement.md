# Problem Statement

## The Problem

A SLC Agrícola opera 25 fazendas distribuídas pelo Brasil, processando diariamente o carregamento e descarregamento de soja, algodão, milho e produtos pecuários via caminhões. O controle desse fluxo — da entrada do caminhão na portaria até a liberação com documentação fiscal — depende inteiramente de trabalho manual: porteiros registrando dados de motoristas à mão, balanceiros digitando pesos sem auto-save, coordenadores consolidando informações em planilhas e solicitando documentos por e-mail. O resultado é um processo frágil, lento e inconsistente.

O sistema legado que suporta esse processo registra 465 incidentes de queda por mês nas 25 fazendas, sem nenhum mecanismo de fallback. Cada queda reinicia o processo do zero. A fila de espera pode ultrapassar 24 horas, e cada pesagem consome mais de 50 minutos por caminhão — gerando um custo estimado de R$ 136 mil por dia em atrasos, R$ 4,1 milhões por mês considerando todas as 66 filiais. Nenhum dado é integrado ao SAP: tudo é inserido manualmente no ERP após o fato, criando janelas de risco para fraude, inconsistência e perda de rastreabilidade.

## Who Is Affected

**Primary persona:** Balanceiro — operador da balança nas fazendas da SLC Agrícola
**Context:** Trabalha na cabine de pesagem, operando o sistema legado para registrar tara e peso bruto dos caminhões. Lida diariamente com quedas de sistema, retrabalho de reinício de processo e pressão da fila crescente de motoristas esperando.
**Impact:** Retrabalho constante por falta de auto-save; responsabilidade operacional sem ferramentas confiáveis; exposição a erros que podem resultar em inconsistências financeiras ou acusações de fraude; estresse gerado pela fila que pode ultrapassar 24h.

**Perfis secundários afetados:**
- **Porteiro:** registra chegada e dados do veículo manualmente em sistema instável
- **Coordenador:** monitora filas e volumes via Outlook e planilhas, sem visibilidade em tempo real
- **Área Fiscal/Financeira:** recebe dados do SAP com atraso e inconsistências por entrada manual

## Why Now

A SLC Agrícola está em expansão — uma única fazenda (Paiaguás) opera 62.902 ha, processa ~38 caminhões/dia e ~6.646 tickets de pesagem/mês. O custo de atraso já é mensurável e crescente. Além disso, a ausência de integração com SAP representa risco regulatório e de auditoria que se torna inaceitável na escala atual. Existe também uma oportunidade de mercado: ~30.000 clientes globais da SAP utilizam balanças industriais — uma solução padronizada pode se tornar módulo da SAP Business Suite.

## What Success Looks Like

- O caminhão entra na fazenda, tem a placa identificada automaticamente, é direcionado à balança e tem seu peso registrado sem intervenção manual do operador
- O DANFe/CTe é emitido automaticamente ao final da pesagem, sem e-mail ou solicitação humana
- Todos os dados de pesagem são enviados ao SAP em tempo real, com trilha de auditoria imutável
- O coordenador tem visibilidade em tempo real de fila, volume por produto e indicadores por fazenda — sem planilha
- O mesmo processo roda de forma padronizada nas 25 fazendas, com fallback offline que preserva os dados em caso de queda de conectividade
- Tempo médio de pesagem reduz de >50 min para <15 min por caminhão

## Out of Scope for This Problem

- Automação do processo de carregamento físico (movimentação de grãos, silos)
- Integração com sistemas de transportadoras externas
- Substituição completa do SAP ou mudança de ERP
- Gestão de contratos de fornecedores ou logística de saída das fazendas
- Outros processos agrícolas não relacionados ao fluxo de pesagem (plantio, colheita, irrigação)
