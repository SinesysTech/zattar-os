/**
 * AnoView — Heatmap anual estilo GitHub no padrão Glass Briefing
 * ============================================================================
 * Alinhado com AudienciasYearHeatmap e ExpedientesYearHeatmap:
 * - Year Navigator (ChevronLeft + ano + ChevronRight + Hoje)
 * - Layout 2 colunas: heatmap (GlassPanel depth=1) + sidebar (StatCards)
 * - 12 MonthGrids em 4×3 com weekday labels (S/T/Q/Q/S/S/D) e offset Monday-start
 * - Tooltips por dia, ring no "hoje", dialog de detalhes por dia
 * - Sidebar com Total, Breakdown por fonte, Mês Mais Intenso, Média Semanal,
 *   Ranking por Volume
 * ============================================================================
 */

"use client";

import * as React from "react";
import { useMemo, useState, useCallback } from "react";
import {
  format,
  getDate,
  getDay,
  getDaysInMonth,
  getMonth,
  getYear,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Layers,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/shared/glass-panel";
import { IconContainer } from "@/components/ui/icon-container";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/typography";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { AgendaEvent } from "../../lib/adapters";
import { getSourceColors } from "../../lib/source-colors";
import { SOURCE_CONFIGS, type AgendaSource } from "../mock-data";

// ─── Types ────────────────────────────────────────────────────────────

export interface AnoViewProps {
  currentDate: Date;
  events: AgendaEvent[];
  onDateChange?: (date: Date) => void;
  onEventClick?: (event: AgendaEvent) => void;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

const BREAKDOWN_ORDER: AgendaSource[] = [
  "audiencias",
  "expedientes",
  "prazos",
  "pericias",
  "obrigacoes",
  "agenda",
];

// ─── Helpers ──────────────────────────────────────────────────────────

function getDayBg(count: number): string {
  if (count === 0) return "bg-muted/50";
  if (count <= 2) return "bg-primary/15";
  if (count <= 4) return "bg-primary/35";
  if (count <= 7) return "bg-primary/55";
  return "bg-primary/80";
}

// ─── Month Grid ───────────────────────────────────────────────────────

const MonthGrid = React.memo(function MonthGrid({
  monthIndex,
  year,
  dayMap,
  onDayClick,
}: {
  monthIndex: number;
  year: number;
  dayMap: Map<string, AgendaEvent[]>;
  onDayClick: (month: number, day: number) => void;
}) {
  const monthName = format(new Date(year, monthIndex, 1), "MMMM", {
    locale: ptBR,
  });
  const daysInMonth = getDaysInMonth(new Date(year, monthIndex));
  const firstDayOfWeek = getDay(startOfMonth(new Date(year, monthIndex)));
  const offset = (firstDayOfWeek + 6) % 7; // Monday-start

  let monthTotal = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    monthTotal += (dayMap.get(`${monthIndex}-${d}`) || []).length;
  }

  const now = new Date();
  const currentYear = getYear(now);
  const currentMonth = getMonth(now);
  const currentDay = getDate(now);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn( "text-[11px] font-semibold capitalize text-foreground")}>
          {monthName}
        </span>
        <span className="text-[9px] tabular-nums text-muted-foreground/50">
          {monthTotal}
        </span>
      </div>
      <div className={cn("grid grid-cols-7 inline-nano mb-0.5")}>
        {WEEKDAY_LABELS.map((d, i) => (
          <span
            key={i}
            className={cn( "text-[7px] font-semibold text-center text-muted-foreground/30 uppercase")}
          >
            {d}
          </span>
        ))}
      </div>
      <div className={cn("grid grid-cols-7 inline-nano")}>
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`e${i}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const events = dayMap.get(`${monthIndex}-${day}`) || [];
          const count = events.length;
          const isToday =
            year === currentYear &&
            monthIndex === currentMonth &&
            day === currentDay;

          return (
            <Tooltip key={day}>
              <TooltipTrigger asChild>
                <button
                  aria-label={`${format(new Date(year, monthIndex, day), "d 'de' MMMM", { locale: ptBR })}, ${count} evento${count !== 1 ? "s" : ""}`}
                  type="button"
                  onClick={() => count > 0 && onDayClick(monthIndex, day)}
                  className={cn(
                    "aspect-square rounded-[2px] transition-all duration-100",
                    getDayBg(count),
                    count > 0 &&
                      "cursor-pointer hover:scale-[1.3] hover:opacity-80",
                    count === 0 && "cursor-default",
                    isToday &&
                      "ring-[1.5px] ring-primary ring-offset-1 ring-offset-transparent",
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className={cn("text-caption")}>
                {format(new Date(year, monthIndex, day), "d 'de' MMMM", {
                  locale: ptBR,
                })}{" "}
                · {count} evento{count !== 1 ? "s" : ""}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
});

// ─── Stat Card ────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/40 bg-muted/30 inset-card-compact px-5")}>
      <div className={cn("flex items-center inline-tight mb-2")}>
        <IconContainer size="sm" className={iconBg}>
          <Icon className={cn("size-3.5", iconColor)} />
        </IconContainer>
        <span className={cn("text-overline text-muted-foreground/60")}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

// ─── Day Detail Dialog ────────────────────────────────────────────────

function DayDetailDialog({
  events,
  date,
  open,
  onOpenChange,
  onEventClick,
}: {
  events: AgendaEvent[];
  date: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventClick?: (event: AgendaEvent) => void;
}) {
  const dateLabel = format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="capitalize">{dateLabel}</DialogTitle>
          <DialogDescription>
            {events.length} evento{events.length !== 1 ? "s" : ""} neste dia
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className={cn("flex flex-col stack-tight pr-2")}>
            {sorted.map((evt) => {
              const colors = getSourceColors(evt.source);
              const cfg = SOURCE_CONFIGS[evt.source as AgendaSource];
              const time = `${String(evt.start.getHours()).padStart(2, "0")}:${String(evt.start.getMinutes()).padStart(2, "0")}`;
              return (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => {
                    onEventClick?.(evt);
                    onOpenChange(false);
                  }}
                  className={cn(/* design-system-escape: p-3 → usar <Inset> */ "flex flex-col w-full text-left rounded-xl border border-border/40 bg-muted/30 inset-medium stack-snug transition-colors hover:bg-muted/50 cursor-pointer")}
                >
                  <div className={cn("flex items-center inline-tight")}>
                    <span
                      className={cn(
                        /* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; */ "inline-flex items-center inline-snug px-2 py-0.5 rounded-md text-[10px] font-medium border",
                        colors.bg,
                        colors.text,
                        colors.border,
                      )}
                    >
                      <span
                        className={cn("size-1.5 rounded-full", colors.accent)}
                      />
                      {cfg?.label ?? evt.source}
                    </span>
                    <span className="text-[11px] tabular-nums text-muted-foreground/70 font-mono">
                      {time}
                    </span>
                  </div>
                  <p className={cn( "text-[12px] font-medium text-foreground truncate")}>
                    {evt.title}
                  </p>
                  {evt.meta?.processo && (
                    <p className="text-[10px] font-mono text-muted-foreground/60 truncate">
                      {evt.meta.processo}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export function AnoView({
  currentDate,
  events,
  onDateChange,
  onEventClick,
  className,
}: AnoViewProps) {
  const year = getYear(currentDate);

  // Dialog state
  const [selectedDayEvents, setSelectedDayEvents] = useState<AgendaEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  // Day map (only events of the viewed year)
  const dayMap = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const evt of events) {
      if (getYear(evt.start) !== year) continue;
      const key = `${getMonth(evt.start)}-${getDate(evt.start)}`;
      const arr = map.get(key) || [];
      arr.push(evt);
      map.set(key, arr);
    }
    return map;
  }, [events, year]);

  // Stats
  const stats = useMemo(() => {
    const yearEvents = events.filter((e) => getYear(e.start) === year);
    const total = yearEvents.length;

    // Breakdown by source
    const breakdown: Record<AgendaSource, number> = {
      audiencias: 0,
      expedientes: 0,
      obrigacoes: 0,
      pericias: 0,
      agenda: 0,
      prazos: 0,
    };
    for (const e of yearEvents) {
      const src = e.source as AgendaSource;
      if (src in breakdown) breakdown[src] += 1;
    }

    // Month counts
    const monthCounts = Array.from({ length: 12 }, (_, m) =>
      yearEvents.filter((e) => getMonth(e.start) === m).length,
    );
    const maxMonthIdx = monthCounts.indexOf(Math.max(...monthCounts));
    const maxMonthCount = monthCounts[maxMonthIdx] || 0;

    // Weekly avg (baseado em 52 semanas cheias)
    const weekAvg = total > 0 ? (total / 52).toFixed(1) : "0";

    return {
      total,
      breakdown,
      monthCounts,
      maxMonthIdx,
      maxMonthCount,
      weekAvg,
    };
  }, [events, year]);

  // Top months ranking
  const topMonths = useMemo(() => {
    return stats.monthCounts
      .map((count, idx) => ({ idx, count }))
      .filter((m) => m.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [stats.monthCounts]);

  // Day click → open detail dialog
  const handleDayClick = useCallback(
    (monthIndex: number, day: number) => {
      const list = dayMap.get(`${monthIndex}-${day}`) || [];
      if (list.length > 0) {
        setSelectedDayEvents(list);
        setSelectedDate(new Date(year, monthIndex, day));
        setDialogOpen(true);
      }
    },
    [dayMap, year],
  );

  // Navigation handlers
  const today = new Date();
  const isCurrentYear = year === getYear(today);

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("flex flex-col inline-default-plus", className)}>
        {/* Year Navigator */}
        <div className={cn("flex items-center inline-tight")}>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-border/40 bg-muted/60 backdrop-blur-sm hover:bg-muted/70 rounded-xl"
            onClick={() => onDateChange?.(new Date(year - 1, 0, 1))}
            aria-label="Ano anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-section-title w-14 text-center tabular-nums select-none">
            {year}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-border/40 bg-muted/60 backdrop-blur-sm hover:bg-muted/70 rounded-xl"
            onClick={() => onDateChange?.(new Date(year + 1, 0, 1))}
            aria-label="Próximo ano"
          >
            <ChevronRight className="size-4" />
          </Button>
          {!isCurrentYear && (
            <Button
              variant="ghost"
              size="sm"
              className={cn("text-caption border border-border/40 bg-primary/8 text-primary hover:bg-primary/14 rounded-lg")}
              onClick={() => onDateChange?.(new Date())}
            >
              Hoje
            </Button>
          )}
        </div>

        {/* Main Layout */}
        <div className={cn("flex inline-default-plus flex-wrap xl:flex-nowrap")}>
          {/* Stats Sidebar */}
          <GlassPanel
            depth={2}
            className={cn(/* design-system-escape: p-5 → usar <Inset> */ "flex flex-col w-full xl:w-64 shrink-0 inset-default-plus stack-medium")}
          >
            {/* Total no Ano */}
            <StatCard
              icon={CalendarDays}
              iconBg="bg-primary/15"
              iconColor="text-primary"
              label="Total no Ano"
            >
              <Text variant="kpi-value">{stats.total}</Text>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                evento{stats.total !== 1 ? "s" : ""} no período
              </p>
            </StatCard>

            {/* Breakdown por fonte */}
            {stats.total > 0 && (
              <StatCard
                icon={Layers}
                iconBg="bg-info/12"
                iconColor="text-info"
                label="Por Tipo"
              >
                <div className={cn("flex flex-col stack-snug mt-1")}>
                  {BREAKDOWN_ORDER.filter(
                    (src) => stats.breakdown[src] > 0,
                  ).map((src) => {
                    const count = stats.breakdown[src];
                    const pct =
                      stats.total > 0 ? (count / stats.total) * 100 : 0;
                    const colors = getSourceColors(src);
                    const cfg = SOURCE_CONFIGS[src];
                    return (
                      <div key={src} className={cn("flex items-center inline-tight")}>
                        <span
                          className={cn(
                            "size-1.5 rounded-full shrink-0",
                            colors.accent,
                          )}
                        />
                        <span className="text-[11px] text-muted-foreground/70 w-20 truncate">
                          {cfg.label}
                        </span>
                        <div className="flex-1 h-1 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              colors.accent,
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={cn( "text-[10px] font-semibold tabular-nums w-6 text-right")}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </StatCard>
            )}

            {/* Mês Mais Intenso */}
            {stats.maxMonthCount > 0 && (
              <StatCard
                icon={Flame}
                iconBg="bg-warning/12"
                iconColor="text-warning"
                label="Mês Mais Intenso"
              >
                <div className="text-card-title capitalize">
                  {format(new Date(year, stats.maxMonthIdx, 1), "MMMM", {
                    locale: ptBR,
                  })}
                </div>
                <div className="text-[10px] text-muted-foreground/50 mt-0.5">
                  {stats.maxMonthCount} evento
                  {stats.maxMonthCount !== 1 ? "s" : ""}
                </div>
                <div className="mt-2 h-1 rounded-full bg-muted/60">
                  <div
                    className="h-1 rounded-full bg-warning/70 transition-all duration-500"
                    style={{
                      width: `${stats.total > 0 ? Math.round((stats.maxMonthCount / stats.total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </StatCard>
            )}

            {/* Média Semanal */}
            <StatCard
              icon={BarChart2}
              iconBg="bg-success/12"
              iconColor="text-success"
              label="Média Semanal"
            >
              <Text variant="kpi-value">{stats.weekAvg}</Text>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                eventos / semana
              </p>
            </StatCard>

            {/* Ranking por Volume */}
            {topMonths.length > 0 && (
              <div className={cn("pt-1")}>
                <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/40")}>
                  Ranking por Volume
                </span>
                <div className={cn("flex flex-col mt-2 stack-snug")}>
                  {topMonths.map((m, i) => (
                    <div key={m.idx} className={cn("flex items-center inline-tight")}>
                      <span className={cn( "text-[9px] font-bold text-muted-foreground/40 w-3 text-right")}>
                        {i + 1}
                      </span>
                      <span className={cn( "text-[11px] font-medium w-10 capitalize")}>
                        {format(new Date(year, m.idx, 1), "MMM", {
                          locale: ptBR,
                        })}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{
                            width: `${stats.maxMonthCount > 0 ? (m.count / stats.maxMonthCount) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className={cn( "text-[10px] font-semibold tabular-nums w-7 text-right")}>
                        {m.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassPanel>

          {/* Heatmap Panel */}
          <GlassPanel depth={1} className={cn("flex-1 min-w-0 inset-dialog")}>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
              {Array.from({ length: 12 }, (_, i) => (
                <MonthGrid
                  key={i}
                  monthIndex={i}
                  year={year}
                  dayMap={dayMap}
                  onDayClick={handleDayClick}
                />
              ))}
            </div>

            {/* Legend */}
            <div className={cn("flex items-center inline-micro justify-end mt-6 flex-wrap")}>
              <span className="text-[9px] text-muted-foreground/40 mr-1">
                Menos
              </span>
              <div className="size-3 rounded-[2px] bg-muted/50" />
              <div className="size-3 rounded-[2px] bg-primary/15" />
              <div className="size-3 rounded-[2px] bg-primary/35" />
              <div className="size-3 rounded-[2px] bg-primary/55" />
              <div className="size-3 rounded-[2px] bg-primary/80" />
              <span className="text-[9px] text-muted-foreground/40 ml-1">
                Mais
              </span>
              <span className={cn("text-muted-foreground/40 mx-2 text-[9px]")}>·</span>
              <div className={cn("flex items-center inline-snug")}>
                <div className="size-3 rounded-[2px] bg-muted/50 ring-[1.5px] ring-primary ring-offset-1 ring-offset-transparent" />
                <span className="text-[9px] text-muted-foreground/50">Hoje</span>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Day Detail Dialog */}
      <DayDetailDialog
        events={selectedDayEvents}
        date={selectedDate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onEventClick={onEventClick}
      />
    </TooltipProvider>
  );
}
