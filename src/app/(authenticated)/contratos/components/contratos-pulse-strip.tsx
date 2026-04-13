'use client';

/**
 * ContratosPulseStrip — KPI strip com 4 metricas de contratos
 * ============================================================================
 * Cards com AnimatedNumber, Sparkline, barra de proporcao e destaque condicional.
 *
 * Inspiracao: ExpedientesPulseStrip
 * ============================================================================
 */

import { FileCheck, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import {
  AnimatedNumber,
  Sparkline,
  fmtMoeda,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContratosPulseStripProps {
  ativos: number;
  valorTotal: number;
  vencendo30d: number;
  novosMes: number;
  total: number;
  trendMensal?: number[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ContratosPulseStrip({
  ativos,
  valorTotal,
  vencendo30d,
  novosMes,
  total,
  trendMensal,
}: ContratosPulseStripProps) {
  const pctAtivos = total > 0 ? Math.round((ativos / total) * 100) : 0;
  const pctVencendo = total > 0 ? Math.round((vencendo30d / total) * 100) : 0;
  const pctNovos = total > 0 ? Math.round((novosMes / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* ── Ativos ─────────────────────────────────────────────────── */}
      <GlassPanel depth={1} className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate">
              Ativos
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-2xl font-bold tabular-nums leading-none tracking-tight">
                <AnimatedNumber value={ativos} />
              </p>
            </div>
          </div>
          <IconContainer size="md" className="bg-primary/8">
            <FileCheck className="size-4 text-primary/60" />
          </IconContainer>
        </div>

        {/* Barra de proporcao */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 bg-primary/25"
              style={{ width: `${pctAtivos}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {pctAtivos}%
          </span>
        </div>
      </GlassPanel>

      {/* ── Valor Total ────────────────────────────────────────────── */}
      <GlassPanel depth={1} className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate">
              Valor Total
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-2xl font-bold tabular-nums leading-none tracking-tight">
                {fmtMoeda(valorTotal)}
              </p>
            </div>
          </div>
          <IconContainer size="md" className="bg-primary/8">
            <DollarSign className="size-4 text-primary/60" />
          </IconContainer>
        </div>

        {/* Sparkline em vez de barra de proporcao */}
        <div className="mt-2.5 flex items-center justify-center">
          {trendMensal && trendMensal.length >= 2 ? (
            <Sparkline data={trendMensal} width={120} height={24} />
          ) : (
            <div className="h-6" />
          )}
        </div>
      </GlassPanel>

      {/* ── Vencendo 30d ───────────────────────────────────────────── */}
      <GlassPanel
        depth={vencendo30d > 0 ? 2 : 1}
        className={cn(
          'px-4 py-3.5',
          vencendo30d > 0 && 'border-warning/15',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate">
              Vencendo 30d
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className={cn(
                'font-display text-2xl font-bold tabular-nums leading-none tracking-tight',
                vencendo30d > 0 && 'text-warning/80',
              )}>
                <AnimatedNumber value={vencendo30d} />
              </p>
            </div>
          </div>
          <IconContainer size="md" className={cn(
            'bg-warning/8',
            vencendo30d > 0 && 'border border-warning/20',
          )}>
            <Clock className="size-4 text-warning/60" />
          </IconContainer>
        </div>

        {/* Barra de proporcao */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 bg-warning/25"
              style={{ width: `${pctVencendo}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {pctVencendo}%
          </span>
        </div>
      </GlassPanel>

      {/* ── Novos/Mes ──────────────────────────────────────────────── */}
      <GlassPanel depth={1} className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate">
              Novos/Mes
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-2xl font-bold tabular-nums leading-none tracking-tight">
                <AnimatedNumber value={novosMes} />
              </p>
            </div>
          </div>
          <IconContainer size="md" className="bg-success/8">
            <TrendingUp className="size-4 text-success/60" />
          </IconContainer>
        </div>

        {/* Barra de proporcao */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 bg-success/25"
              style={{ width: `${pctNovos}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {pctNovos}%
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}
