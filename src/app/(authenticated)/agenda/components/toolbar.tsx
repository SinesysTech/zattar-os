/**
 * AgendaToolbar — Barra de controles da Agenda
 * ============================================================================
 * Search, filtro por fonte, date nav, view switcher, novo evento.
 * Reutiliza: SearchInput, ViewToggle do design system.
 * ============================================================================
 */

"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  List,
  Sparkles,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/dashboard/search-input";
import { ViewToggle, type ViewToggleOption } from "@/components/dashboard/view-toggle";
import type { CalendarSource } from "@/app/(authenticated)/calendar";
import { SOURCE_CONFIG, type CalendarView } from "@/app/(authenticated)/calendar/briefing-domain";
import { monthName, fmtDateFull, startOfWeek, addDays } from "@/app/(authenticated)/calendar/briefing-helpers";
import { Heading } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';

// ─── View Options ──────────────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: "month", icon: CalendarRange, label: "Mês" },
  { id: "week", icon: CalendarDays, label: "Semana" },
  { id: "day", icon: Calendar, label: "Dia" },
  { id: "agenda", icon: List, label: "Lista" },
  { id: "briefing", icon: Sparkles, label: "Briefing" },
];

// ─── Props ─────────────────────────────────────────────────────────────

export interface AgendaToolbarProps {
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  search: string;
  onSearchChange: (s: string) => void;
  sourceFilter: Set<CalendarSource>;
  onToggleSource: (s: CalendarSource) => void;
  onNewEvent: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────

export function AgendaToolbar({
  view,
  onViewChange,
  currentDate,
  onPrev,
  onNext,
  onToday,
  search,
  onSearchChange,
  sourceFilter,
  onToggleSource,
  onNewEvent,
}: AgendaToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  const dateLabel = useMemo(() => {
    if (view === "month") return `${monthName(currentDate)} ${currentDate.getFullYear()}`;
    if (view === "week") {
      const start = startOfWeek(currentDate);
      const end = addDays(start, 6);
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()}–${end.getDate()} de ${monthName(start).toLowerCase()}`;
      }
      return `${start.getDate()} ${monthName(start).slice(0, 3).toLowerCase()} – ${end.getDate()} ${monthName(end).slice(0, 3).toLowerCase()}`;
    }
    if (view === "day" || view === "briefing") return fmtDateFull(currentDate);
    return `${monthName(currentDate)} ${currentDate.getFullYear()}`;
  }, [view, currentDate]);

  const activeFilters = sourceFilter.size;

  return (
    <div className={cn("stack-medium")}>
      {/* Row 1: Title + New Event */}
      <div className={cn("flex items-end justify-between inline-default")}>
        <div>
          <Heading level="page">Agenda</Heading>
          <p className={cn("text-body-sm text-muted-foreground/50 mt-0.5")}>{dateLabel}</p>
        </div>
        <Button size="sm" className="rounded-xl" onClick={onNewEvent}>
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Novo evento</span>
        </Button>
      </div>

      {/* Row 2: Search + Filters + Nav + View */}
      <div className={cn("flex items-center inline-tight flex-wrap")}>
        {/* Search (reusa SearchInput existente) */}
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar eventos..."
          className="flex-1 max-w-56"
        />

        {/* Source Filter */}
        <div className="relative">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              "flex items-center inline-snug px-2.5 py-1.5 rounded-lg text-caption border transition-colors cursor-pointer",
              activeFilters > 0
                ? "border-primary/20 bg-primary/6 text-primary"
                : "border-border/15 text-muted-foreground/50 hover:text-muted-foreground/70",
            )}
          >
            Tipo
            {activeFilters > 0 && (
              <span className={cn("text-[9px] px-1 py-0.5 rounded-full bg-primary/15 tabular-nums")}>{activeFilters}</span>
            )}
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
              <div className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "absolute top-full left-0 mt-1 z-50 w-48 p-1.5 rounded-xl border border-border/20 bg-background shadow-lg")}>
                {(Object.keys(SOURCE_CONFIG) as CalendarSource[]).map((src) => {
                  const cfg = SOURCE_CONFIG[src];
                  const active = sourceFilter.has(src);
                  return (
                    <button
                      key={src}
                      onClick={() => onToggleSource(src)}
                      className={cn(/* design-system-escape: gap-2.5 gap sem token DS; px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-caption hover:bg-foreground/4 transition-colors cursor-pointer")}
                    >
                      <div className={cn(
                        "size-3.5 rounded border flex items-center justify-center",
                        active ? "bg-primary border-primary" : "border-border/30",
                      )}>
                        {active && <Check className="size-2.5 text-primary-foreground" />}
                      </div>
                      <span className={cn(active ? "text-foreground" : "text-muted-foreground/60")}>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Date Nav */}
        <div className={cn("flex items-center inline-micro")}>
          <button onClick={onPrev} className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "p-1.5 rounded-lg hover:bg-foreground/4 transition-colors text-muted-foreground/55 hover:text-muted-foreground/50 cursor-pointer")}>
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={onToday} className={cn(/* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv.; */ "px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/8 text-primary hover:bg-primary/12 transition-colors cursor-pointer")}>
            Hoje
          </button>
          <button onClick={onNext} className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "p-1.5 rounded-lg hover:bg-foreground/4 transition-colors text-muted-foreground/55 hover:text-muted-foreground/50 cursor-pointer")}>
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* View Switcher (reusa ViewToggle existente) */}
        <ViewToggle
          mode={view}
          onChange={(m) => onViewChange(m as CalendarView)}
          options={VIEW_OPTIONS}
        />
      </div>
    </div>
  );
}
