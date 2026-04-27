'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Radar, ArrowRight } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { AnimatedNumber } from '@/app/(authenticated)/dashboard/widgets/primitives';
import { cn } from '@/lib/utils';
import type { ResumoUltimaCaptura } from '../domain';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExpedientesUltimaCapturaCardProps {
  resumo: ResumoUltimaCaptura | null;
  isLoading?: boolean;
  onClick: (capturaId: number) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricColumn({
  label,
  value,
  barColor,
  barWidth,
}: {
  label: string;
  value: number;
  barColor: string;
  barWidth: number;
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate")}>
        {label}
      </p>
      <p className={cn(/* design-system-escape: text-xl → migrar para <Heading level="...">; font-bold → className de <Text>/<Heading>; leading-none sem token DS */ "font-display text-xl font-bold tabular-nums leading-none mt-1 text-foreground")}>
        <AnimatedNumber value={value} />
      </p>
      <div className="mt-2 h-1 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', barColor)}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function UltimaCapturaCardSkeleton() {
  return (
    <GlassPanel depth={1} className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3.5 padding direcional sem Inset equiv. */ "px-4 py-3.5 animate-pulse")}>
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-start justify-between gap-2")}>
        <div className="h-4 w-28 bg-muted/30 rounded" />
        <div className="size-8 bg-muted/20 rounded-lg" />
      </div>
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex gap-4 mt-3")}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "flex-1 space-y-1.5")}>
            <div className="h-2.5 w-16 bg-muted/20 rounded" />
            <div className="h-6 w-10 bg-muted/30 rounded" />
            <div className="h-1 bg-muted/20 rounded-full" />
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExpedientesUltimaCapturaCard({
  resumo,
  isLoading,
  onClick,
}: ExpedientesUltimaCapturaCardProps) {
  if (isLoading) return <UltimaCapturaCardSkeleton />;

  if (!resumo) {
    return (
      <GlassPanel depth={1} className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3.5 padding direcional sem Inset equiv. */ "px-4 py-3.5 opacity-50")}>
        <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50")}>
          ÚLTIMA CAPTURA
        </p>
        <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground/60 mt-1")}>Nenhuma captura realizada</p>
      </GlassPanel>
    );
  }

  const tempoRelativo = formatDistanceToNow(parseISO(resumo.concluidoEm), {
    locale: ptBR,
    addSuffix: true,
  });

  const pctCriados = resumo.total > 0 ? Math.round((resumo.totalCriados / resumo.total) * 100) : 0;
  const pctAtualizados = resumo.total > 0 ? Math.round((resumo.totalAtualizados / resumo.total) * 100) : 0;

  return (
    <GlassPanel
      depth={1}
      className={cn(
        /* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3.5 padding direcional sem Inset equiv. */ 'px-4 py-3.5 cursor-pointer select-none',
        'transition-all duration-200 hover:scale-[1.01] hover:shadow-lg',
        'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none',
      )}
      onClick={() => onClick(resumo.capturaId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(resumo.capturaId);
        }
      }}
      aria-label={`Ver ${resumo.total} expedientes da captura #${resumo.capturaId}`}
    >
      {/* Glow atmosférico */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-info/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-start justify-between gap-2")}>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 min-w-0")}>
          <IconContainer size="md" className="bg-info/8 shrink-0">
            <Radar className="size-4 text-info/70" />
          </IconContainer>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60")}>
              ÚLTIMA CAPTURA
            </p>
            <p className={cn(/* design-system-escape: leading-tight sem token DS */ "text-[10px] text-info/70 leading-tight")}>{tempoRelativo}</p>
          </div>
        </div>
        <ArrowRight className="size-3 text-info/50 shrink-0 mt-1" />
      </div>

      {/* Métricas */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex gap-4 mt-3")}>
        <MetricColumn
          label="Criados"
          value={resumo.totalCriados}
          barColor="bg-success/40"
          barWidth={pctCriados}
        />
        <MetricColumn
          label="Atualizados"
          value={resumo.totalAtualizados}
          barColor="bg-info/40"
          barWidth={pctAtualizados}
        />
        <MetricColumn
          label="Total"
          value={resumo.total}
          barColor="bg-muted/40"
          barWidth={100}
        />
      </div>

      {/* Footer */}
      <p className="text-[9px] tabular-nums text-muted-foreground/45 mt-2 truncate">
        #{resumo.capturaId} · {resumo.tipoCaptura} · Clique para ver expedientes
      </p>
    </GlassPanel>
  );
}
