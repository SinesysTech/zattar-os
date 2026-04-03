"use server";

import { cookies } from "next/headers";
import { listarAudienciasPorBuscaCpf } from "@/app/(authenticated)/audiencias/service";
import { StatusAudiencia } from "@/app/(authenticated)/audiencias";
import type { Audiencia } from "@/app/(authenticated)/audiencias";
import type {
  AgendamentoPortal,
  TipoAgendamento,
  StatusAgendamento,
} from "./domain";

const MESES_CURTO = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

function mapModalidade(
  modalidade: Audiencia["modalidade"]
): TipoAgendamento {
  switch (modalidade) {
    case "virtual":
      return "Videoconferência";
    case "presencial":
      return "Presencial";
    case "hibrida":
      return "Híbrida";
    default:
      return "Presencial";
  }
}

function mapStatus(status: string): StatusAgendamento {
  switch (status) {
    case StatusAudiencia.Marcada:
      return "Agendada";
    case StatusAudiencia.Finalizada:
      return "Realizada";
    case StatusAudiencia.Cancelada:
      return "Cancelada";
    default:
      return "Agendada";
  }
}

function formatLocal(audiencia: Audiencia): string {
  if (audiencia.salaAudienciaNome) return audiencia.salaAudienciaNome;
  if (audiencia.enderecoPresencial) {
    const e = audiencia.enderecoPresencial;
    return `${e.logradouro}, ${e.numero} — ${e.cidade}/${e.uf}`;
  }
  if (audiencia.modalidade === "virtual" && audiencia.urlAudienciaVirtual) {
    return "Videoconferência";
  }
  return "A definir";
}

function mapAudienciaToAgendamento(a: Audiencia): AgendamentoPortal {
  const date = new Date(a.dataInicio);
  const dia = date.getUTCDate();
  const mesIndex = date.getUTCMonth();
  const ano = date.getUTCFullYear();
  const horario = a.horaInicio ? a.horaInicio.substring(0, 5) : "--:--";

  return {
    id: a.id,
    titulo: a.tipoDescricao || "Audiência",
    processo: a.numeroProcesso,
    dia,
    mes: MESES_CURTO[mesIndex],
    mesIndex,
    ano,
    horario,
    tipo: mapModalidade(a.modalidade),
    local: formatLocal(a),
    urlVirtual: a.urlAudienciaVirtual,
    status: mapStatus(a.status),
    tribunal: a.trt || "Tribunal não informado",
  };
}

export async function actionListarAgendamentosPortal(): Promise<{
  success: boolean;
  data?: { proximos: AgendamentoPortal[]; passados: AgendamentoPortal[] };
  error?: string;
}> {
  const cookieStore = await cookies();
  const session = cookieStore.get("portal-cpf-session")?.value;
  if (!session)
    return { success: false, error: "Sessão inválida" };

  try {
    const { cpf } = JSON.parse(session);
    const audiencias = await listarAudienciasPorBuscaCpf(cpf);
    const agendamentos = audiencias.map(mapAudienciaToAgendamento);

    const now = new Date();

    const proximos = agendamentos
      .filter((a) => {
        if (a.status !== "Agendada") return false;
        const apptDate = new Date(a.ano, a.mesIndex, a.dia);
        return apptDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
      })
      .sort((a, b) => {
        const dateA = new Date(a.ano, a.mesIndex, a.dia);
        const dateB = new Date(b.ano, b.mesIndex, b.dia);
        return dateA.getTime() - dateB.getTime();
      });

    const passados = agendamentos
      .filter((a) => {
        if (a.status === "Realizada" || a.status === "Cancelada") return true;
        const apptDate = new Date(a.ano, a.mesIndex, a.dia);
        return apptDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
      })
      .sort((a, b) => {
        const dateA = new Date(a.ano, a.mesIndex, a.dia);
        const dateB = new Date(b.ano, b.mesIndex, b.dia);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });

    return { success: true, data: { proximos, passados } };
  } catch (error) {
    console.error("[Portal] Erro ao listar agendamentos:", error);
    return { success: false, error: "Erro ao carregar agendamentos" };
  }
}
