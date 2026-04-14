/**
 * AnoView — Vista anual heatmap
 * ============================================================================
 * Recebe AgendaEvent[] (dados reais).
 * ============================================================================
 */

"use client";

import { useMemo } from "react";
import { CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/shared/glass-panel";
import type { AgendaEvent } from "../../lib/adapters";

export interface AnoViewProps {
  currentDate: Date;
  events: AgendaEvent[];
  className?: string;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function intensityClass(count: number): string {
  if (count === 0) return "bg-muted/8";
  if (count === 1) return "bg-primary/30";
  if (count === 2) return "bg-primary/55";
  return "bg-primary/85";
}

export function AnoView({ currentDate, events, className }: AnoViewProps) {
  const today = useMemo(() => new Date(), []);
  const year = currentDate.getFullYear();

  const yearData = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      const isCurrent = m === today.getMonth() && year === today.getFullYear();
      const days = Array.from({ length: daysInMonth }, (__, d) => {
        const day = d + 1;
        const count = events.filter(
          (e) => e.start.getFullYear() === year && e.start.getMonth() === m && e.start.getDate() === day,
        ).length;
        return { day, count, isToday: isCurrent && day === today.getDate() };
      });
      return { month: m, days, isCurrent };
    });
  }, [year, events, today]);

  const totalEvents = events.filter((e) => e.start.getFullYear() === year).length;
  const audiencias = events.filter((e) => e.start.getFullYear() === year && e.source === "audiencias").length;
  const expedientes = events.filter((e) => e.start.getFullYear() === year && e.source === "expedientes").length;

  return (
    <GlassPanel className={cn("p-5", className)}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center"><CalendarRange className="size-4 text-primary" /></div>
          <span className="text-sm font-semibold text-foreground">{year}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40">
          <span>Menos</span>
          <div className="flex gap-0.5"><div className="size-2.5 rounded-sm bg-muted/8" /><div className="size-2.5 rounded-sm bg-primary/30" /><div className="size-2.5 rounded-sm bg-primary/55" /><div className="size-2.5 rounded-sm bg-primary/85" /></div>
          <span>Mais</span>
        </div>
      </div>
      <div className="flex gap-4 mb-6">
        {[
          { value: totalEvents, label: "Total", color: "text-foreground" },
          { value: audiencias, label: "Audiencias", color: "text-event-audiencia" },
          { value: expedientes, label: "Expedientes", color: "text-event-expediente" },
        ].map((s) => (
          <GlassPanel key={s.label} depth={2} className="flex-1 text-center px-4 py-3">
            <div className={cn("text-2xl font-bold font-mono tabular-nums", s.color)}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground/40 mt-0.5">{s.label}</div>
          </GlassPanel>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {yearData.map((md) => (
          <div key={md.month}>
            <div className={cn("text-[11px] font-semibold mb-2", md.isCurrent ? "text-primary" : "text-muted-foreground/55")}>
              {MONTH_NAMES[md.month]}{md.isCurrent && <span className="text-[9px] text-muted-foreground/40 ml-1">Atual</span>}
            </div>
            <div className="flex flex-wrap gap-0.75">
              {md.days.map((d) => (
                <div key={d.day} className={cn("size-2.5 rounded-sm cursor-pointer transition-transform hover:scale-[1.3]", intensityClass(d.count), d.isToday && "outline outline-1.5 outline-primary outline-offset-1")} title={`${d.day} ${MONTH_NAMES[md.month]}: ${d.count} evento(s)`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
