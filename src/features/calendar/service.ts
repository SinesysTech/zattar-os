import "server-only";

import { endOfDay, startOfDay } from "date-fns";

import type { Audiencia, ListarAudienciasParams } from "@/features/audiencias";
import { listarAudiencias, StatusAudiencia } from "@/features/audiencias";

import type { Expediente, ListarExpedientesParams } from "@/features/expedientes";
import { listarExpedientes } from "@/features/expedientes";

import type { AcordoComParcelas } from "@/features/obrigacoes";
import { actionListarObrigacoesPorPeriodo } from "@/features/obrigacoes/server-actions";

import {
  buildUnifiedEventId,
  type CalendarSource,
  type ListarEventosCalendarInput,
  type UnifiedCalendarEvent,
} from "./domain";

type SourceFetch = () => Promise<UnifiedCalendarEvent[]>;

function normalizeDateRange(input: ListarEventosCalendarInput): { start: Date; end: Date } {
  const start = new Date(input.startAt);
  const end = new Date(input.endAt);

  // Normalize to full-day bounds to make date-only sources behave intuitively
  return {
    start: startOfDay(start),
    end: endOfDay(end),
  };
}

function audienciaToUnifiedEvent(audiencia: Audiencia): UnifiedCalendarEvent {
  const color =
    audiencia.status === StatusAudiencia.Marcada
      ? "sky"
      : audiencia.status === StatusAudiencia.Finalizada
        ? "emerald"
        : "rose";

  return {
    id: buildUnifiedEventId("audiencias", audiencia.id),
    title: audiencia.tipoDescricao
      ? `Audiência (${audiencia.tipoDescricao}) - ${audiencia.numeroProcesso}`
      : `Audiência - ${audiencia.numeroProcesso}`,
    startAt: audiencia.dataInicio,
    endAt: audiencia.dataFim,
    allDay: false,
    source: "audiencias",
    sourceEntityId: audiencia.id,
    url: `/app/audiencias/semana?audienciaId=${audiencia.id}`,
    responsavelId: audiencia.responsavelId ?? null,
    color,
    metadata: {
      processoId: audiencia.processoId,
      numeroProcesso: audiencia.numeroProcesso,
      trt: audiencia.trt,
      grau: audiencia.grau,
      status: audiencia.status,
    },
  };
}

async function fetchAudiencias(start: Date, end: Date): Promise<UnifiedCalendarEvent[]> {
  const events: UnifiedCalendarEvent[] = [];

  // Service sanitiza limite para <= 100
  const limite = 100;
  let pagina = 1;
  let hasMore = true;

  while (hasMore && pagina <= 10) {
    const params: ListarAudienciasParams = {
      pagina,
      limite,
      dataInicioInicio: start.toISOString(),
      dataInicioFim: end.toISOString(),
      ordenarPor: "dataInicio",
      ordem: "asc",
    };

    const result = await listarAudiencias(params);
    if (!result.success) {
      // RLS/permissão/erro: não vazar, só ignorar a fonte
      return [];
    }

    const pageData = result.data.data;
    events.push(...pageData.map(audienciaToUnifiedEvent));

    hasMore = result.data.pagination.hasMore;
    pagina += 1;
  }

  return events;
}

function expedienteToUnifiedEvent(expediente: Expediente): UnifiedCalendarEvent | null {
  const dataPrincipal =
    expediente.dataPrazoLegalParte || expediente.dataCriacaoExpediente || expediente.createdAt;

  if (!dataPrincipal) return null;

  const dt = new Date(dataPrincipal);
  if (Number.isNaN(dt.getTime())) return null;

  // Para prazos, tratamos como all-day no MVP
  const title = expediente.classeJudicial
    ? `Expediente (${expediente.classeJudicial}) - ${expediente.numeroProcesso}`
    : `Expediente - ${expediente.numeroProcesso}`;

  const color = expediente.prazoVencido ? "rose" : "amber";

  return {
    id: buildUnifiedEventId("expedientes", expediente.id),
    title,
    startAt: dt.toISOString(),
    endAt: dt.toISOString(),
    allDay: true,
    source: "expedientes",
    sourceEntityId: expediente.id,
    url: `/app/expedientes?expedienteId=${expediente.id}`,
    responsavelId: expediente.responsavelId ?? null,
    color,
    metadata: {
      processoId: expediente.processoId,
      numeroProcesso: expediente.numeroProcesso,
      trt: expediente.trt,
      grau: expediente.grau,
      prazoVencido: expediente.prazoVencido,
      tipoExpedienteId: expediente.tipoExpedienteId,
      origem: expediente.origem,
    },
  };
}

