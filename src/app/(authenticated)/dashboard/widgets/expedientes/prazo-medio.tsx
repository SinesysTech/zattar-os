'use client';

/**
 * Widget: Prazo Medio — Expedientes
 * ============================================================================
 * Sparkline de tendencia de prazo medio semanal + stat principal.
 * Usa data.expedientes.prazoMedio (array de medias semanais) e tempoRespostaMedio.
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import {
  Sparkline,
  Stat,
  WidgetContainer,
} from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';

export function PrazoMedio() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="sm" />;

  if (error || !data) {
    return <WidgetSkeleton size="sm" />;
  }

  const expedientes =
    data.role === 'user'
      ? data.expedientes
      : null;

  const prazoMedio = (expedientes as { prazoMedio?: number[] } | null)?.prazoMedio;
  const tempoResposta = (expedientes as { tempoRespostaMedio?: number } | null)?.tempoRespostaMedio;

  if (!prazoMedio || prazoMedio.length === 0) {
    return (
      <WidgetContainer
        title="Prazo Medio"
        icon={Clock}
        subtitle="Tendencia semanal"
        depth={1}
        className={cn(/* design-system-escape: p-4! → usar <Inset> */ "h-auto! self-start p-4!")}
      >
        <p className={cn(/* design-system-escape: py-6 padding direcional sem Inset equiv. */ "text-[11px] text-muted-foreground/60 py-6 text-center")}>
          Dados de prazo medio nao disponiveis.
        </p>
      </WidgetContainer>
    );
  }

  const current = prazoMedio[prazoMedio.length - 1];
  const weekAgo = prazoMedio.length >= 8 ? prazoMedio[prazoMedio.length - 8] : prazoMedio[0];
  const diff = current - weekAgo;
  const diffSign = diff > 0 ? '+' : '';
  const deltaType: 'positive' | 'negative' | 'neutral' =
    diff < 0 ? 'positive' : diff > 0 ? 'negative' : 'neutral';

  const minVal = Math.min(...prazoMedio);
  const maxVal = Math.max(...prazoMedio);
  const avgVal = prazoMedio.reduce((s, v) => s + v, 0) / prazoMedio.length;

  const isAlert = current > avgVal * 1.2;

  return (
    <WidgetContainer
      title="Prazo Medio"
      icon={Clock}
      subtitle="Tendencia semanal (dias)"
      depth={1}
      className={cn(/* design-system-escape: p-4! → usar <Inset> */ "h-auto! self-start p-4!")}
    >
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-start gap-4 mt-1")}>
        <div className="flex-1">
          <Stat
            label="Media Atual"
            value={`${current.toFixed(1)}d`}
            delta={`${diffSign}${diff.toFixed(1)}d vs 8 sem. atras`}
            deltaType={deltaType}
          />

          {tempoResposta !== undefined && (
            <div className="mt-2">
              <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/50 uppercase tracking-wider")}>
                Tempo Resposta
              </p>
              <p className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "font-display text-body-sm font-bold mt-0.5")}>
                {tempoResposta}d
              </p>
            </div>
          )}
        </div>

        <div className={cn(/* design-system-escape: pt-2 padding direcional sem Inset equiv. */ "pt-2")}>
          <Sparkline
            data={prazoMedio}
            alert={isAlert}
            width={100}
            height={32}
          />
        </div>
      </div>

      <div className={cn(/* design-system-escape: pt-2.5 padding direcional sem Inset equiv. */ "mt-3 flex items-center justify-between border-t border-border/10 pt-2.5")}>
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex gap-4")}>
          <div>
            <span className="text-[8px] text-muted-foreground/50 uppercase">Min</span>
            <p className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-[11px] font-bold tabular-nums")}>{minVal.toFixed(1)}d</p>
          </div>
          <div>
            <span className="text-[8px] text-muted-foreground/50 uppercase">Media</span>
            <p className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-[11px] font-bold tabular-nums")}>{avgVal.toFixed(1)}d</p>
          </div>
          <div>
            <span className="text-[8px] text-muted-foreground/50 uppercase">Max</span>
            <p className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-[11px] font-bold tabular-nums")}>{maxVal.toFixed(1)}d</p>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
}
