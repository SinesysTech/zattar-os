'use client';

/**
 * WidgetCasosTribunal -- Widget conectado
 * Fonte: useDashboard()
 *   - role=user: data.processos.porTRT
 *   - role=admin: data.processos.porTRT
 */

import { Scale } from 'lucide-react';
import { WidgetContainer } from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, isDashboardUsuario, isDashboardAdmin } from '../../hooks';

export function WidgetCasosTribunal() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton />;

  if (!data) {
    return (
      <WidgetContainer
        title="Casos por Tribunal"
        icon={Scale}
        subtitle="Top 5 TRTs -- volume atual"
        depth={1}
      >
        <p className="text-xs text-muted-foreground">
          Nao foi possivel carregar os dados processuais.
        </p>
      </WidgetContainer>
    );
  }

  let porTRT: { trt: string; count: number }[] = [];

  if (isDashboardUsuario(data)) {
    porTRT = data.processos.porTRT;
  } else {
    return null;
  }

  // Top 5, sorted descending
  const top5 = [...porTRT]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxValue = top5.length > 0 ? top5[0].count : 1;

  return (
    <WidgetContainer
      title="Casos por Tribunal"
      icon={Scale}
      subtitle="Top 5 TRTs -- volume atual"
      depth={1}
    >
      <div className="flex flex-col gap-2.5">
        {top5.map((trt) => {
          const pct = Math.round((trt.count / maxValue) * 100);
          return (
            <div key={trt.trt}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground/70 truncate leading-none">
                  {trt.trt}
                </span>
                <span className="text-[10px] font-semibold tabular-nums ml-2 shrink-0">
                  {trt.count}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/50 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {top5.length === 0 && (
          <p className="text-[10px] text-muted-foreground/60">
            Nenhum tribunal registrado.
          </p>
        )}
      </div>
    </WidgetContainer>
  );
}
