'use client';

import { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import {
  Sparkline,
  AnimatedNumber,
  fmtMoeda
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';

// Em uma impl real, type AcordoComParcelas from domain.
// export interface ObrigacoesKpiStripProps { acordos: AcordoComParcelas[] }
export interface ObrigacoesKpiStripProps {
  // mock for POC
  totalPagar: number;
  totalReceber: number;
  totalAtrasadas: number;
  totalQuitadas: number;
  className?: string;
}

export function ObrigacoesKpiStrip({ totalPagar, totalReceber, totalAtrasadas, totalQuitadas, className }: ObrigacoesKpiStripProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className ?? ''}`}>
      {/* ── A Pagar ─────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              A Pagar
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={totalPagar} format={fmtMoeda} />
              </p>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-destructive/8 flex items-center justify-center shrink-0">
            <ArrowDownRight className="size-4 text-destructive/50" />
          </div>
        </div>
        {/* Sparkline de tendência mockup */}
        <div className="mt-2.5 flex items-center gap-2">
          <Sparkline data={[1200, 2500, 1800, 3100, 2400]} width={80} height={16} />
          <span className="text-[9px] font-medium tabular-nums text-destructive/60">
            +5%
          </span>
        </div>
      </GlassPanel>

      {/* ── A Receber ────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              A Receber
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={totalReceber} format={fmtMoeda} />
              </p>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-success/8 flex items-center justify-center shrink-0">
            <ArrowUpRight className="size-4 text-success/50" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <Sparkline data={[4000, 5000, 4800, 6000, 7200]} width={80} height={16} color="success" />
          <span className="text-[9px] font-medium tabular-nums text-success/60">
            +12%
          </span>
        </div>
      </GlassPanel>

      {/* ── Atrasadas ─────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Atrasadas
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={totalAtrasadas} />
              </p>
              <span className="text-[10px] text-muted-foreground/40">parcelas</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-warning/8 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-4 text-warning/50" />
          </div>
        </div>
        {/* Barra de criticidade */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-warning/50 transition-all duration-500"
              style={{ width: `30%` }}
            />
          </div>
        </div>
      </GlassPanel>

      {/* ── Quitadas (Mês) ────────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Quitadas
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={totalQuitadas} />
              </p>
              <span className="text-[10px] text-muted-foreground/40">neste mês</span>
            </div>
          </div>
          <div className="size-8 rounded-lg bg-success/8 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4 text-success/50" />
          </div>
        </div>
        {/* Barra de sucesso */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-success/40 transition-all duration-500"
              style={{ width: `85%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            85%
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}
