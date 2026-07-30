# Domain Glossary — WeighBridge 360

> **Princípio:** Todos os termos abaixo têm um único significado acordado neste projeto.
> O código usará exatamente esses nomes.

---

## Ticket de Pesagem *(Aggregate Root / Entidade)*

**Definição:** Registro completo de uma operação de pesagem — desde a chegada do caminhão até a liberação com documentação fiscal emitida. É a unidade mínima de rastreabilidade do processo. Cada ticket cobre exatamente um ciclo: uma Pesagem 1 (tara), um carregamento e uma Pesagem 2 (bruto).

**Exemplo:** Um caminhão que entra, é pesado vazio, carregado de soja e pesado novamente gera exatamente um Ticket de Pesagem com número único, produto, pesos, documentos e trilha de auditoria completa.

**Não confundir com:** Nota fiscal (DANFe) — o ticket é o registro operacional interno; o DANFe é o documento fiscal externo gerado a partir do ticket.

---

## Tara *(Value Object)*

**Definição:** Peso do caminhão vazio, registrado na primeira pesagem (Pesagem 1). Representa a referência base para cálculo do peso líquido da carga. Capturada automaticamente pelo sensor da balança no WeighBridge 360.

**Exemplo:** Caminhão vazio marca 18.500 kg na balança — esse é o valor de tara do ticket.

**Não confundir com:** Peso Bruto — a tara é sempre registrada antes do carregamento; o bruto depois.

---

## Peso Bruto *(Value Object)*

**Definição:** Peso total do caminhão carregado, registrado na segunda pesagem (Pesagem 2). Junto com a tara, permite calcular o peso líquido da carga. Também capturado automaticamente pelo sensor.

**Exemplo:** Caminhão carregado de soja marca 43.200 kg — esse é o peso bruto.

**Não confundir com:** Peso Líquido — o bruto inclui o veículo; o líquido é bruto menos tara.

---

## Peso Líquido *(Value Object)*

**Definição:** Peso real da carga transportada, calculado automaticamente pela diferença entre Peso Bruto e Tara. É o valor que alimenta o SAP, a nota fiscal e os indicadores do coordenador. Nunca é digitado — sempre derivado.

**Exemplo:** Peso Bruto (43.200 kg) − Tara (18.500 kg) = Peso Líquido (24.700 kg de soja).

**Não confundir com:** Peso Bruto — o líquido é sempre calculado, nunca informado diretamente.

---

## Pesagem 1 *(Evento / Etapa)*

**Definição:** Primeiro momento de captura de peso no fluxo — realizado com o caminhão vazio, antes do carregamento. Registra a tara e inicia formalmente o Ticket de Pesagem. Dispara o evento `TaraRegistrada`.

**Exemplo:** Caminhão entra na balança às 07:32 vazio → sensor estabiliza em 18.500 kg → sistema registra tara automaticamente → ticket criado com status AGUARDANDO_CARGA.

**Não confundir com:** Check-in — o check-in é o registro de chegada na portaria; a Pesagem 1 é o ato de medir o peso na balança.

---

## Pesagem 2 *(Evento / Etapa)*

**Definição:** Segundo momento de captura de peso — realizado após o carregamento, com o caminhão cheio. Registra o peso bruto, calcula o peso líquido e dispara automaticamente a emissão de DANFe e CTe via evento `PesoBrutoRegistrado`.

**Exemplo:** Caminhão retorna à balança às 09:15 carregado → sensor registra 43.200 kg → sistema calcula 24.700 kg líquidos → DANFe emitido em <30 segundos.

**Não confundir com:** Pesagem 1 — a Pesagem 2 só ocorre depois do carregamento e fecha o ciclo operacional.

---

## DANFe *(Documento / Value Object)*

**Definição:** Documento Auxiliar da Nota Fiscal Eletrônica. Documento fiscal obrigatório emitido após a Pesagem 2, que permite a circulação legal da mercadoria nas estradas brasileiras. Contém chave de acesso SEFAZ de 44 dígitos. No fluxo atual é solicitado por e-mail; no WeighBridge 360 é emitido automaticamente via integração SAP.

