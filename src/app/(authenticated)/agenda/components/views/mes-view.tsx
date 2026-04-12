/**
 * MesView — Vista mensal com grid de dias e event chips
 * ============================================================================
 * Recebe AgendaEvent[] (dados reais).
 * ============================================================================
 */

"use client";

import { useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarSource } from "@/app/(authenticated)/calendar";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/shared/glass-panel";
import type { AgendaEvent } from "../../lib/adapters";

// ─── Types ────────────────────────────────────────────────────────────

export interface MesViewProps {
  currentDate: Date;
  events: AgendaEvent[];
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  onEventClick?: (e: AgendaEvent) => void;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function sourceColors(source: CalendarSource) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    audiencias:  { bg: "bg-info/15",        text: "text-info",        border: "border-info/20" },
    expedientes: { bg: "bg-warning/15",     text: "text-warning",     border: "border-warning/20" },
    obrigacoes:  { bg: "bg-warning/15",     text: "text-warning",     border: "border-warning/20" },
    pericias:    { bg: "bg-primary/15",     text: "text-primary",     border: "border-primary/20" },
    agenda:      { bg: "bg-primary/15",     text: "text-primary",     border: "border-primary/20" },
  };
  return map[source] ?? { bg: "bg-muted/15", text: "text-muted-foreground", border: "border-border/20" };
}

function fmtTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface DayCell {
  day: number;
  date: Date;
  currentMonth: boolean;
  isToday: boolean;
  events: AgendaEvent[];
}

function buildMonthCells(year: number, month: number, events: AgendaEvent[], today: Date): DayCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: DayCell[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push({ day, date: new Date(year, month - 1, day), currentMonth: false, isToday: false, events: [] });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    const dayEvents = events.filter(
      (e) => e.start.getDate() === d && e.start.getMonth() === month && e.start.getFullYear() === year,
    );
    cells.push({ day: d, date, currentMonth: true, isToday, events: dayEvents });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, date: new Date(year, month + 1, d), currentMonth: false, isToday: false, events: [] });
    }
  }
  return cells;
}

// ─── Component ────────────────────────────────────────────────────────

export function MesView({ currentDate, events, onPrev, onNext, onToday, onEventClick, className }: MesViewProps) {
  const today = useMemo(() => new Date(), []);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const cells = useMemo(() => buildMonthCells(year, month, events, today), [year, month, events, today]);

  return (
    <GlassPanel className={cn("p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="size-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">{MONTH_NAMES[month]} {year}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-muted/20 transition-colors text-muted-foreground/50 cursor-pointer" aria-label="Mes anterior"><ChevronLeft className="size-3.5" /></button>
          <button onClick={onToday} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/8 text-primary hover:bg-primary/12 transition-colors cursor-pointer">Hoje</button>
          <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-muted/20 transition-colors text-muted-foreground/50 cursor-pointer" aria-label="Proximo mes"><ChevronRight className="size-3.5" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground/35 uppercase tracking-wider py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => (
          <div key={i} className={cn("min-h-[88px] p-2 rounded-xl border border-transparent transition-all cursor-pointer hover:bg-muted/8 hover:border-border/10", !cell.currentMonth && "opacity-30")}>
            <div className="mb-1">
              <span className={cn("text-xs font-semibold", cell.isToday ? "inline-flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground text-[11px]" : "text-muted-foreground/60")}>
                {cell.day}
              </span>
            </div>
            <div className="space-y-0.5">
              {cell.events.slice(0, 3).map((evt) => {
                const colors = sourceColors(evt.source);
                return (
                  <button key={evt.id} onClick={() => onEventClick?.(evt)} className={cn("w-full text-left text-[9.5px] px-1.5 py-0.5 rounded truncate font-medium border-l-2 cursor-pointer hover:opacity-80 transition-opacity", colors.bg, colors.border, colors.text)}>
                    {!evt.allDay && fmtTime(evt.start)} {evt.title}
                  </button>
                );
              })}
              {cell.events.length > 3 && <span className="text-[9px] text-muted-foreground/40 font-medium pl-1">+{cell.events.length - 3} mais</span>}
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
