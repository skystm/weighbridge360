# Pitch Script — WeighBridge 360
## Apresentação Oral — Sem Slides

**Time:** WeighBridge 360 — Spark Sessions · SLC Agrícola
**Duração:** 10 minutos + 5 min Q&A
**Formato:** Fala direta + demo ao vivo no app

---

## PARTE 1 — A HISTÓRIA (1 min)
*Falar de pé, olhando para a audiência. Sem abrir o computador ainda.*

---

"São 6 da manhã na Fazenda Paiaguás, no Mato Grosso. Ricardo chega na cabine da balança e já tem fila lá fora. Ele liga o computador — e torce. Não torce pra ganhar. Torce pra o sistema não cair.

Ele começa a digitar: placa do caminhão, nome do motorista, número do contrato, tipo de produto. Tudo na mão. No meio do processo — o sistema cai. Tudo perdido. Ricardo pega o caderno que ele mesmo comprou e anota no papel, pra não esquecer.

Depois de pesar o caminhão, ele manda um e-mail pro pessoal do fiscal pedindo a nota. Espera. Às vezes 20 minutos, às vezes 2 horas. O motorista fica no pescoço dele perguntando quando sai. Ricardo não tem o que responder — não depende dele.

No fim do dia, ele abre o Excel pessoal pra conferir se todos os tickets fecharam certo. Porque se tiver erro, o nome dele está no sistema. E não tem como provar que não foi ele."

*[pausa de 2 segundos]*

"Isso acontece 465 vezes por mês. Em 25 fazendas. E custa R$ 4,1 milhões todo mês."

---

## PARTE 2 — O PROBLEMA (45s)
*Ainda sem computador. Falar com firmeza.*

---

"O processo de pesagem da SLC é 100% manual. Sistema instável. Sem auto-save. Sem fallback. Sem integração com o SAP.

O coordenador monitora a fazenda pelo WhatsApp. A nota fiscal sai por e-mail. Os dados chegam no ERP depois que tudo aconteceu — digitados na mão por alguém.

Nesse modelo, qualquer erro vira fraude. E qualquer fraude vira problema de quem estava de turno.

A SLC processa 38 caminhões por dia numa única fazenda. Isso não escala. E o problema não é só deles — são 30.000 clientes SAP no mundo com balanças industriais esperando uma solução nativa."

---

## PARTE 3 — NOSSA SOLUÇÃO (45s)
*Ainda sem computador. Construir a imagem na cabeça da audiência antes de mostrar.*

---

"A gente construiu o WeighBridge 360.

Câmera lê a placa na entrada. Sensor captura o peso. Nota fiscal sai em menos de 30 segundos. Tudo vai direto pro SAP — sem digitar nada, sem e-mail, sem planilha.

Se a internet cair, continua funcionando. Quando voltar, sincroniza sozinho.

E tudo que acontece fica registrado numa trilha de auditoria imutável. O Ricardo não pode mais ser responsabilizado por algo que o sistema não consegue provar.

Deixa eu mostrar."

---

## PARTE 4 — DEMO AO VIVO (3 min)
*Abrir o app em http://localhost:4004/react-ui — projetar na tela.*

---

**[Abrir tela de Check-in]**

"Caminhão chegando na Fazenda Paiaguás. Vou acionar a câmera OCR."

*[Clicar em "Acionar câmera OCR" — aguardar animação]*

"Placa lida automaticamente. 94% de confiança. O sistema valida contra o contrato no SAP: 400 toneladas de soja autorizadas. Transportadora Cerrado. Zero digitação."

*[Clicar em "Registrar chegada"]*

"Check-in registrado."

---

**[Ir para tela de Pesagem — clicar "Ler sensor"]**

"Caminhão vazio na balança. O sensor aguarda estabilização..."

*[Aguardar animação — peso aparece: ~18.500 kg]*

*[Clicar "Confirmar Tara"]*

**"Tara registrada. Dado salvo imediatamente. Se o sistema cair agora — não perdemos nada."**

---

*[Clicar "Liberar para silo" — depois "Ler sensor"]*

"Caminhão foi carregar. Voltou. Sensor lê o peso bruto..."

*[Aguardar — ~43.200 kg aparecem]*

*[Clicar "Confirmar Peso Bruto"]*

**"24.700 kg de soja. Calculado automaticamente. Sem digitação."**

---

*[Aguardar 3 segundos — DANFe e CTe aparecem como AUTORIZADO]*

**"Nota fiscal emitida. Sem e-mail. Sem espera. Em menos de 30 segundos."**

*[Clicar "Liberar caminhão"]*

**"Concluído. Dados no SAP HANA. Automático. Em tempo real."**

---

*[Abrir aba Dashboard]*

