# Pitch Script — WeighBridge 360

**Time:** WeighBridge 360 — Spark Sessions · SLC Agrícola
**Duração:** 10 minutos + 5 min Q&A
**Data:** 2026-07-28

---

## Slide 1: O Hook (1 min)

**Tipo:** Narrativa — história real do Ricardo

**Conteúdo:**

> "São 6 da manhã na Fazenda Paiaguás, no Mato Grosso. Ricardo chega na cabine da balança e já tem fila lá fora. Ele liga o computador — e torce. Não torce pra ganhar. Torce pra o sistema não cair.
>
> Ele começa a digitar: placa do caminhão, nome do motorista, número do contrato, tipo de produto. Tudo na mão. No meio do processo — o sistema cai. Tudo perdido. Ricardo pega o caderno que ele mesmo comprou e anota no papel, pra não esquecer.
>
> Depois de pesar o caminhão, ele manda um e-mail pro pessoal do fiscal pedindo a nota. Espera. Às vezes 20 minutos, às vezes 2 horas. O motorista fica no pescoço dele perguntando quando sai. Ricardo não tem o que responder — não depende dele.
>
> No fim do dia, ele abre o Excel pessoal pra conferir se todos os tickets fecharam certo. Porque se tiver erro, o nome dele está no sistema. E não tem como provar que não foi ele."

**Frase de transição:** *"Isso acontece 465 vezes por mês. Em 25 fazendas. E custa R$ 4,1 milhões todo mês."*

**Visual sugerido:** Foto de cabine de balança agrícola + caderno de papel ao lado do computador

---

## Slide 2: O Problema (1 min)

**Tipo:** Problema quantificado

**Conteúdo:**
- **Problema central:** O processo de pesagem de carregamentos agrícolas da SLC é 100% manual, em sistema instável, sem integração com o SAP
- **Quem sofre:** Balanceiros, coordenadores e a área fiscal em 25 fazendas distribuídas pelo Brasil
- **Custo do status quo:**
  - R$ 4,1 milhões/mês em atrasos operacionais (66 filiais)
  - 465 quedas de sistema/mês — sem fallback, sem auto-save
  - Fila de até 24h por caminhão · pesagem leva >50 min
  - Risco real de fraude: dados inseridos manualmente no SAP após o processo — sem auditoria
- **Por que agora:** A SLC opera 62.902 ha em uma única fazenda, processa 38 caminhões/dia. Na escala atual, o sistema manual não sustenta o crescimento. E o mercado SAP tem 30.000 clientes globais com o mesmo problema.

**Visual sugerido:** Tabela das 6 dores com impacto financeiro + mapa das 25 fazendas

---

## Slide 3: Nossa Solução (1 min 30s)

**Tipo:** Solução — proposta de valor

**Conteúdo:**
- **O que é:** WeighBridge 360 — plataforma SAP-native que automatiza o ciclo completo de pesagem agrícola, do campo ao ERP
- **Como funciona em 3 frases:**
  - Câmera lê a placa na entrada. Sensor captura o peso. Nota fiscal sai em menos de 30 segundos.
  - Tudo vai direto pro SAP — sem digitar nada, sem e-mail, sem planilha.
  - Se a internet cair, continua funcionando. Quando voltar, sincroniza sozinho.
- **O que muda para o Ricardo:**
  - Antes: 12 campos digitados por ticket, sistema que cai, caderno como backup
  - Depois: 3 cliques de confirmação, dado imutável no SAP, turno fechado sem retrabalho
- **Diferencial de governança:** Toda ação — humana ou automática — fica registrada em trilha de auditoria imutável. O Ricardo não pode mais ser responsabilizado por algo que o sistema não provou.

**Frase central:**
> *"WeighBridge 360 permite que o balanceiro registre pesagens sem digitar nada, sabendo que os dados estão seguros e auditáveis no SAP — economizando até R$ 2,9 milhões por mês para a SLC Agrícola."*

**Visual sugerido:** Before/after lado a lado — processo atual (caderno, e-mail, planilha) vs. WeighBridge 360 (sensor, automático, SAP)

---

## Slide 4: Demo (3 min)

**Tipo:** Demonstração ao vivo

**Script da demo:**

