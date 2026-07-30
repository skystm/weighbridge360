using weighbridge as db from '../db/schema';

service WeighBridgeService @(path: '/api/v1') {

  // ─── Leitura de referências ────────────────────────────────────────────────
  @readonly entity Fazendas        as projection on db.Fazendas
    excluding { balanças, tickets };

  @readonly entity Balancas        as projection on db.Balancas;
  @readonly entity Usuarios        as projection on db.Usuarios;
  @readonly entity ContratosSAP    as projection on db.ContratosSAP;
  @readonly entity StatusTicket    as projection on db.StatusTicket;
  @readonly entity Produto         as projection on db.Produto;

  // ─── TicketsPesagem ────────────────────────────────────────────────────────
  entity TicketsPesagem as projection on db.TicketsPesagem
    actions {
      // US-02: Registrar Tara
      action registrarTara(
        valor       : Decimal(10,2),
        fonte       : String(30),
        motivoManual: String(500),
        operadorId  : UUID
      ) returns TicketsPesagem;

      // US-03: Iniciar carregamento
      action iniciarCarregamento(
        operadorId: UUID
      ) returns TicketsPesagem;

      // US-03: Registrar Peso Bruto
      action registrarPesoBruto(
        valor       : Decimal(10,2),
        fonte       : String(30),
        motivoManual: String(500),
        operadorId  : UUID
      ) returns TicketsPesagem;

      // US-05: Aprovar divergência (somente COORDENADOR)
      action aprovarDivergencia(
        coordenadorId: UUID,
        justificativa: String(1000)
      ) returns TicketsPesagem;

      // US-04: Liberar caminhão
      action liberarCaminhao(
        operadorId: UUID
      ) returns TicketsPesagem;
    };

  // US-01: Check-in (criação de ticket)
  action checkIn(
    fazendaId          : UUID,
    placa              : String(10),
    fonteIdentificacao : String(30),
    confiancaOCR       : Decimal(4,2),
    operadorId         : UUID
  ) returns TicketsPesagem;

  // US-06: Fila de espera em tempo real
  function filaEspera(fazendaId: UUID) returns {
    fazendaId      : UUID;
    thresholdFila  : Integer;
    quantidadeAtual: Integer;
    alertaAtivo    : Boolean;
    tempoMedioEspera: Integer;
    atualizadoEm   : DateTime;
  };

  // US-08: Relatório de turno
  function relatorioDeTurno(
    fazendaId: UUID,
    data     : Date,
    turno    : String(10)
  ) returns {
    totalTickets       : Integer;
    ticketsConcluidos  : Integer;
    ticketsDivergencia : Integer;
    ticketsPendenteSAP : Integer;
    volumeTotalKg      : Decimal(12,3);
    tempoMedioPesagemMin: Decimal(6,2);
  };

  // Trilha de auditoria — append-only, sem update/delete
  @insertonly entity TrilhaAuditoria as projection on db.TrilhaAuditoria;
}
