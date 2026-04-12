/**
 * MiniCalendar — Sidebar compact month calendar for quick navigation
 * ============================================================================
 * Shows a small month grid with:
 * - Event indicators (dots below day numbers)
 * - Today highlight
 * - Selected date highlight
 * - Month navigation
 *
 * Reuses GlassPanel for consistent glass styling.
 * ============================================================================
 */

"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/shared/glass-panel";

// ─── Props ────────���───────────────────────────────────────────────────

export interface MiniCalendarProps {
  currentDate: Date;
  selectedDate?: Date;
  /** Set of day numbers (1-31) that have events */
  eventDays?: Set<number>;
  onSelectDate?: (date: Date) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  className?: string;
}

// ─── Helpers ───────��──────────────────────────────────────────────────

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface DayCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}

function buildMonthGrid(year: number, month: number): DayCell[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: DayCell[] = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push({ day, currentMonth: false, date: new Date(year, month - 1, day) });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true, date: new Date(year, month, d) });
  }

  // Next month days (fill to complete grid)
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, currentMonth: false, date: new Date(year, month + 1, d) });
    }
  }

  // Split into weeks
  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

// ─── Component ────────────────────────────────────────────────────────

export function MiniCalendar({
  currentDate,
  selectedDate,
  eventDays = new Set(),
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  className,
}: MiniCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);

  return (
    <GlassPanel className={cn("p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-foreground">
          {MONTH_NAMES[month]} {year}
        </span>
        <div className="flex gap-1">
          <button
            onClick={onPrevMonth}
            className="size-5 flex items-center justify-center rounded hover:bg-muted/30 text-muted-foreground/55 transition-colors cursor-pointer"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-3" />
          </button>
          <button
            onClick={onNextMonth}
            className="size-5 flex items-center justify-center rounded hover:bg-muted/30 text-muted-foreground/55 transition-colors cursor-pointer"
            aria-label="Proximo mes"
          >
            <ChevronRight className="size-3" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={`${label}-${i}`}
            className="flex items-center justify-center size-7 text-[9px] font-semibold text-muted-foreground/40"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-0">
          {week.map((cell) => {
            const isToday = isSameDay(cell.date, today);
            const isSelected = selectedDate && isSameDay(cell.date, selectedDate);
            const hasEvent = cell.currentMonth && eventDays.has(cell.day);

            return (
              <button
                key={`${cell.currentMonth}-${cell.day}`}
                onClick={() => onSelectDate?.(cell.date)}
                className={cn(
                  "relative flex items-center justify-center size-7 rounded-lg text-[11px] transition-colors cursor-pointer",
                  !cell.currentMonth && "opacity-30",
                  cell.currentMonth && !isToday && !isSelected && "text-muted-foreground hover:bg-muted/20",
                  isToday && "bg-primary text-primary-foreground font-bold",
                  isSelected && !isToday && "outline outline-1.5 outline-primary outline-offset-1 font-semibold text-foreground",
                )}
                aria-label={`${cell.day} de ${MONTH_NAMES[month]}`}
                aria-current={isToday ? "date" : undefined}
              >
                {cell.day}
                {hasEvent && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </GlassPanel>
  );
}