"E o coordenador enxerga tudo aqui. Fila em tempo real. Alertas automáticos. Sem WhatsApp. Sem planilha."

*[pausa]*

**"Do campo ao ERP. Sem um campo digitado. Sem um e-mail enviado. Sem uma planilha aberta."**

---

## PARTE 5 — COMO FOI CONSTRUÍDO (1 min)
*Fechar o computador ou deixar o dashboard na tela.*

---

"Isso é 100% SAP. O app roda no SAP BTP com CAP Node.js. Os dados saem via SAP Integration Suite para o SAP HANA. De lá vão pro Datasphere e aparecem no SAC.

Nenhum serviço externo. Nenhuma dependência de cloud de terceiros. Uma arquitetura que a SLC já conhece e que pode ser replicada para as 30.000 empresas no mundo que usam balanças industriais com SAP.

Isso foi construído em 3 sessões. Domain model, especificação, 8 user stories, 14 regras de negócio, API completa, frontend funcional — tudo documentado e versionado no GitHub."

---

## PARTE 6 — PRÓXIMOS PASSOS (30s)
*Direto e objetivo.*

---

"Para ir a produção, precisamos de três coisas: confirmar o protocolo de comunicação com a balança física da SLC, provisionar o certificado SEFAZ, e fazer o deploy no BTP deles. Estimativa: 6 semanas.

O plano é: piloto na Paiaguás em 30 dias, rollout em 5 fazendas em 90 dias, produto SAP em 6 meses.

R$ 2,9 milhões por mês. Retorno em menos de 30 dias de piloto."

---

## ENCERRAMENTO (15s)

---

"WeighBridge 360 não substitui o Ricardo. Ele devolve para o Ricardo o que sempre deveria ter sido dele: um turno sem retrabalho, dados que ele pode confiar, e nenhuma noite perdida com caderno."

---

## Q&A — RESPOSTAS PREPARADAS

**"Por que vocês são as pessoas certas para isso?"**
> Em 3 sessões mapeamos o domínio, especificamos as histórias de usuário, definimos 14 regras de negócio, construímos a API e o frontend — e o fluxo roda agora. Entendemos o problema do Ricardo, falamos a língua do SAP e entregamos código que funciona.

**"Por que agora?"**
> 465 quedas por mês não é instabilidade — é crise crônica. E o SAP tem 30.000 clientes globais esperando uma solução nativa para balanças industriais. A janela está aberta.

**"Qual é o principal risco técnico?"**
> Integração com a balança física — cada fabricante tem seu protocolo. No protótipo usamos mock do sensor. Em produção precisamos confirmar o protocolo com a SLC e desenvolver o driver. É um risco conhecido, não um bloqueio arquitetural.

**"Quanto custa implementar?"**
> Driver da balança (~2 semanas), certificado SEFAZ (burocracia, não tecnologia), deploy BTP (~1 semana). Total: 6 semanas. O core já está pronto.

**"Qual é o retorno?"**
> R$ 2,9M por mês só com atrasos operacionais. O piloto se paga em menos de 30 dias. Isso sem contar rastreabilidade fiscal e prevenção de fraude.

**"O que vocês aprenderam que não esperavam?"**
> Que o problema mais crítico não era técnico — era humano. O Ricardo não tem medo de tecnologia. Ele tem medo de ser responsabilizado por algo que o sistema não consegue provar que não foi ele. A trilha de auditoria imutável não é só compliance — é o que devolve a dignidade profissional do operador. Esse insight veio da entrevista com a persona, não do PDF do desafio.

---

## GUIA DE TIMING

| Parte | Duração |
|-------|---------|
| A história do Ricardo | 1 min |
| O problema | 45s |
| Nossa solução | 45s |
| Demo ao vivo | 3 min |
| Como foi construído | 1 min |
| Próximos passos | 30s |
| Encerramento | 15s |
| Buffer | 45s |
| **Total** | **~8 min** |

> **Versão 5 min:** História (30s) · Problema (30s) · Solução (20s) · Demo (2min 30s) · Próximos passos (30s) · Encerramento (10s) · Buffer (10s)

---

## DICA DE APRESENTAÇÃO

Não leia esse script. Use-o como guia de estrutura. O que precisa decorar são as 4 frases-âncora:

1. *"Isso acontece 465 vezes por mês. Em 25 fazendas. E custa R$ 4,1 milhões todo mês."*
2. *"Deixa eu mostrar."*
3. *"Do campo ao ERP. Sem um campo digitado. Sem um e-mail enviado. Sem uma planilha aberta."*
4. *"WeighBridge 360 não substitui o Ricardo. Ele devolve para o Ricardo o que sempre deveria ter sido dele."*

O resto flui naturalmente se você conhece o produto — e vocês conhecem, porque foram vocês que construíram.