async function fetchExpedientes(start: Date, end: Date): Promise<UnifiedCalendarEvent[]> {
  const events: UnifiedCalendarEvent[] = [];

  const limite = 100;
  let pagina = 1;
  let hasMore = true;

  while (hasMore && pagina <= 10) {
    const params: ListarExpedientesParams = {
      pagina,
      limite,
      dataPrazoLegalInicio: start.toISOString(),
      dataPrazoLegalFim: end.toISOString(),
      ordenarPor: "data_prazo_legal_parte",
      ordem: "asc",
    };

    const result = await listarExpedientes(params);
    if (!result.success) {
      return [];
    }

    for (const exp of result.data.data) {
      const mapped = expedienteToUnifiedEvent(exp);
      if (mapped) events.push(mapped);
    }

    hasMore = result.data.pagination.hasMore;
    pagina += 1;
  }

  return events;
}

function acordoParcelaToEvents(acordo: AcordoComParcelas): UnifiedCalendarEvent[] {
  const events: UnifiedCalendarEvent[] = [];

  for (const parcela of acordo.parcelas ?? []) {
    const dv = parcela.dataVencimento;
    if (!dv) continue;

    const dt = new Date(dv);
    if (Number.isNaN(dt.getTime())) continue;

    const status = String(parcela.status ?? "");
    const color =
      status === "atrasada" || status === "vencida"
        ? "rose"
        : status === "recebida" || status === "paga"
          ? "emerald"
          : "amber";

    const acordoWithProcesso = acordo as AcordoComParcelas & { processo?: { numero_processo?: string; numeroProcesso?: string }; processoId?: string | number };
    const numeroProcesso = acordoWithProcesso.processo?.numero_processo ?? acordoWithProcesso.processo?.numeroProcesso;

    events.push({
      id: buildUnifiedEventId("obrigacoes", parcela.id),
      title: `Obrigação - Parcela ${parcela.numeroParcela ?? ""}${numeroProcesso ? ` - ${numeroProcesso}` : ""}`,
      startAt: dt.toISOString(),
      endAt: dt.toISOString(),
      allDay: true,
      source: "obrigacoes",
      sourceEntityId: parcela.id,
      url: `/app/acordos-condenacoes?acordoId=${acordo.id}`,
      responsavelId: null,
      color,
      metadata: {
        acordoId: acordo.id,
        parcelaId: parcela.id,
        processoId: acordoWithProcesso.processoId,
        status: parcela.status,
        valor: parcela.valorBrutoCreditoPrincipal,
      },
    });
  }

  return events;
}

async function fetchObrigacoes(start: Date, end: Date): Promise<UnifiedCalendarEvent[]> {
  const dataInicio = start.toISOString().slice(0, 10);
  const dataFim = end.toISOString().slice(0, 10);

  const result = await actionListarObrigacoesPorPeriodo({
    dataInicio,
    dataFim,
    incluirSemData: false,
  });

  if (!result.success) {
    return [];
  }

  const acordos = (result.data ?? []) as AcordoComParcelas[];
  return acordos.flatMap(acordoParcelaToEvents);
}

export async function listarEventosPorPeriodo(
  input: ListarEventosCalendarInput
): Promise<UnifiedCalendarEvent[]> {
  try {
    const { start, end } = normalizeDateRange(input);
    const sources: CalendarSource[] = input.sources?.length ? input.sources : ["audiencias", "expedientes", "obrigacoes"];

    const fetchers: Record<CalendarSource, SourceFetch> = {
      audiencias: () => fetchAudiencias(start, end),
      expedientes: () => fetchExpedientes(start, end),
      obrigacoes: () => fetchObrigacoes(start, end),
    };

    const selectedFetches = sources.map((s) => fetchers[s]());
    const results = await Promise.all(selectedFetches);

    const all = results.flat();
    all.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    return all;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`Erro ao listar eventos do calendário: ${message}`);
  }
}