**Exemplo:** Após Pesagem 2 com 43.200 kg de soja, sistema dispara emissão → SEFAZ retorna autorização → DANFe disponível em PDF em menos de 30 segundos.

**Não confundir com:** CTe — o DANFe acompanha a mercadoria (nota fiscal de produto); o CTe é o documento do transporte em si.

---

## CTe *(Documento / Value Object)*

**Definição:** Conhecimento de Transporte Eletrônico. Documento fiscal que autoriza e registra legalmente o serviço de transporte da carga. Emitido em paralelo ao DANFe após Pesagem 2. O caminhão só pode sair da fazenda com CTe válido autorizado pela SEFAZ.

**Exemplo:** Emitido automaticamente junto ao DANFe após Pesagem 2 — caminhão aguarda os dois documentos antes de ser liberado na portaria.

**Não confundir com:** DANFe — o CTe é do serviço de transporte; o DANFe é da mercadoria transportada.

---

## Fila de Espera *(Entidade Operacional)*

**Definição:** Conjunto ordenado de Tickets de Pesagem no status AGUARDANDO_TARA ou AGUARDANDO_BRUTO em uma fazenda em determinado momento. É a métrica primária de pressão operacional. Quando ultrapassa o ThresholdFila configurado, dispara alerta automático ao coordenador.

**Exemplo:** Às 08h, fazenda Paiaguás tem 12 tickets ativos aguardando balança — threshold configurado em 8 → alerta disparado ao coordenador no dashboard SAC.

**Não confundir com:** Capacidade da balança — a fila é o estado momentâneo; a capacidade é o throughput máximo do equipamento por turno.

---

## ThresholdFila *(Value Object / Configuração)*

**Definição:** Número máximo de caminhões na Fila de Espera configurado por fazenda, acima do qual o sistema dispara alerta automático ao coordenador. Cada fazenda pode ter seu próprio threshold conforme sua capacidade operacional.

**Exemplo:** Fazenda Paiaguás tem threshold de 8 caminhões; fazenda menor tem threshold de 4. Quando fila ultrapassa o valor, `AlertaFilaDisparado` é publicado.

**Não confundir com:** Capacidade diária — o threshold é o gatilho de alerta; a capacidade é o limite físico de atendimento.

---

## Modo Offline *(Conceito Operacional)*

**Definição:** Estado operacional do sistema quando a conectividade com a nuvem SAP BTP é interrompida. Nesse modo, o WeighBridge 360 continua operando localmente — criando e avançando Tickets de Pesagem no dispositivo — e sincroniza automaticamente todos os dados ao SAP HANA quando a conexão é restaurada.

**Exemplo:** Internet da fazenda cai às 10h → balanceiro continua registrando pesagens normalmente → às 11h conexão restaurada → sistema sincroniza 6 tickets pendentes automaticamente, sem ação manual.

**Não confundir com:** Queda do sistema legado (falha total) — o Modo Offline é uma operação controlada e resiliente, não uma falha.

---

## Contrato SAP *(Entidade de Referência)*

**Definição:** Registro no SAP que formaliza o acordo de compra ou venda de produto agrícola entre a SLC e uma transportadora ou cliente. Cada Ticket de Pesagem é vinculado a um Contrato SAP, que define produto, quantidade esperada, origem e destino. O WeighBridge 360 valida a placa do caminhão contra o contrato ativo ao fazer o check-in.

**Exemplo:** Transportadora XYZ tem contrato SAP #450012 para carregar 500 toneladas de soja na fazenda Paiaguás em julho — caminhão com placa ABC-1234 é validado contra esse contrato na entrada.

**Não confundir com:** Ticket de Pesagem — o contrato é o planejamento; o ticket é a execução real.

---

## CPI — SAP Integration Suite *(Componente de Integração)*

