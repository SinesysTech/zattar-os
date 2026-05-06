'use client';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mic2, ArrowRight } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { AnimatedNumber } from '@/app/(authenticated)/dashboard/widgets/primitives';
import { cn } from '@/lib/utils';
import type { ResumoUltimaCapturaAudiencias } from '../domain';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AudienciasUltimaCapturaCardProps {
  resumo: ResumoUltimaCapturaAudiencias | null;
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
      <p className="text-meta-label text-muted-foreground/70 truncate">
        {label}
      </p>
      <p className="text-kpi-value leading-none mt-1 text-foreground font-display">
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
      <div className={cn("flex items-start justify-between inline-tight")}>
        <div className="h-4 w-28 bg-muted/30 rounded" />
        <div className="size-8 bg-muted/20 rounded-lg" />
      </div>
      <div className={cn("flex inline-default mt-3")}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn("flex-1 stack-snug")}>
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

export function AudienciasUltimaCapturaCard({
  resumo,
  isLoading,
  onClick,
}: AudienciasUltimaCapturaCardProps) {
  if (isLoading) return <UltimaCapturaCardSkeleton />;

  if (!resumo) {
    return (
      <GlassPanel depth={1} className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3.5 padding direcional sem Inset equiv. */ "px-4 py-3.5 opacity-50")}>
        <p className="text-meta-label text-muted-foreground/70">
          ÚLTIMA CAPTURA
        </p>
        <p className={cn("text-body-sm text-muted-foreground/60 mt-1")}>Nenhuma captura de audiências realizada</p>
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
      aria-label={`Ver ${resumo.total} audiências da captura #${resumo.capturaId}`}
    >
      {/* Glow atmosférico */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-warning/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className={cn("flex items-start justify-between inline-tight")}>
        <div className={cn("flex items-center inline-tight min-w-0")}>
          <IconContainer size="md" className="bg-warning/8 shrink-0">
            <Mic2 className="size-4 text-warning/70" />
          </IconContainer>
          <div className="min-w-0">
            <p className="text-meta-label text-muted-foreground/60">
              ÚLTIMA CAPTURA
            </p>
            <p className="text-micro-caption text-warning/70 leading-tight">{tempoRelativo}</p>
          </div>
        </div>
        <ArrowRight className="size-3 text-warning/50 shrink-0 mt-1" />
      </div>

      {/* Métricas */}
      <div className={cn("flex inline-default mt-3")}>
        <MetricColumn
          label="Criadas"
          value={resumo.totalCriados}
          barColor="bg-success/40"
          barWidth={pctCriados}
        />
        <MetricColumn
          label="Atualizadas"
          value={resumo.totalAtualizados}
          barColor="bg-warning/40"
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
      <p className="text-[9px] tabular-nums text-muted-foreground/65 mt-2 truncate">
        #{resumo.capturaId} · {resumo.tipoCaptura} · Clique para ver audiências
      </p>
    </GlassPanel>
  );
}
