# Persona: Ricardo

## Profile
**Name:** Ricardo Mendes Souza
**Job Title:** Balanceiro — Operador de Balança
**Company/Area:** SLC Agrícola — Fazenda Paiaguás (MT)
**Age:** 34 anos
**Location:** Região do Mato Grosso — vive próximo à fazenda, trabalho presencial integral

## A Day in the Life of Ricardo
Ricardo chega às 6h para o turno da manhã. Antes mesmo de ligar o sistema, já tem fila de caminhões esperando. Ele faz login no sistema legado, torce para não cair, e começa a registrar tara por tara — digitando placa, produto, motorista. Quando o sistema trava (o que acontece com frequência), ele anota no papel para não perder os dados e refaz o processo quando volta. No fim do turno, precisa garantir que todos os tickets foram registrados corretamente antes de passar para o próximo operador — qualquer divergência vira problema dele.

## Goals
- Fechar o turno sem nenhum ticket pendente ou com erro
- Manter a fila fluindo — nenhum motorista esperando mais do que o necessário
- Ter seus registros corretos e auditáveis — nunca ser apontado como causa de uma inconsistência

## Pains and Frustrations
- **Sistema instável sem fallback:** O sistema cai sem aviso. Ricardo perde o registro em andamento e precisa reiniciar do zero — sob pressão da fila crescendo lá fora.
- **Sem auto-save:** Uma queda de energia ou travamento apaga tudo que foi digitado. Ele desenvolveu o hábito de anotar no papel como seguro — mas isso cria duplo trabalho e risco de erro na transcrição.
- **Responsabilidade sem ferramenta confiável:** Se um peso registrado estiver errado, o problema sobe para o coordenador — e o nome do balanceiro está no ticket. Ricardo sente o peso de uma responsabilidade que o sistema não ajuda a suportar.
- **Fila que escapa do controle:** Quando o processo atrasa por falha técnica, a fila cresce e motoristas ficam impacientes. Ricardo absorve essa pressão diretamente, mesmo sem poder fazer nada.
- **Emissão de DANFe por e-mail:** Depois de registrar o peso, Ricardo ainda precisa acionar a área fiscal por e-mail para emitir o documento. O retorno é imprevisível — e o caminhão fica parado esperando.

## How They Solve It Today (Workarounds)
- Anota dados no papel durante o processo como backup manual contra quedas do sistema
- Mantém planilha própria no Excel para conferir tickets do turno antes de fechar
- Liga diretamente para a área fiscal quando o e-mail demora — criando dependência pessoal
- Avisa o coordenador por WhatsApp quando a fila passa de um certo número de caminhões

## Representative Quote
> "Eu faço minha parte direito, mas quando o sistema cai, nada que eu fiz antes existiu. Aí a culpa é minha."

## What Changes with the Solution
Ricardo opera um sistema que lê a placa automaticamente, registra o peso direto da balança e emite o documento fiscal sem nenhuma ação manual. Se a conexão cair, o sistema salva localmente e sincroniza depois. Ele fecha o turno com todos os tickets registrados, auditáveis e enviados ao SAP — sem papel, sem retrabalho, sem WhatsApp para o fiscal.