| # | O que o apresentador faz | O que aparece | Fala |
|---|--------------------------|---------------|------|
| 1 | Abre tela de Check-in | App WeighBridge 360 | *"Caminhão chegando na Paiaguás. Vou acionar a câmera OCR."* |
| 2 | Clica em "Acionar câmera OCR" | Animação de leitura, placa ABC1D23 aparece, score 94% | *"Placa lida automaticamente. 94% de confiança. Contrato validado no SAP: 400 toneladas de soja disponíveis."* |
| 3 | Clica em "Registrar chegada" | Ticket criado, status AGUARDANDO_TARA | *"Check-in registrado. Zero digitação."* |
| 4 | Vai para tela de Pesagem, clica "Ler sensor" | Animação de estabilização, 18.500 kg | *"Caminhão vazio na balança. Sensor estabiliza..."* |
| 5 | Clica "Confirmar Tara" | Status → AGUARDANDO_CARGA | **✨ "Tara registrada. Dado salvo. Se o sistema cair agora, não perdemos nada."** |
| 6 | Clica "Liberar para silo", depois "Ler sensor" | 43.200 kg | *"Caminhão volta carregado."* |
| 7 | Clica "Confirmar Peso Bruto" | PesoLíquido: 24.700 kg calculado automaticamente | **✨ "24.700 kg calculados automaticamente. Sem digitação."** |
| 8 | Aguarda 3 segundos | DANFe e CTe: AUTORIZADO | **✨ "Nota fiscal emitida em menos de 30 segundos. Sem e-mail. Sem espera."** |
| 9 | Clica "Liberar caminhão" | Status: CONCLUIDO · SAP: Sincronizado ✅ | **✨ "Dados no SAP HANA. Automático. Em tempo real."** |
| 10 | Abre Dashboard (aba coordenador) | Fila em tempo real, ticket recém concluído | *"E o coordenador enxerga tudo aqui. Sem WhatsApp. Sem planilha."* |

**Frase de abertura da demo:**
> *"Vou mostrar o que o Ricardo vai ver na segunda-feira."*

**Frase do momento WOW principal:**
> *"Do campo ao ERP. Sem um campo digitado. Sem um e-mail enviado. Sem uma planilha aberta."*

**Frase de encerramento da demo:**
> *"Isso é o que acontece quando você substitui o caderno do Ricardo por um sistema que foi feito pra ele."*

**Plano B (se a demo falhar):**
- Screenshots de cada etapa em `projeto/sessao3/demo-backup/`
- Vídeo gravado do fluxo completo disponível como fallback
- Servidor local em `http://localhost:4004/react-ui` como alternativa ao BTP

---

## Slide 5: Como Foi Construído (1 min 30s)

**Tipo:** Técnico — para audiência SAP e decisores

**Conteúdo:**

```
Balança (sensor físico)
        ↓
WeighBridge 360 App
   SAP BTP · CAP Node.js · React
   [Check-in OCR · Pesagem · Documentos · Modo Offline]
        ↓
SAP Integration Suite (CPI)
   [Transporte confiável com retry automático]
        ↓
SAP HANA Cloud
   [Persistência transacional · Trilha de Auditoria imutável]
        ↓
SAP Datasphere → SAP Analytics Cloud
   [Governança multi-fazenda · Dashboard Coordenador]
```

- **100% SAP-native:** BTP + CPI + HANA + Datasphere + SAC — zero dependência externa
- **Construído em 3 sessões:** domain model, 8 user stories, 14 business rules, API REST completa, frontend React funcional
- **Pronto para escalar:** mesma arquitetura serve os 30.000 clientes SAP com balanças industriais no mundo

**Visual sugerido:** Diagrama da arquitetura com logos SAP em cada camada

---

## Slide 6: Próximos Passos (1 min)

**Tipo:** Visão — do PoC ao produto

**Conteúdo:**

- **Do PoC ao MVP — o que falta:**
  - Integração real com a balança física (protocolo RS-232/Modbus a confirmar com SLC)
  - Certificado digital SEFAZ da SLC para emissão real de DANFe/CTe
  - Deploy em BTP produtivo com dados reais de uma fazenda piloto

- **Próximos 3 passos concretos:**
  1. **Piloto Paiaguás (30 dias):** Instalar WeighBridge 360 em uma balança, validar com dados reais, medir redução de tempo
  2. **Rollout 5 fazendas (90 dias):** Com os dados do piloto, escalar para 5 fazendas com maior volume
  3. **Produto SAP (6 meses):** Empacotar como add-on da SAP Business Suite para o mercado global de balanças industriais

