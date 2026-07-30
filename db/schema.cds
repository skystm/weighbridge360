namespace weighbridge;

using { cuid, managed, sap.common.CodeList } from '@sap/cds/common';

// ─── Code Lists ───────────────────────────────────────────────────────────────

entity StatusTicket : CodeList { key code: String(30); }
entity Produto       : CodeList { key code: String(20); }
entity Perfil        : CodeList { key code: String(20); }
entity FontePeso     : CodeList { key code: String(30); }

// ─── Core Entities ────────────────────────────────────────────────────────────

entity Fazendas : cuid, managed {
  nome             : String(100) not null;
  codigo           : String(20);
  estado           : String(2);
  municipio        : String(100);
  capacidadeDiaria : Integer default 50;
  thresholdFila    : Integer default 8;
  ativa            : Boolean default true;
  balanças         : Composition of many Balancas on balanças.fazenda = $self;
  tickets          : Composition of many TicketsPesagem on tickets.fazenda = $self;
}

entity Balancas : cuid, managed {
  fazenda          : Association to Fazendas not null;
  modelo           : String(100);
  capacidadeMaxima : Decimal(10,2) default 150000;
  precisao         : Decimal(6,2)  default 50;
  status           : Association to StatusBalanca;
  ultimaCalibracaoEm : DateTime;
  temOCR           : Boolean default false;
}

entity StatusBalanca : CodeList { key code: String(20); }

entity Usuarios : cuid, managed {
  nome     : String(100) not null;
  cpf      : String(14);
  email    : String(255);
  perfil   : Association to Perfil not null;
  fazenda  : Association to Fazendas;
  ativo    : Boolean default true;
}

entity ContratosSAP : cuid, managed {
  contratoSapId        : String(20) not null;
  fazenda              : Association to Fazendas not null;
  transportadora       : String(100);
  produto              : Association to Produto not null;
  quantidadeTotal      : Decimal(12,3) not null;
  quantidadeExecutada  : Decimal(12,3) default 0;
  saldoRestante        : Decimal(12,3);
  placasAutorizadas    : Composition of many PlacasContrato on placasAutorizadas.contrato = $self;
  validoDe             : Date not null;
  validoAte            : Date not null;
  ativo                : Boolean default true;
}

entity PlacasContrato : cuid {
  contrato : Association to ContratosSAP not null;
  placa    : String(10) not null;
}

entity TicketsPesagem : cuid, managed {
  fazenda          : Association to Fazendas not null;
  balanca          : Association to Balancas;
  contrato         : Association to ContratosSAP;
  placa            : String(10)  not null;
  fonteIdentificacao: Association to FontePeso;
  confiancaOCR     : Decimal(4,2);
  motoristaNome    : String(100);
  motoristaCPF     : String(14);
  transportadora   : String(100);
  produto          : Association to Produto;
  // Pesos
  taraValor        : Decimal(10,2);
  taraFonte        : Association to FontePeso;
  taraTimestamp    : DateTime;
  taraMotivo       : String(500);
  pesoBrutoValor   : Decimal(10,2);
  pesoBrutoFonte   : Association to FontePeso;
  pesoBrutoTimestamp : DateTime;
  pesoLiquidoValor : Decimal(10,2);
  // Status e controle
  status           : Association to StatusTicket not null;
  divergenciaTipo  : String(30);
  divergenciaDesc  : String(500);
  // Documentos fiscais
  danfeNumero      : String(50);
  danfeChave       : String(44);
  danfeStatus      : String(20);
  danfeUrl         : String(500);
  danfeEmitidoEm   : DateTime;
  cteNumero        : String(50);
  cteChave         : String(44);
  cteStatus        : String(20);
  cteUrl           : String(500);
  cteEmitidoEm     : DateTime;
  // SAP sync
  sincronizadoSAP  : Boolean default false;
  sapDocumentId    : String(50);
  modoOffline      : Boolean default false;
  // Timestamps operacionais
  cargaIniciadaEm  : DateTime;
  concluidoEm      : DateTime;
  operador         : Association to Usuarios;
  // Trilha de auditoria
  trilha           : Composition of many TrilhaAuditoria on trilha.ticket = $self;
}

entity TrilhaAuditoria : cuid {
  ticket      : Association to TicketsPesagem not null;
  acao        : String(50)  not null;
  operadorId  : UUID;
  fonte       : String(30)  default 'SISTEMA_AUTOMATICO';
  valorAntes  : String(500);
  valorDepois : String(500);
  metadados   : String(1000);
  ocorridoEm  : DateTime    not null;
}
