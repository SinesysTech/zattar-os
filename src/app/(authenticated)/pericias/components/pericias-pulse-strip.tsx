'use client';

/**
 * PericiasPulseStrip — KPI strip de perícias com dados reais (sem mocks).
 * ============================================================================
 * Espelha o padrão de ContratosPulseStrip:
 * - 4 cards com AnimatedNumber, Sparkline e barra de proporção
 * - Dados vêm de actionPericiasPulseStats (agregação server-side)
 * - Destaque warning/destructive condicional (prazos críticos, sem responsável)
 * ============================================================================
 */

import { Target, AlertTriangle, FileCheck2, UserMinus } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import {
  AnimatedNumber,
  Sparkline,
} from '@/app/(authenticated)/dashboard/widgets/primitives';
import { cn } from '@/lib/utils';
import type { PericiasPulseStats } from '../actions';

interface PericiasPulseStripProps {
  stats: PericiasPulseStats;
}

export function PericiasPulseStrip({ stats }: PericiasPulseStripProps) {
  const total = stats.ativas + stats.finalizadas;
  const pctAtivas = total > 0 ? Math.round((stats.ativas / total) * 100) : 0;
  const pctAguardando =
    stats.ativas > 0 ? Math.round((stats.aguardandoLaudo / stats.ativas) * 100) : 0;
  const pctCriticos =
    stats.ativas > 0 ? Math.round((stats.prazosCriticos7d / stats.ativas) * 100) : 0;
  const pctSemResp =
    stats.ativas > 0 ? Math.round((stats.semResponsavel / stats.ativas) * 100) : 0;

  return (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 lg:grid-cols-4 gap-3")}>
      {/* ── Ativas ─────────────────────────────────────────────────── */}
      <GlassPanel depth={1} className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3.5 padding direcional sem Inset equiv. */ "px-4 py-3.5")}>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-start justify-between gap-2")}>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate")}>
              Perícias Ativas
            </p>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-baseline gap-1.5 mt-1")}>
              <p className={cn(/* design-system-escape: text-2xl → migrar para <Heading level="...">; font-bold → className de <Text>/<Heading>; leading-none sem token DS; tracking-tight sem token DS */ "font-display text-2xl font-bold tabular-nums leading-none tracking-tight")}>
                <AnimatedNumber value={stats.ativas} />
              </p>
            </div>
          </div>
          <IconContainer size="md" className="bg-primary/8">
            <Target className="size-4 text-primary/60" />
          </IconContainer>
        </div>

        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mt-2.5 flex items-center gap-2")}>
          {stats.trendMensal.length >= 2 ? (
            <Sparkline data={stats.trendMensal} width={80} height={16} />
          ) : (
            <div className="h-4 flex-1" />
          )}
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {pctAtivas}%
          </span>
        </div>
      </GlassPanel>

      {/* ── Aguardando Laudo ───────────────────────────────────────── */}
      <GlassPanel depth={1} className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3.5 padding direcional sem Inset equiv. */ "px-4 py-3.5")}>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-start justify-between gap-2")}>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate")}>
              Aguardando Laudo
            </p>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-baseline gap-1.5 mt-1")}>
              <p className={cn(/* design-system-escape: text-2xl → migrar para <Heading level="...">; font-bold → className de <Text>/<Heading>; leading-none sem token DS; tracking-tight sem token DS */ "font-display text-2xl font-bold tabular-nums leading-none tracking-tight")}>
                <AnimatedNumber value={stats.aguardandoLaudo} />
              </p>
            </div>
          </div>
          <IconContainer size="md" className="bg-info/8">
            <FileCheck2 className="size-4 text-info/60" />
          </IconContainer>
        </div>

        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mt-2.5 flex items-center gap-2")}>
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-info/25 transition-all duration-700"
              style={{ width: `${pctAguardando}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {pctAguardando}%
          </span>
        </div>
      </GlassPanel>

      {/* ── Prazos Críticos (7d) ───────────────────────────────────── */}
      <GlassPanel
        depth={stats.prazosCriticos7d > 0 ? 2 : 1}
        className={cn(
          /* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3.5 padding direcional sem Inset equiv. */ 'px-4 py-3.5',
          stats.prazosCriticos7d > 0 && 'border-destructive/15',
        )}
      >
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-start justify-between gap-2")}>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate")}>
              Prazos em 7d
            </p>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-baseline gap-1.5 mt-1")}>
              <p
                className={cn(
                  /* design-system-escape: text-2xl → migrar para <Heading level="...">; font-bold → className de <Text>/<Heading>; leading-none sem token DS; tracking-tight sem token DS */ 'font-display text-2xl font-bold tabular-nums leading-none tracking-tight',
                  stats.prazosCriticos7d > 0 && 'text-destructive/80',
                )}
              >
                <AnimatedNumber value={stats.prazosCriticos7d} />
              </p>
            </div>
          </div>
          <IconContainer
            size="md"
            className={cn(
              'bg-destructive/8',
              stats.prazosCriticos7d > 0 && 'border border-destructive/20',
            )}
          >
            <AlertTriangle className="size-4 text-destructive/60" />
          </IconContainer>
        </div>

        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mt-2.5 flex items-center gap-2")}>
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-destructive/25 transition-all duration-700"
              style={{ width: `${pctCriticos}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {pctCriticos}%
          </span>
        </div>
      </GlassPanel>

      {/* ── Sem Responsável ────────────────────────────────────────── */}
      <GlassPanel
        depth={stats.semResponsavel > 0 ? 2 : 1}
        className={cn(
          /* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3.5 padding direcional sem Inset equiv. */ 'px-4 py-3.5',
          stats.semResponsavel > 0 && 'border-warning/15',
        )}
      >
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-start justify-between gap-2")}>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate")}>
              Sem Responsável
            </p>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-baseline gap-1.5 mt-1")}>
              <p
                className={cn(
                  /* design-system-escape: text-2xl → migrar para <Heading level="...">; font-bold → className de <Text>/<Heading>; leading-none sem token DS; tracking-tight sem token DS */ 'font-display text-2xl font-bold tabular-nums leading-none tracking-tight',
                  stats.semResponsavel > 0 && 'text-warning/80',
                )}
              >
                <AnimatedNumber value={stats.semResponsavel} />
              </p>
            </div>
          </div>
          <IconContainer size="md" className="bg-warning/8">
            <UserMinus className="size-4 text-warning/60" />
          </IconContainer>
        </div>

        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mt-2.5 flex items-center gap-2")}>
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-warning/25 transition-all duration-700"
              style={{ width: `${pctSemResp}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {pctSemResp}%
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}
