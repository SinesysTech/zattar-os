/**
 * AgendaKpiStrip — Faixa de KPIs para o módulo Agenda
 * ============================================================================
 * Segue EXATAMENTE o padrão PulseStrip/MissionKpiStrip dos outros módulos:
 * - Grid responsivo: 2 cols mobile -> 3 cols md -> 6 cols lg
 * - GlassPanel (depth=1) para cada card
 * - Icon à direita (bg-{color}/8 rounded-lg)
 * - Label em cima, valor grande embaixo
 * - Progress bar ou sub-indicator como secondary viz
 *
 * KPIs: Eventos | Audiências Hoje | Prazos 7d | Horas | Preparo | Conflitos
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
import { Text } from '@/components/ui/typography';

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
  if (pct >= 80) return "Ótimo";
  if (pct >= 50) return "Bom";
  if (pct >= 30) return "Regular";
  return "Baixo";
}

// ─── Component ────────────────────────────────────────────────────────

export function AgendaKpiStrip({ data, className }: AgendaKpiStripProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 inline-medium", className)}>

      {/* ── Eventos ────────────────────────────────────── */}
      <GlassPanel className={cn("px-4 py-3")}>
        <div className={cn("flex items-start justify-between inline-tight")}>
          <div className="min-w-0">
            <p className={cn("text-overline text-muted-foreground/60")}>
              Eventos
            </p>
            <div className={cn("flex items-baseline inline-snug mt-1")}>
              <Text variant="kpi-value">
                {data.totalEventos}
              </Text>
              <span className="text-[10px] text-muted-foreground/40">total</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            <CalendarDays className="size-4 text-primary/50" />
          </div>
        </div>
      </GlassPanel>

      {/* ── Audiências Hoje ────────────────────────────── */}
      <GlassPanel className={cn("px-4 py-3")}>
        <div className={cn("flex items-start justify-between inline-tight")}>
          <div className="min-w-0">
            <p className={cn("text-overline text-muted-foreground/60")}>
              Audiências Hoje
            </p>
            <div className={cn("flex items-baseline inline-snug mt-1")}>
              <Text variant="kpi-value">
                {data.audienciasHoje}
              </Text>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-info/8 flex items-center justify-center shrink-0">
            <Gavel className="size-4 text-info/50" />
          </div>
        </div>
      </GlassPanel>

      {/* ── Prazos 7d ─────────────────────────────────── */}
      <GlassPanel className={cn("px-4 py-3")}>
        <div className={cn("flex items-start justify-between inline-tight")}>
          <div className="min-w-0">
            <p className={cn("text-overline text-muted-foreground/60")}>
              Prazos 7d
            </p>
            <div className={cn("flex items-baseline inline-snug mt-1")}>
              <Text variant="kpi-value">
                {data.prazos7d}
              </Text>
              <span className="text-[10px] text-muted-foreground/40">fatais</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-destructive/8 flex items-center justify-center shrink-0">
            <AlarmClock className="size-4 text-destructive/50" />
          </div>
        </div>
      </GlassPanel>

      {/* ── Horas Ocupadas ────────────────────────────── */}
      <GlassPanel className={cn("px-4 py-3")}>
        <div className={cn("flex items-start justify-between inline-tight")}>
          <div className="min-w-0">
            <p className={cn("text-overline text-muted-foreground/60")}>
              Horas Ocupadas
            </p>
            <div className={cn("flex items-baseline inline-snug mt-1")}>
              <Text variant="kpi-value">
                {data.horasOcupadas}
              </Text>
              <span className="text-[10px] text-muted-foreground/40">h</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-warning/8 flex items-center justify-center shrink-0">
            <Clock className="size-4 text-warning/50" />
          </div>
        </div>
        {/* Progress bar: proporcao de horas preenchidas no dia (8h util) */}
        <div className={cn("mt-2.5 flex items-center inline-tight")}>
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
      <GlassPanel className={cn("px-4 py-3")}>
        <div className={cn("flex items-start justify-between inline-tight")}>
          <div className="min-w-0">
            <p className={cn("text-overline text-muted-foreground/60")}>
              Preparo
            </p>
            <div className={cn("flex items-baseline inline-snug mt-1")}>
              <Text variant="kpi-value">
                {data.prepPercent}%
              </Text>
              <span className="text-[10px] text-muted-foreground/40">{prepLabel(data.prepPercent)}</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-4 text-primary/50" />
          </div>
        </div>
        {/* Barra de preparo com cor dinamica */}
        <div className={cn("mt-2.5 flex items-center inline-tight")}>
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
      <GlassPanel className={cn("px-4 py-3")}>
        <div className={cn("flex items-start justify-between inline-tight")}>
          <div className="min-w-0">
            <p className={cn("text-overline text-muted-foreground/60")}>
              Conflitos
            </p>
            <div className={cn("flex items-baseline inline-snug mt-1")}>
              <Text variant="kpi-value" className={cn(
                data.conflitos > 0 && "text-warning",
              )}>
                {data.conflitos}
              </Text>
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
