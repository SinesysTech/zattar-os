export type TipoAgendamento = "Presencial" | "Videoconferência" | "Híbrida";

export type StatusAgendamento = "Agendada" | "Realizada" | "Cancelada";

export interface AgendamentoPortal {
  id: number;
  titulo: string; // tipoDescricao or "Audiência"
  processo: string; // numeroProcesso
  dia: number;
  mes: string; // "MAR", "ABR"
  mesIndex: number; // 0-based
  ano: number;
  horario: string; // "14:00"
  tipo: TipoAgendamento;
  local: string; // sala, endereço, or "Videoconferência"
  urlVirtual: string | null;
  status: StatusAgendamento;
  tribunal: string;
}
