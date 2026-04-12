/**
 * SemanaView — Vista semanal com time grid + sidebar
 * ============================================================================
 * Layout: [Mini Calendar + Deadlines + Sources] | [Week Time Grid]
 * Recebe AgendaEvent[] (dados reais via adapters.ts).
 * ============================================================================
 */

"use client";

import { useMemo } from "react";
import type { CalendarSource } from "@/app/(authenticated)/calendar";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/shared/glass-panel";
import { MiniCalendar } from "../mini-calendar";
import { DeadlineSidebar } from "../deadline-sidebar";
import { SourceLegend } from "../source-legend";
import { ConflictBadge } from "../conflict-badge";
import type { AgendaEvent } from "../../lib/adapters";
import type { AgendaSource, Deadline } from "../mock-data";

// ─── Types ────────────────────────────────────────────────────────────

export interface SemanaViewProps {
  currentDate: Date;
  events: AgendaEvent[];
  onSelectDate?: (d: Date) => void;
  onEventClick?: (e: AgendaEvent) => void;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 07:00 - 18:00
const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const SLOT_HEIGHT = 60;

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const r = new Date(d);
    r.setDate(r.getDate() + i);
    return r;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function eventTop(event: AgendaEvent): number {
  const h = event.start.getHours() - 7;
  const m = event.start.getMinutes();
  return h * SLOT_HEIGHT + (m / 60) * SLOT_HEIGHT;
}

function eventHeight(event: AgendaEvent): number {
  const mins = (event.end.getTime() - event.start.getTime()) / 60000;
  return Math.max(24, (mins / 60) * SLOT_HEIGHT);
}

function fmtTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Maps CalendarSource to color classes */
function sourceColors(source: CalendarSource) {
  const map: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    audiencias:  { bg: "bg-info/15",        text: "text-info",        border: "border-info/20",        dot: "bg-info" },
    expedientes: { bg: "bg-warning/15",     text: "text-warning",     border: "border-warning/20",     dot: "bg-warning" },
    obrigacoes:  { bg: "bg-warning/15",     text: "text-warning",     border: "border-warning/20",     dot: "bg-warning" },
    pericias:    { bg: "bg-primary/15",     text: "text-primary",     border: "border-primary/20",     dot: "bg-primary" },
    agenda:      { bg: "bg-primary/15",     text: "text-primary",     border: "border-primary/20",     dot: "bg-primary" },
  };
  return map[source] ?? { bg: "bg-muted/15", text: "text-muted-foreground", border: "border-border/20", dot: "bg-muted-foreground" };
}

// ─── Event Chip ───────────────────────────────────────────────────────

