'use client';

/**
 * WidgetSegmento -- Widget conectado
 * Fonte: useDashboard()
 *   - data.processos.porSegmento (segmento/count/color)
 */

import { cn } from '@/lib/utils';
import { LayoutGrid } from 'lucide-react';
import {
  WidgetContainer,
  MiniDonut,
  StackedBar,
} from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario } from '../../hooks';
import { tokenForTone, type SemanticTone } from '@/lib/design-system';
import { ToneDot } from '@/components/ui/tone-dot';
import { Text } from '@/components/ui/typography';

export function WidgetSegmento() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer
        title="Por Segmento"
        icon={LayoutGrid}
        subtitle="Distribuicao por area juridica"
        depth={1}
      >
        <Text variant="caption">
          Nao foi possivel carregar os dados processuais.
        </Text>
      </WidgetContainer>
    );
  }

  let porSegmento: { segmento: string; count: number; tone: SemanticTone }[] | undefined;

  if (isDashboardUsuario(data)) {
    porSegmento = data.processos.porSegmento;
  } else {
    return null;
  }

  if (!porSegmento || porSegmento.length === 0) {
    return (
      <WidgetContainer
        title="Por Segmento"
        icon={LayoutGrid}
        subtitle="Distribuicao por area juridica"
        depth={1}
      >
        <p className="text-[10px] text-muted-foreground/60">
          Dados insuficientes para exibir segmentos.
        </p>
      </WidgetContainer>
    );
  }

  const segments = porSegmento.map((s) => ({
    value: s.count,
    color: tokenForTone(s.tone),
    label: s.segmento,
    tone: s.tone,
  }));

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const dominant = segments[0];

  return (
    <WidgetContainer
      title="Por Segmento"
      icon={LayoutGrid}
      subtitle="Distribuicao por area juridica"
      depth={1}
    >
      <div className={cn(/* design-system-escape: gap-5 gap sem token DS */ "flex items-center gap-5")}>
        <MiniDonut
          segments={segments}
          size={88}
          strokeWidth={11}
          centerLabel={total > 0 && dominant ? `${Math.round((dominant.value / total) * 100)}%` : '0%'}
        />
        <div className={cn("flex flex-col inline-tight flex-1 min-w-0")}>
          {segments.map((seg) => {
            const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
            return (
              <div key={seg.label} className={cn("flex items-center inline-tight")}>
                <ToneDot tone={seg.tone} aria-label={seg.label} />
                <span className="text-[10px] text-muted-foreground/60 flex-1 truncate">
                  {seg.label}
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground/50">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "mt-3 pt-3 border-t border-border/10")}>
        <StackedBar segments={segments} height={8} />
      </div>
    </WidgetContainer>
  );
}
