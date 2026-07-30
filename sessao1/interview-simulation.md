# Interview Simulation — Ricardo Mendes Souza

## Interview Context
Session date: 2026-07-28
Duration: 20 minutos (simulado)
Interviewers: Time Spark Sessions — Desafio SLC Agrícola

## Transcript (summarizado)

**P: Como é sua manhã típica na balança?**
A: "Chego às 6h, já tem caminhão esperando desde antes de eu abrir. Ligo o computador, torço pra não travar logo de cara — porque quando trava cedo, o dia inteiro fica atrasado. Começo registrando a tara: digito a placa, o produto, o nome do motorista, o número do contrato. Tudo na mão. Se o sistema cair no meio, perdi tudo e começo de novo."
*Insight oculto: Ricardo já normalizou a possibilidade de falha. Ele não espera que o sistema funcione — ele torce. Isso indica que qualquer solução minimamente confiável será percebida como transformadora.*

**P: Quando o sistema cai, o que você faz?**
A: "Anoto no papel. Tenho sempre um caderno do lado — eu mesmo comprei, não é oficial. Porque se eu não anotar, quando o sistema volta eu não lembro dos detalhes e o ticket fica errado. Já me pediram explicação por ticket errado uma vez. Não quero passar por isso de novo."
*Insight oculto: Ricardo criou um sistema paralelo não oficial para se proteger. O caderno é evidência de desconfiança total no sistema e de medo de responsabilização.*

**P: E a emissão do documento fiscal, como funciona?**
A: "Depois que registro o peso bruto, mando e-mail pro pessoal do fiscal pedindo o DANFe. Às vezes responde em 20 minutos, às vezes em 2 horas. O caminhão fica parado esperando. O motorista fica no meu pescoço perguntando quanto tempo falta. Eu não tenho como responder porque não depende de mim — mas ele não quer saber disso."
*Insight oculto: Ricardo absorve pressão de um gargalo completamente fora do seu controle. Isso corrói sua autoridade no processo e gera estresse desnecessário.*

**P: Você já viu situação que parecia fraude, ou peso registrado diferente do real?**
A: "Olha... prefiro não entrar em detalhe. Mas já vi ticket que não batia. Pode ser erro, pode ser outra coisa. O problema é que quando é manual assim, fica difícil provar o que foi. Quem digitou errou, ou foi de propósito? Não tem como saber. Isso me incomoda porque se der problema, meu nome tá no sistema como operador do turno."
*Insight oculto: Ricardo teme ser responsabilizado por fraudes que não cometeu. A ausência de auditoria automática é uma ameaça pessoal a ele — não apenas um risco operacional.*

**P: Se você pudesse mudar uma coisa amanhã, o que seria?**
A: "O sistema salvar sozinho. Só isso já mudava minha vida. Não precisa ser sofisticado — só não me faz redigitar tudo quando cai. O resto eu me viro."
*Insight oculto: Expectativa calibrada muito baixo pelo histórico de falhas. O auto-save seria percebido como transformador — o bar para "sucesso" é tecnicamente acessível.*

**P: O coordenador te ajuda quando tem problema?**
A: "Ele fica no escritório monitorando pelo Outlook. Às vezes manda mensagem no WhatsApp perguntando quantos caminhões estão na fila. Eu respondo na mão. Ele não tem como ver em tempo real — só sabe o que eu falo. Quando a fila estoura, ele aparece aqui na cabine. Mas aí já é tarde."
*Insight oculto: O coordenador está completamente cego operacionalmente. WhatsApp como canal oficial de monitoramento é sinal de ausência total de dashboard ou visibilidade em tempo real.*

## Revealed Insights

### Confirmed Pain Points
- Sistema sem auto-save força retrabalho total a cada queda
- Emissão de DANFe por e-mail cria gargalo imprevisível fora do controle do balanceiro
- 465 quedas/mês confirmadas na operação — normalizadas como "parte do trabalho"
- Fila de caminhões gera pressão direta sobre o operador da balança

### New Pain Points (surprises)
- **Medo de responsabilização injusta:** Ricardo tem consciência de que erros e fraudes aparecem com seu nome — sem evidência de que foram causados por falha do sistema. A ausência de auditoria automática é uma ameaça pessoal.
- **Caderno paralelo não oficial:** O operador criou seu próprio sistema de backup em papel. Isso indica que a operação depende de iniciativas individuais não padronizadas — risco real de inconsistência entre fazendas.
- **Coordenador usa WhatsApp como ferramenta de monitoramento:** A comunicação operacional em tempo real acontece fora de qualquer sistema — completamente informal e não rastreável.
- **Motoristas pressionam o balanceiro pelo tempo do DANFe:** O operador vira o ponto de contato de um problema que não é seu — gerando desgaste relacional e operacional desnecessário.

### Identified Workarounds
- Caderno próprio (comprado pelo próprio Ricardo) para backup manual durante quedas
- Planilha Excel pessoal para conferência dos tickets antes de fechar o turno
- E-mail para área fiscal + ligação telefônica quando o retorno demora
- WhatsApp com coordenador para reportar status da fila em tempo real

### User Language
Termos que Ricardo usa naturalmente e devem integrar o glossário do domínio:
- "Tara" → peso do caminhão vazio, registrado na Pesagem 1
- "Bruto" → peso do caminhão carregado, registrado na Pesagem 2
- "Ticket" → registro completo de uma operação de pesagem (tara + bruto + produto + motorista)
- "DANFe" → Documento Auxiliar da Nota Fiscal Eletrônica — emitido após pesagem final
- "CTe" → Conhecimento de Transporte Eletrônico — emitido para liberar o caminhão
- "Fila" → conjunto de caminhões aguardando pesagem — métrica informal de pressão operacional
- "Fechar o turno" → validar e encerrar todos os tickets do turno antes de passar para o próximo operador

### Identified Opportunities
- **Auto-save progressivo por etapa:** salvar tara, produto e motorista imediatamente ao confirmar cada campo — não esperar o ticket completo
- **Leitura automática de placa (OCR):** eliminar a digitação manual na entrada, reduzindo erros e tempo
- **Integração direta balança → sistema:** capturar peso automaticamente ao estabilizar — sem digitação do balanceiro
- **Emissão automática de DANFe/CTe:** disparar ao registrar Pesagem 2, sem e-mail ou acionamento manual
- **Dashboard em tempo real para coordenador:** eliminar WhatsApp como canal operacional
- **Trilha de auditoria imutável por ticket:** proteger o operador de responsabilizações injustas com log automático de quem registrou o quê e quando
- **Modo offline com sincronização:** fallback local que preserva dados durante quedas de conectividade

## Impact on the Problem Statement
A entrevista confirmou e aprofundou o problem statement. Dois pontos merecem atualização:

1. **A dor da responsabilização** não estava explícita: o balanceiro não é apenas prejudicado pela instabilidade — ele é potencialmente acusado por falhas que o sistema deveria prevenir. A solução precisa incluir auditoria automática como proteção ao operador, não apenas como governança corporativa.

2. **A informalidade como sistema:** caderno, Excel pessoal, WhatsApp e telefone não são gambiarras ocasionais — são o sistema real de operação. A solução precisa substituir esses canais, não apenas coexistir com eles.