function WeekEventChip({ event, onClick }: { event: AgendaEvent; onClick?: () => void }) {
  const colors = sourceColors(event.source);
  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute left-1 right-1 rounded-lg px-2 py-1 overflow-hidden cursor-pointer",
        "border-l-[3px] transition-transform hover:scale-[1.02] hover:shadow-lg hover:z-10",
        "focus-visible:outline-2 focus-visible:outline-primary",
        colors.bg, colors.border,
      )}
      style={{ top: eventTop(event), height: eventHeight(event) }}
      aria-label={`${event.title} as ${fmtTime(event.start)}`}
    >
      <div className={cn("text-[9px] font-mono opacity-70", colors.text)}>{fmtTime(event.start)}</div>
      <div className={cn("text-[11px] font-semibold truncate", colors.text)}>{event.title}</div>
      {eventHeight(event) > 40 && event.meta?.trt && (
        <div className={cn("text-[9px] opacity-60 truncate", colors.text)}>
          {event.meta?.trt}{event.meta?.modalidade ? ` · ${event.meta?.modalidade === "virtual" ? "Virtual" : "Presencial"}` : ""}
        </div>
      )}
      {eventHeight(event) > 56 && event.meta?.processo && (
        <div className={cn("text-[9px] opacity-50 font-mono truncate", colors.text)}>
          {event.meta?.processo.slice(0, 18)}...
        </div>
      )}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export function SemanaView({
  currentDate,
  events,
  onSelectDate,
  onEventClick,
  className,
}: SemanaViewProps) {
  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const day of weekDays) {
      const key = day.toDateString();
      map.set(key, events.filter((e) => isSameDay(e.start, day)));
    }
    return map;
  }, [events, weekDays]);

  const eventDays = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const days = new Set<number>();
    for (const e of events) {
      if (e.start.getMonth() === month && e.start.getFullYear() === year) {
        days.add(e.start.getDate());
      }
    }
    return days;
  }, [events, currentDate]);

  // Source counts for legend
  const sourceCounts = useMemo(() => {
    const counts: Partial<Record<AgendaSource, number>> = {};
    for (const e of events) {
      const s = e.source as AgendaSource;
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [events]);

  // Deadline extraction from prazo events
  const deadlines: Deadline[] = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => e.meta?.prazoVencido !== undefined)
      .filter((e) => e.start > now)
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        label: `${e.title} — ${e.meta?.processo ?? ""}`,
        processo: e.meta?.processo ?? "",
        daysLeft: Math.max(0, Math.ceil((e.start.getTime() - now.getTime()) / 86400000)),
        fatal: e.meta?.prazoVencido === true,
      }));
  }, [events]);

  // Conflict detection
  const conflictDays = useMemo(() => {
    const conflicts = new Set<string>();
    for (const [key, dayEvents] of eventsByDay) {
      for (let i = 0; i < dayEvents.length; i++) {
        for (let j = i + 1; j < dayEvents.length; j++) {
          if (dayEvents[i].start < dayEvents[j].end && dayEvents[j].start < dayEvents[i].end) {
            conflicts.add(key);
          }
        }
      }
    }
    return conflicts;
  }, [eventsByDay]);

  const nowTop = useMemo(() => {
    const h = today.getHours() - 7;
    const m = today.getMinutes();
    return h * SLOT_HEIGHT + (m / 60) * SLOT_HEIGHT;
  }, [today]);

  return (
    <div className={cn("flex gap-4", className)}>
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 space-y-4 hidden xl:flex xl:flex-col">
        <MiniCalendar
          currentDate={currentDate}
          selectedDate={currentDate}
          eventDays={eventDays}
          onSelectDate={onSelectDate}
        />
        {deadlines.length > 0 && <DeadlineSidebar deadlines={deadlines} />}
        <SourceLegend
          counts={sourceCounts}
          activeSources={new Set()}
          onToggle={() => {}}
        />
      </div>

      {/* Week Grid */}
      <GlassPanel className="flex-1 overflow-hidden">
        {/* Day headers */}
        <div className="flex border-b border-border/10">
          <div className="w-12 flex-shrink-0" />
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div key={i} className="flex-1 text-center py-2 border-l border-border/6 first:border-l-0">
                <div className="text-[10px] text-muted-foreground/40 font-medium">{WEEKDAYS[day.getDay()]}</div>
                <div className={cn(
                  "inline-flex items-center justify-center size-7 rounded-full mt-0.5 text-sm font-semibold",
                  isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground/70",
                )}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="overflow-y-auto" style={{ maxHeight: 560 }}>
          <div className="relative">
            {HOURS.map((hour) => (
              <div key={hour} className="flex" style={{ height: SLOT_HEIGHT }}>
                <div className="w-12 flex-shrink-0 text-right pr-3 pt-1 text-[10px] font-mono font-medium text-muted-foreground/25 tabular-nums">
                  {String(hour).padStart(2, "0")}:00
                </div>
                {weekDays.map((_, di) => (
                  <div key={di} className="flex-1 border-l border-border/6 first:border-l-0 border-t border-border/4 relative" />
                ))}
              </div>
            ))}

            {/* Event overlay */}
            <div className="absolute inset-0 flex" style={{ left: 48 }}>
              {weekDays.map((day, di) => {
                const dayKey = day.toDateString();
                const dayEvents = eventsByDay.get(dayKey) ?? [];
                const hasConflict = conflictDays.has(dayKey);
                const isToday = isSameDay(day, today);
                return (
                  <div key={di} className="flex-1 relative">
                    {isToday && nowTop > 0 && nowTop < HOURS.length * SLOT_HEIGHT && (
                      <div className="absolute left-0 right-0 h-0.5 bg-destructive z-[15] pointer-events-none" style={{ top: nowTop }}>
                        <div className="absolute -left-1 -top-[3px] size-2 rounded-full bg-destructive" />
                      </div>
                    )}
                    {hasConflict && <div className="absolute top-0 right-1 z-20"><ConflictBadge /></div>}
                    {dayEvents.map((event) => (
                      <WeekEventChip key={event.id} event={event} onClick={() => onEventClick?.(event)} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
