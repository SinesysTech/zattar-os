'use client';

import { cn } from '@/lib/utils';
import { useGazetteStore } from './hooks/use-gazette-store';
import type { GazetteInsight } from '@/app/(authenticated)/captura/comunica-cnj/domain';

const TIPO_STYLES: Record<
  GazetteInsight['tipo'],
  { card: string; title: string; label: string }
> = {
  padrao: {
    card: 'bg-primary/[0.04] border-primary/10',
    title: 'text-primary',
    label: 'Padrão',
  },
  atencao: {
    card: 'bg-warning/[0.04] border-warning/10',
    title: 'text-warning',
    label: 'Atenção',
  },
  relatorio: {
    card: 'bg-success/[0.04] border-success/10',
    title: 'text-success',
    label: 'Relatório',
  },
};

export function GazetteAiInsights() {
  const { insights } = useGazetteStore();

  if (insights.length === 0) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-2">
      {/* AI Badge */}
      <div className="flex shrink-0 items-center justify-center rounded px-2 py-1 bg-primary/10">
        <span className="text-[10px] font-semibold leading-none text-primary">AI</span>
      </div>

      {/* Scrollable insights row */}
      <div className="flex flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {insights.map((insight, index) => {
          const styles = TIPO_STYLES[insight.tipo];
          return (
            <div
              key={index}
              className={cn(
                'shrink-0 cursor-default rounded-lg border p-3 transition-transform duration-150 hover:-translate-y-px',
                styles.card,
              )}
              style={{ minWidth: 220, maxWidth: 280 }}
            >
              <p className={cn('text-[11px] font-medium leading-none', styles.title)}>
                {insight.titulo}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-muted-foreground/40">
                {insight.descricao}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
