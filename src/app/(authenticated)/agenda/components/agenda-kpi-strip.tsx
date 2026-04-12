/**
 * AgendaKpiStrip — Faixa de KPIs para o modulo Agenda
 * ============================================================================
 * Segue EXATAMENTE o padrao PulseStrip/MissionKpiStrip dos outros modulos:
 * - Grid responsivo: 2 cols mobile -> 3 cols md -> 6 cols lg
 * - GlassPanel (depth=1) para cada card
 * - Icon a direita (bg-{color}/8 rounded-lg)
 * - Label em cima, valor grande embaixo
 * - Progress bar ou sub-indicator como secondary viz
 *
 * KPIs: Eventos | Audiencias Hoje | Prazos 7d | Horas | Preparo | Conflitos
 * ============================================================================
 */

"use client";

import {
  CalendarDays,
  Gavel,
  AlarmClock,
  Clock,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/shared/glass-panel";

// ─── Types ────────────────────────────────────────────────────────────

export interface AgendaKpiData {
  totalEventos: number;
  audienciasHoje: number;
  prazos7d: number;
  horasOcupadas: number;
  prepPercent: number;
  conflitos: number;
}

export interface AgendaKpiStripProps {
  data: AgendaKpiData;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function prepColor(score: number): string {
  if (score >= 80) return "var(--success)";
  if (score >= 50) return "var(--warning)";
  return "var(--destructive)";
}

function prepLabel(pct: number) {
  if (pct >= 80) return "Otimo";
  if (pct >= 50) return "Bom";
  if (pct >= 30) return "Regular";
  return "Baixo";
}

// ─── Component ────────────────────────────────────────────────────────

export function AgendaKpiStrip({ data, className }: AgendaKpiStripProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3", className)}>

      {/* ── Eventos ────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Eventos
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                {data.totalEventos}
              </p>
              <span className="text-[10px] text-muted-foreground/40">total</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            <CalendarDays className="size-4 text-primary/50" />
          </div>
        </div>
      </GlassPanel>

      {/* ── Audiencias Hoje ────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Audiencias Hoje
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                {data.audienciasHoje}
              </p>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-info/8 flex items-center justify-center shrink-0">
            <Gavel className="size-4 text-info/50" />
          </div>
        </div>
      </GlassPanel>

      {/* ── Prazos 7d ─────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Prazos 7d
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                {data.prazos7d}
              </p>
              <span className="text-[10px] text-muted-foreground/40">fatais</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-destructive/8 flex items-center justify-center shrink-0">
            <AlarmClock className="size-4 text-destructive/50" />
          </div>
        </div>
      </GlassPanel>

      {/* ── Horas Ocupadas ────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Horas Ocupadas
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                {data.horasOcupadas}
              </p>
              <span className="text-[10px] text-muted-foreground/40">h</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-warning/8 flex items-center justify-center shrink-0">
            <Clock className="size-4 text-warning/50" />
          </div>
        </div>
        {/* Progress bar: proporcao de horas preenchidas no dia (8h util) */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-warning/25 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((data.horasOcupadas / 8) * 100))}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {Math.min(100, Math.round((data.horasOcupadas / 8) * 100))}%
          </span>
        </div>
      </GlassPanel>

      {/* ── Preparo ───────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Preparo
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                {data.prepPercent}%
              </p>
              <span className="text-[10px] text-muted-foreground/40">{prepLabel(data.prepPercent)}</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-4 text-primary/50" />
          </div>
        </div>
        {/* Barra de preparo com cor dinamica */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${data.prepPercent}%`,
                backgroundColor: prepColor(data.prepPercent),
                opacity: 0.3,
              }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {data.prepPercent}%
          </span>
        </div>
      </GlassPanel>

      {/* ── Conflitos ─────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Conflitos
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className={cn(
                "font-display text-xl font-bold tabular-nums leading-none",
                data.conflitos > 0 && "text-warning",
              )}>
                {data.conflitos}
              </p>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-warning/8 flex items-center justify-center shrink-0">
            <TriangleAlert className="size-4 text-warning/50" />
          </div>
        </div>
      </GlassPanel>

    </div>
  );
}