- **Impacto esperado em escala:**
  - 25 fazendas · R$ 2,9M/mês economizados · Zero entrada manual no ERP
  - Trilha de auditoria imutável em 100% dos tickets — compliance e anti-fraude
  - Potencial de mercado: 30.000 clientes SAP globais com o mesmo problema

**Visual sugerido:** Roadmap em 3 fases com timeline e métricas de impacto

---

## Preparação para o Q&A

### Perguntas antecipadas

**"Por que vocês são as pessoas certas para isso?"**
> Em 3 sessões mapeamos o domínio, especificamos 8 user stories com critérios de aceite, definimos 14 regras de negócio, construímos a API completa e o frontend funcional — e o fluxo roda end-to-end agora. Entendemos o problema do Ricardo, falamos a língua do SAP e entregamos código que funciona. Isso é o que importa.

**"Por que agora?"**
> A SLC já está no limite — 465 quedas por mês não é estabilidade, é crise operacional crônica. E o SAP tem 30.000 clientes globais com balanças industriais esperando uma solução nativa. A janela de oportunidade está aberta.

**"Qual é o principal risco técnico?"**
> A integração com a balança física — cada fabricante tem seu protocolo (RS-232, TCP/IP, Modbus). Para o protótipo usamos mock do sensor, mas em produção precisamos confirmar o protocolo com a SLC e desenvolver o driver de comunicação. É um risco conhecido e endereçável — não é um bloqueio arquitetural.

**"Quanto custaria implementar em produção?"**
> O core da solução está construído. O que falta para o piloto é: driver da balança (~2 semanas de desenvolvimento), certificado SEFAZ (processo burocrático, não técnico) e deploy no BTP da SLC (1 semana). Estimativa conservadora: 6 semanas de trabalho para o piloto estar rodando em produção.

**"Qual é o retorno esperado?"**
> Só com redução de atrasos operacionais: R$ 2,9M/mês para as 25 fazendas. O investimento no piloto se paga em menos de 30 dias. E isso sem contar o valor da rastreabilidade fiscal e prevenção de fraude — que é impossível de quantificar, mas é o que mantém o CFO dormindo.

**"O que vocês aprenderam que não esperavam?"**
> Que o problema mais crítico não era técnico — era humano. O Ricardo não tem medo de tecnologia. Ele tem medo de ser responsabilizado por algo que o sistema não consegue provar que não foi ele. A trilha de auditoria imutável não é só uma feature de compliance — é o que devolve a dignidade profissional do operador. Esse insight veio da simulação de entrevista, não do PDF do desafio.

---

## Notas do Apresentador

**Frase de abertura forte:**
> *"São 6 da manhã no Mato Grosso, e Ricardo está torcendo para o computador não cair."*

**Transições entre slides:**
- Hook → Problema: *"E isso não é um caso isolado. Isso é o dia a dia de 25 fazendas."*
- Problema → Solução: *"Então a gente se perguntou: como seria se o Ricardo não precisasse torcer?"*
- Solução → Demo: *"Deixa eu mostrar."*
- Demo → Arquitetura: *"Isso não é mágica. É SAP."*
- Arquitetura → Próximos passos: *"E o que você viu aqui foi construído em 3 sessões. Imagina em 3 meses."*

**Frase de encerramento memorável:**
> *"WeighBridge 360 não substitui o Ricardo. Ele devolve para o Ricardo o que sempre deveria ter sido dele: um turno sem retrabalho, dados que ele pode confiar, e nenhuma noite perdida com caderno."*

---

## Guia de Timing

| Parte | Início | Duração |
|-------|--------|---------|
| Hook — história do Ricardo | 0:00 | 1 min |
| Problema — quantificado | 1:00 | 1 min |
| Solução — value proposition | 2:00 | 1 min 30s |
| Demo ao vivo | 3:30 | 3 min |
| Arquitetura — como foi construído | 6:30 | 1 min 30s |
| Próximos passos | 8:00 | 1 min |
| Buffer / abertura Q&A | 9:00 | 1 min |
| **Total** | | **10 min** |

> **Versão 5 min (se necessário):** Hook (20s) · Problema (30s) · Solução (20s) · Demo (2min 30s) · Impacto (30s) · CTA (10s) · Buffer (20s)
