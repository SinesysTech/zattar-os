/**
 * AgendaApp — Orquestrador principal do módulo Agenda (Redesign)
 * ============================================================================
 * Layout: Header + KPI Strip + View Controls (FilterBar + Search + Toggle) + View
 * Views: semana (default) | mes | ano | lista | briefing
 *
 * View Controls seguem o padrão de Audiências / Expedientes / Partes:
 * FilterBar à esquerda, SearchInput e ViewToggle agrupados à direita
 * com flex-1 justify-end.
 * ============================================================================
 */

"use client";

import { cn } from '@/lib/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
  subWeeks,
} from "date-fns";
import {
  Columns3,
  Grid3x3,
  CalendarRange,
  List,
  Sparkles,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import type { CalendarSource, UnifiedCalendarEvent, CalendarEvent } from "@/app/(authenticated)/calendar";
import { actionListarEventosCalendar, EventDialog, AgendaDaysToShow } from "@/app/(authenticated)/calendar";
import type { CalendarView } from "@/app/(authenticated)/calendar/briefing-domain";
import { getDaySummary } from "@/app/(authenticated)/calendar/briefing-helpers";
import {
  actionCriarAgendaEvento,
  actionAtualizarAgendaEvento,
  actionDeletarAgendaEvento,
} from "@/app/(authenticated)/agenda";

import { Heading } from "@/components/ui/typography";
import { ViewToggle, type ViewToggleOption } from "@/components/dashboard/view-toggle";
import { SearchInput } from "@/components/dashboard/search-input";
import { Button } from "@/components/ui/button";

import { adaptEvents, filterBySearch, filterBySource, type AgendaEvent } from "../lib/adapters";
import { AgendaKpiStrip, type AgendaKpiData } from "./agenda-kpi-strip";
import { AgendaFilterBar } from "./agenda-filter-bar";
import { SemanaView, MesView, AnoView, ListaView, BriefingViewV2 } from "./views";
import type { AgendaSource } from "./mock-data";

// ─── Types ────────────────────────────────────────────────────────────

type AgendaViewMode = "semana" | "mes" | "ano" | "lista" | "briefing";

interface AgendaAppProps {
  initialEvents: UnifiedCalendarEvent[];
}

// ─── View Options ─────────────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: "semana",   icon: Columns3,      label: "Semana" },
  { id: "mes",      icon: Grid3x3,       label: "Mês" },
  { id: "ano",      icon: CalendarRange,  label: "Ano" },
  { id: "lista",    icon: List,           label: "Lista" },
  { id: "briefing", icon: Sparkles,       label: "Briefing" },
];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// ─── View-to-CalendarView mapping (for nav compatibility) ─────────────

function toCalendarView(mode: AgendaViewMode): CalendarView {
  const map: Record<AgendaViewMode, CalendarView> = {
    semana: "week",
    mes: "month",
    ano: "month",
    lista: "agenda",
    briefing: "briefing",
  };
  return map[mode];
}

// ─── Helpers ──────────────────────────────────────────────────────────

function adaptAgendaToCalendarEvent(event: AgendaEvent): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    color: event.color as CalendarEvent["color"],
    description: event.meta?.descricao,
    location: event.meta?.local,
    source: event.source,
    sourceEntityId: event.raw.sourceEntityId as number | undefined,
    responsavelId: event.responsavelId ?? undefined,
  };
}

function dateLabel(mode: AgendaViewMode, date: Date): string {
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  if (mode === "ano") return String(year);
  return `${month} ${year}`;
}

// ─── Component ────────────────────────────────────────────────────────