**Definição:** Plataforma de integração SAP (Cloud Platform Integration) responsável por transportar os dados dos Tickets de Pesagem do WeighBridge 360 para o SAP HANA em tempo real. Atua como canal seguro, com retry automático e log de transmissão. No contexto do WeighBridge 360, é acionado pelo evento `CaminhaoLiberado`.

**Exemplo:** Ticket #4521 concluído → evento `CaminhaoLiberado` publicado → CPI captura o evento → transforma e envia payload ao SAP HANA → confirma com evento `TicketSincronizadoSAP`.

**Não confundir com:** API direta — a CPI adiciona orquestração, transformação de dados e resiliência que uma chamada HTTP direta não oferece.

---

## SAP HANA *(Componente de Persistência)*

**Definição:** Banco de dados em memória SAP que recebe e armazena os dados transacionais dos Tickets de Pesagem enviados via CPI. É a fonte de verdade dos dados operacionais dentro do ecossistema SAP, alimentando tanto o ERP quanto o Datasphere.

**Exemplo:** Após sincronização via CPI, ticket #4521 fica disponível no HANA com todos os campos — produto, pesos, documentos fiscais, operador, timestamps — acessível por outros módulos SAP.

**Não confundir com:** Datasphere — o HANA é transacional (operação do dia a dia); o Datasphere é analítico (consolidação e governança multi-fazenda).

---

## SAP Datasphere *(Componente de Governança Analítica)*

**Definição:** Camada de governança e consolidação de dados SAP que recebe dados do HANA de múltiplas fazendas, aplica regras de qualidade e disponibiliza visões consolidadas para análise. No WeighBridge 360, é a fonte dos dados exibidos na SAC Story do coordenador.

**Exemplo:** Datasphere consolida tickets de pesagem das 25 fazendas, calcula médias de tempo por fazenda e produto, identifica anomalias de peso, e disponibiliza esses dados para o SAC.

**Não confundir com:** SAP HANA — o Datasphere é a camada analítica e de governança; o HANA é a camada transacional.

---

## SAC Story *(Interface do Coordenador)*

**Definição:** Dashboard interativo no SAP Analytics Cloud que exibe indicadores operacionais em tempo real para o coordenador — fila por fazenda, volume por produto, tempo médio de pesagem, alertas e histórico. Alimentado pelo Datasphere. Substitui o Outlook e as planilhas manuais do coordenador.

**Exemplo:** Coordenador abre a SAC Story às 08h → vê que fazenda Paiaguás tem 15 caminhões na fila, tempo médio 47 min (acima do SLA de 20 min) e 3 tickets com divergência de peso aguardando revisão.

**Não confundir com:** Dashboard operacional do balanceiro — a SAC Story é para o coordenador (visão gerencial); o app do balanceiro é operacional (execução turno a turno).

---

## OCR de Placa *(Componente de Automação)*

**Definição:** Tecnologia de reconhecimento óptico de caracteres aplicada à leitura automática da placa do caminhão na entrada da fazenda. Elimina a digitação manual pelo porteiro e dispara automaticamente a validação do veículo contra os contratos SAP ativos.

**Exemplo:** Câmera posicionada na portaria lê placa ABC-1234 às 06:58 → sistema valida contra contratos ativos → caminhão autorizado → check-in registrado automaticamente sem intervenção do porteiro.

**Não confundir com:** Controle de acesso físico — o OCR registra dados; a cancana ou barreira física ainda pode existir como controle separado.

---

## Divergência de Peso *(Conceito de Governança)*

**Definição:** Situação em que o Peso Bruto registrado é menor ou igual à Tara, ou quando o Peso Líquido excede o limite contratual definido no Contrato SAP. Quando detectada, o ticket entra em status DIVERGENCIA e requer revisão e aprovação explícita do coordenador antes de prosseguir.

**Exemplo:** Tara registrada: 18.500 kg. Peso Bruto registrado: 18.200 kg (menor que tara) → sistema detecta impossibilidade física → ticket bloqueado em DIVERGENCIA → alerta enviado ao coordenador para investigação.

**Não confundir com:** Erro de sistema — uma divergência pode ser erro de operação, falha do sensor ou tentativa de fraude; o sistema registra e bloqueia, mas a decisão é humana.

