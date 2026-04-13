/**
 * AgendaRedesignMock — View mockada completa do redesign da Agenda
 * ============================================================================
 * Orquestra todas as views e componentes do redesign para validacao visual.
 * Acessivel em /agenda/mock (via page.tsx existente) ou importando diretamente.
 *
 * Layout: Header + KPI Strip + Filter Bar + [View condicional] + Dialog
 * Views: semana (default) | mes | ano | lista | briefing
 * ============================================================================
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Columns3,
  Grid3x3,
  CalendarRange,
  List,
  Sparkles,
  Plus,
} from "lucide-react";
import { Heading } from "@/components/ui/typography";
import { ViewToggle, type ViewToggleOption } from "@/components/dashboard/view-toggle";
import { AgendaKpiStrip, type AgendaKpiData } from "./agenda-kpi-strip";
import { AgendaFilterBar } from "./agenda-filter-bar";
import { AgendaEventDetail } from "./agenda-event-detail";
import { SemanaView, MesView, AnoView, ListaView, BriefingViewV2 } from "./views";
import type { AgendaEvent } from "../lib/adapters";
import {
  type MockEvent,
  type AgendaSource,
  MOCK_EVENTS,
} from "./mock-data";

/** Adapter: MockEvent → AgendaEvent-compatible shape for preview pages */
function mockToAgendaEvent(m: MockEvent): AgendaEvent {
  return {
    id: m.id,
    title: m.title,
    start: m.start,
    end: m.end,
    allDay: m.allDay,
    source: m.source === "prazos" ? "agenda" : m.source as AgendaEvent["source"],
    color: "sky",
    url: "",
    responsavelId: null,
    meta: {
      processo: m.processo,
      trt: m.trt,
      grau: m.grau,
      modalidade: m.modalidade,
      status: m.status,
      prepStatus: m.prepStatus,
      prazoVencido: m.fatal,
      descricao: m.descricao,
      local: m.local,
      responsavelNome: m.responsavel?.nome,
    },
    raw: {} as never,
  };
}

// ─── Types ────────────────────────────────────────────────────────────

type AgendaView = "semana" | "mes" | "ano" | "lista" | "briefing";

// ─── View Toggle Options ──────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: "semana",   icon: Columns3,      label: "Semana" },
  { id: "mes",      icon: Grid3x3,       label: "Mes" },
  { id: "ano",      icon: CalendarRange,  label: "Ano" },
  { id: "lista",    icon: List,           label: "Lista" },
  { id: "briefing", icon: Sparkles,       label: "Briefing" },
];

// ─── Helpers ──────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function dateLabel(view: AgendaView, date: Date): string {
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  if (view === "ano") return String(year);
  return `${month} ${year}`;
}

// ─── Component ────────────────────────────────────────────────────────

export function AgendaRedesignMock() {
  const [view, setView] = useState<AgendaView>("semana");
  const [currentDate] = useState(() => new Date(2026, 3, 13)); // 13 April 2026 (Mon)
  const [search, setSearch] = useState("");
  const [activeSources, setActiveSources] = useState<Set<AgendaSource>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<MockEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Convert mock events to AgendaEvent-compatible shape
  const _allAgendaEvents = useMemo(() => MOCK_EVENTS.map(mockToAgendaEvent), []);

  // Filter events
  const filteredEvents = useMemo(() => {
    let mocks = MOCK_EVENTS;
    if (activeSources.size > 0) {
      mocks = mocks.filter((e) => activeSources.has(e.source));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      mocks = mocks.filter((e) => e.title.toLowerCase().includes(q));
    }
    return mocks.map(mockToAgendaEvent);
  }, [activeSources, search]);

  // KPI data
  const kpiData: AgendaKpiData = useMemo(() => {
    const today = currentDate;
    const todayEvents = MOCK_EVENTS.filter(
      (e) => e.start.getDate() === today.getDate() && e.start.getMonth() === today.getMonth(),
    );
    return {
      totalEventos: MOCK_EVENTS.length,
      audienciasHoje: todayEvents.filter((e) => e.source === "audiencias").length,
      prazos7d: MOCK_EVENTS.filter((e) => e.source === "prazos").length,
      horasOcupadas: 18,
      prepPercent: 60,
      conflitos: 1,
    };
  }, [currentDate]);

  const handleToggleSource = useCallback((source: AgendaSource) => {
    setActiveSources((prev) => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  }, []);

  const handleEventClick = useCallback((event: AgendaEvent) => {
    // Find the original mock event for the detail dialog
    const mock = MOCK_EVENTS.find((m) => m.id === event.id) ?? null;
    setSelectedEvent(mock);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const label = dateLabel(view, currentDate);
  const eventCount = filteredEvents.length;

  return (
    <div className="space-y-4">
      {/* ── Row 1: Title + View Toggle + CTA ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Heading level="page">Agenda</Heading>
          <p className="text-sm text-muted-foreground/50 mt-0.5">
            {label} · {eventCount} eventos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle
            mode={view}
            onChange={(m) => setView(m as AgendaView)}
            options={VIEW_OPTIONS}
          />
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm">
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Novo evento</span>
          </button>
        </div>
      </div>

      {/* ── Row 2: KPI Strip ── */}
      <AgendaKpiStrip data={kpiData} />

      {/* ── Row 3: Filter Bar ── */}
      <AgendaFilterBar
        search={search}
        onSearchChange={setSearch}
        onPrev={() => {}}
        onNext={() => {}}
        onToday={() => {}}
        activeSources={activeSources}
        onToggleSource={handleToggleSource}
      />

      {/* ── Row 4: Active View ── */}
      {view === "semana" && (
        <SemanaView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={handleEventClick}
        />
      )}
      {view === "mes" && (
        <MesView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={handleEventClick}
        />
      )}
      {view === "ano" && (
        <AnoView
          currentDate={currentDate}
          events={filteredEvents}
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

      {/* ── Dialog ── */}
      <AgendaEventDetail
        event={selectedEvent}
        open={dialogOpen}
        onClose={handleCloseDialog}
      />
    </div>
  );
}
