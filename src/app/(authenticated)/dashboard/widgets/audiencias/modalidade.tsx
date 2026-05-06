'use client';

/**
 * Widget: Distribuicao por Modalidade
 * ============================================================================
 * Conectado ao hook useDashboard() -> data.audiencias.porModalidade.
 * Exibe donut centralizado com total no centro e legenda abaixo.
 *
 * Uso:
 *   import { ModalidadeDistribution } from '@/app/(authenticated)/dashboard/widgets/audiencias/modalidade'
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import {
  WidgetContainer,
  MiniDonut,
  fmtNum,
} from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario } from '../../hooks';
import { tokenForTone } from '@/lib/design-system';
import { ToneDot } from '@/components/ui/tone-dot';

export function ModalidadeDistribution() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (error || !data) {
    return <WidgetSkeleton size="md" />;
  }

  const audiencias = isDashboardUsuario(data)
    ? data.audiencias
    : null;

  if (!audiencias) return <WidgetSkeleton size="md" />;

  const porModalidade = audiencias.porModalidade;

  if (!porModalidade || porModalidade.length === 0) {
    return (
      <WidgetContainer
        title="Por Modalidade"
        icon={MapPin}
        subtitle="Distribuicao de formatos"
      >
        <div className={cn("flex flex-col items-center justify-center py-6 inline-tight")}>
          <MapPin className="size-8 text-muted-foreground/45" />
          <p className="text-[11px] text-muted-foreground/60 text-center">
            Dados de modalidade indisponiveis
          </p>
        </div>
      </WidgetContainer>
    );
  }

  const total = porModalidade.reduce((acc, m) => acc + m.count, 0);

  const segments = porModalidade.map((m) => ({
    value: m.count,
    color: tokenForTone(m.tone),
    label: m.modalidade,
  }));

  return (
    <WidgetContainer
      title="Por Modalidade"
      icon={MapPin}
      subtitle="Distribuicao de formatos"
    >
      <div className={cn("flex flex-col items-center inline-default")}>
        <MiniDonut
          segments={segments}
          size={90}
          strokeWidth={12}
          centerLabel={fmtNum(total)}
        />

        {/* Legend */}
        <div className={cn("flex flex-col w-full stack-snug")}>
          {porModalidade.map((m) => {
            const pct = total > 0 ? ((m.count / total) * 100).toFixed(1) : '0';
            return (
              <div
                key={m.modalidade}
                className="flex items-center justify-between text-[11px]"
              >
                <div className={cn("flex items-center inline-tight min-w-0")}>
                  <ToneDot tone={m.tone} size="lg" aria-label={m.modalidade} />
                  <span className="text-muted-foreground/70 truncate">
                    {m.modalidade}
                  </span>
                </div>
                <div className={cn("flex items-center inline-tight shrink-0")}>
                  <span className={cn( "font-medium tabular-nums")}>
                    {fmtNum(m.count)}
                  </span>
                  <span className="text-muted-foreground/50 text-[10px] tabular-nums w-10 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetContainer>
  );
}