---

## Trilha de Auditoria *(Conceito de Governança)*

**Definição:** Registro imutável e cronológico de todas as ações realizadas em um Ticket de Pesagem — quem registrou, quando, qual valor, qual foi o estado anterior e o posterior. É append-only: nenhum evento pode ser alterado ou removido após inserido. Tem validade regulatória e de compliance.

**Exemplo:** Ticket #4521 — Check-in registrado por OCR às 06:58:12 | Tara registrada por sensor às 07:32:14 (18.500 kg) | Peso Bruto registrado por sensor às 09:15:47 (43.200 kg) | DANFe emitido automaticamente às 09:15:52 | Caminhão liberado por Ricardo Souza às 09:18:03.

**Não confundir com:** Log técnico de sistema — a trilha de auditoria é um artefato de negócio com significado regulatório, não apenas um log de depuração.

---

## Balanceiro *(Perfil de Usuário)*

**Definição:** Operador responsável por conduzir o processo de pesagem na cabine da balança. Perfil primário do sistema (70% do foco do WeighBridge 360) — suas ações confirmam capturas automáticas, tratam divergências e fecham o turno. No WeighBridge 360, o balanceiro confirma o que o sistema capturou automaticamente, em vez de digitar dados.

**Exemplo:** Ricardo recebe notificação de caminhão na balança → confirma início da Pesagem 1 → sensor captura 18.500 kg → Ricardo confirma valor → sistema avança o ticket automaticamente.

**Não confundir com:** Porteiro — o balanceiro opera a balança; o porteiro opera a portaria de entrada.

---

## Coordenador *(Perfil de Usuário)*

**Definição:** Responsável pelo monitoramento da operação da fazenda — filas, volumes, indicadores e conformidade do processo. Não opera a balança diretamente. Consome dados via SAC Story e atua em exceções: aprovar divergências, acionar equipe quando fila ultrapassa threshold, revisar relatórios de turno.

**Exemplo:** Coordenador recebe alerta no SAC às 08h → fila de 15 caminhões em Paiaguás → aciona segundo balanceiro para turno extra → anomalia resolvida sem necessidade de WhatsApp ou planilha.

**Não confundir com:** Balanceiro — o coordenador monitora e decide; o balanceiro executa.

---

## Porteiro *(Perfil de Usuário)*

**Definição:** Responsável pelo check-in do caminhão na portaria da fazenda. No WeighBridge 360, esse papel é majoritariamente automatizado pelo OCR de placa — o porteiro intervém apenas em casos de falha de leitura, veículo não reconhecido ou divergência de contrato.

**Exemplo:** OCR lê 95% das placas automaticamente → porteiro só é acionado quando câmera não consegue ler ou quando placa não consta em nenhum contrato ativo.

**Não confundir com:** Balanceiro — o porteiro opera a entrada; o balanceiro opera a pesagem.

---

## Discarded Terms

| Termo evitado | Usar em vez disso | Motivo |
|--------------|-------------------|--------|
| "Pesagem" (genérico) | Pesagem 1 ou Pesagem 2 | Ambíguo — não deixa claro qual etapa do ciclo |
| "Nota fiscal" | DANFe ou CTe | Existem dois documentos distintos no fluxo — generalizar causa confusão |
| "Sistema" (sem qualificador) | Sistema legado ou WeighBridge 360 | Distingue o sistema atual do novo |
| "Peso" (sem qualificador) | Tara, Peso Bruto ou Peso Líquido | Cada peso tem significado diferente no domínio |
| "Integração" (genérico) | CPI, HANA, Datasphere ou SAC (conforme o caso) | Cada camada da arquitetura SAP tem responsabilidade distinta |
| "Dashboard" (genérico) | SAC Story (coordenador) ou App WeighBridge (balanceiro) | Dois perfis, duas interfaces distintas |
| "Falha do sistema" | Modo Offline (controlado) ou Queda do sistema legado | A falha do legado é catastrófica; o Modo Offline é resiliente |