export default function AgendaApp({ initialEvents }: AgendaAppProps) {
  // ── Server state ──────────────────────────────────────────────────
  const [serverEvents, setServerEvents] = useState<UnifiedCalendarEvent[]>(initialEvents);

  // ── UI state ──────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<AgendaViewMode>("semana");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<Set<CalendarSource>>(new Set());

  // ── Dialog state ──────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCalEvent, setSelectedCalEvent] = useState<CalendarEvent | null>(null);
  const [dialogReadOnly, setDialogReadOnly] = useState(false);

  // ── Event URL map ─────────────────────────────────────────────────
  const eventUrlMap = useMemo(
    () => new Map(serverEvents.map((e) => [e.id, e.url])),
    [serverEvents],
  );

  // ── Adapted & filtered events ─────────────────────────────────────
  const allEvents = useMemo(() => adaptEvents(serverEvents), [serverEvents]);

  const filteredEvents = useMemo(() => {
    let evts = filterBySource(allEvents, sourceFilter);
    evts = filterBySearch(evts, search);
    return evts;
  }, [allEvents, sourceFilter, search]);

  // ── KPI data ──────────────────────────────────────────────────────
  const kpiData: AgendaKpiData = useMemo(() => {
    const summary = getDaySummary(serverEvents, currentDate);
    const totalMonthEvents = allEvents.filter(
      (e) =>
        e.start.getMonth() === currentDate.getMonth() &&
        e.start.getFullYear() === currentDate.getFullYear(),
    ).length;

    // Detect conflicts
    const dayEvents = allEvents.filter(
      (e) =>
        e.start.getDate() === currentDate.getDate() &&
        e.start.getMonth() === currentDate.getMonth(),
    );
    let conflicts = 0;
    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        if (dayEvents[i].start < dayEvents[j].end && dayEvents[j].start < dayEvents[i].end) {
          conflicts++;
        }
      }
    }

    // Avg prep
    const withPrep = allEvents.filter((e) => e.meta?.prepStatus);
    const avgPrep =
      withPrep.length > 0
        ? Math.round(
            withPrep.reduce((acc, e) => {
              if (e.meta?.prepStatus === "preparado") return acc + 100;
              if (e.meta?.prepStatus === "parcial") return acc + 60;
              return acc + 20;
            }, 0) / withPrep.length,
          )
        : 0;

    // Count deadlines in next 7 days
    const now = new Date();
    const in7d = addDays(now, 7);
    const prazos7d = allEvents.filter(
      (e) => e.meta?.prazoVencido !== undefined && e.start >= now && e.start <= in7d,
    ).length;

    return {
      totalEventos: totalMonthEvents,
      audienciasHoje: summary.audiencias,
      prazos7d,
      horasOcupadas: Number.parseInt(summary.horasOcupado) || 0,
      prepPercent: avgPrep,
      conflitos: conflicts,
    };
  }, [serverEvents, allEvents, currentDate]);

  // ── Dynamic fetch on month change ─────────────────────────────────
  const fetchRangeKey = useMemo(() => format(startOfMonth(currentDate), "yyyy-MM"), [currentDate]);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const [year, month] = fetchRangeKey.split("-").map(Number);
    const center = new Date(year, month - 1, 1);
    const rangeStart = subMonths(center, 1);
    const rangeEnd = endOfMonth(addMonths(center, 1));

    let cancelled = false;

    const fetchData = async () => {
      try {
        const result = await actionListarEventosCalendar({
          startAt: rangeStart.toISOString(),
          endAt: rangeEnd.toISOString(),
        });
        if (cancelled) return;
        if (result.success) setServerEvents(result.data);
      } catch {
        // silently fail
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [fetchRangeKey]);

  // ── Refetch helper ────────────────────────────────────────────────
  const refetchEvents = useCallback(async () => {
    const center = startOfMonth(currentDate);
    const rangeStart = subMonths(center, 1);
    const rangeEnd = endOfMonth(addMonths(center, 1));
    const result = await actionListarEventosCalendar({
      startAt: rangeStart.toISOString(),
      endAt: rangeEnd.toISOString(),
    });
    if (result.success) setServerEvents(result.data);
  }, [currentDate]);

  // ── Navigation ────────────────────────────────────────────────────
  const calView = toCalendarView(view);

  const handlePrev = useCallback(() => {
    setCurrentDate((d) => {
      if (calView === "month") return subMonths(d, 1);
      if (calView === "week") return subWeeks(d, 1);
      if (calView === "briefing") return addDays(d, -1);
      if (calView === "agenda") return addDays(d, -AgendaDaysToShow);
      return d;
    });
  }, [calView]);

  const handleNext = useCallback(() => {
    setCurrentDate((d) => {
      if (calView === "month") return addMonths(d, 1);
      if (calView === "week") return addWeeks(d, 1);
      if (calView === "briefing") return addDays(d, 1);
      if (calView === "agenda") return addDays(d, AgendaDaysToShow);
      return d;
    });
  }, [calView]);

  const handleToday = useCallback(() => setCurrentDate(new Date()), []);

  // ── Source filter toggle ──────────────────────────────────────────
  const toggleSource = useCallback((src: AgendaSource | CalendarSource) => {
    setSourceFilter((prev) => {
      const next = new Set(prev);
      const key = src as CalendarSource;
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // ── Event click → open dialog ─────────────────────────────────────
  const handleEventClick = useCallback((event: AgendaEvent) => {
    const calEvent = adaptAgendaToCalendarEvent(event);
    setSelectedCalEvent(calEvent);
    setDialogReadOnly(event.source !== "agenda");
    setDialogOpen(true);
  }, []);

  // ── New event ─────────────────────────────────────────────────────
  const handleNewEvent = useCallback(() => {
    setSelectedCalEvent(null);
    setDialogReadOnly(false);
    setDialogOpen(true);
  }, []);

  // ── CRUD handlers ─────────────────────────────────────────────────
  const handleSaveEvent = useCallback(
    async (event: CalendarEvent) => {
      const isNew = !event.id || !event.id.startsWith("agenda:");
      const payload = {
        titulo: event.title || "(sem título)",
        descricao: event.description || null,
        dataInicio: event.start.toISOString(),
        dataFim: event.end.toISOString(),
        diaInteiro: event.allDay ?? false,
        local: event.location || null,
        cor: event.color || "sky",
        responsavelId: event.responsavelId || null,
      };

      if (isNew) {
        const result = await actionCriarAgendaEvento(payload);
        if (result.success) {
          toast.success(`Evento "${payload.titulo}" adicionado`);
          await refetchEvents();
        }
      } else {
        const entityId = Number(event.id.split(":")[1]);
        const result = await actionAtualizarAgendaEvento({ id: entityId, ...payload });
        if (result.success) {
          toast.success(`Evento "${payload.titulo}" atualizado`);
          await refetchEvents();
        }
      }
      setDialogOpen(false);
    },
    [refetchEvents],
  );

  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      if (!eventId.startsWith("agenda:")) return;
      const entityId = Number(eventId.split(":")[1]);
      const result = await actionDeletarAgendaEvento({ id: entityId });
      if (result.success) {
        toast.success("Evento excluído");
        await refetchEvents();
      }
      setDialogOpen(false);
    },
    [refetchEvents],
  );

  const handleNavigateToSource = useCallback(() => {
    if (!selectedCalEvent) return;
    const url = eventUrlMap.get(selectedCalEvent.id);
    if (url) window.location.href = url;
  }, [eventUrlMap, selectedCalEvent]);

  // ── Derived ───────────────────────────────────────────────────────
  const label = dateLabel(view, currentDate);
  const eventCount = filteredEvents.length;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className={cn(/* design-system-escape: space-y-5 sem token DS; pb-12 padding direcional sem Inset equiv. */ "space-y-5 pb-12")}>
      {/* ── 1. Header ── */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-end justify-between gap-4")}>
        <div>
          <Heading level="page">Agenda</Heading>
          <p className={cn("text-body-sm text-muted-foreground/50 mt-0.5")}>
            {label} · {eventCount} evento{eventCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" className="rounded-xl" onClick={handleNewEvent}>
          <Plus className="size-3.5" />
          Novo Evento
        </Button>
      </div>

      {/* ── 2. KPI Strip ── */}
      <AgendaKpiStrip data={kpiData} />

      {/* ── 3. View Controls — padrão Audiências / Expedientes / Partes ── */}
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex flex-col sm:flex-row items-start sm:items-center gap-3")}>
        <AgendaFilterBar
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          activeSources={sourceFilter as unknown as Set<AgendaSource>}
          onToggleSource={toggleSource}
        />
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-1 justify-end")}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar eventos..."
          />
          <ViewToggle
            mode={view}
            onChange={(m) => setView(m as AgendaViewMode)}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* ── 4. Active View ── */}
      {view === "semana" && (
        <SemanaView
          currentDate={currentDate}
          events={filteredEvents}
          onSelectDate={setCurrentDate}
          onEventClick={handleEventClick}
        />
      )}

      {view === "mes" && (
        <MesView
          currentDate={currentDate}
          events={filteredEvents}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onEventClick={handleEventClick}
        />
      )}

      {view === "ano" && (
        <AnoView
          currentDate={currentDate}
          events={filteredEvents}
          onDateChange={setCurrentDate}
          onEventClick={handleEventClick}
        />
      )}

      {view === "lista" && (
        <ListaView
          events={filteredEvents}
          onEventClick={handleEventClick}
        />
      )}

      {view === "briefing" && (
        <BriefingViewV2
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={handleEventClick}
        />
      )}

      {/* ── Event Dialog (reutiliza o existente) ── */}
      <EventDialog
        event={selectedCalEvent}
        isOpen={dialogOpen}
        readOnly={dialogReadOnly}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onNavigateToSource={handleNavigateToSource}
      />
    </div>
  );
}
