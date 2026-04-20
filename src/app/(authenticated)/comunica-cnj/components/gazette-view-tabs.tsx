'use client';

import { LayoutGrid, LayoutList, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGazetteStore } from './hooks/use-gazette-store';

const VIEWS: ReadonlyArray<{
  id: string;
  label: string;
  showCount?: boolean;
}> = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendentes', label: 'Pendentes' },
  { id: 'orfaos', label: 'Órfãos', showCount: true },
  { id: 'prazos', label: 'Prazos' },
  { id: 'meus-processos', label: 'Meus Processos' },
];

const DENSIDADES = [
  { id: 'compacto', label: 'Compacto' },
  { id: 'padrao', label: 'Padrão' },
  { id: 'confortavel', label: 'Confort.' },
] as const;

export function GazetteViewTabs() {
  const viewAtiva = useGazetteStore((s) => s.viewAtiva);
  const setViewAtiva = useGazetteStore((s) => s.setViewAtiva);
  const metricas = useGazetteStore((s) => s.metricas);
  const modoVisualizacao = useGazetteStore((s) => s.modoVisualizacao);
  const setModoVisualizacao = useGazetteStore((s) => s.setModoVisualizacao);
  const densidade = useGazetteStore((s) => s.densidade);
  const setDensidade = useGazetteStore((s) => s.setDensidade);

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-2">
      {/* Left — View tab pills */}
      <div className="flex items-center gap-1">
        {VIEWS.map((view) => {
          const isActive = viewAtiva === view.id;
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => setViewAtiva(view.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              <span className="flex items-center gap-1.5">
                {view.label}
                {view.showCount && metricas && (
                  <span className="text-[9px] px-1.5 bg-warning/10 text-warning rounded-full tabular-nums">
                    {metricas.orfaos}
                  </span>
                )}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/40 hover:border-border/60 transition-colors"
        >
          <span className="flex items-center gap-1">
            <Plus className="size-3" />
            View
          </span>
        </button>
      </div>

      {/* Right — Controls */}
      <div className="flex items-center gap-2">
        {/* Mode toggle */}
        <div className="flex items-center p-0.5 bg-muted/30 rounded-md">
          <button
            type="button"
            onClick={() => setModoVisualizacao('tabela')}
            className={cn(
              'p-1.5 rounded-sm transition-all',
              modoVisualizacao === 'tabela'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title="Tabela"
          >
            <LayoutList className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setModoVisualizacao('cards')}
            className={cn(
              'p-1.5 rounded-sm transition-all',
              modoVisualizacao === 'cards'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title="Cards"
          >
            <LayoutGrid className="size-3.5" />
          </button>
        </div>

        {/* Density toggle */}
        <div className="flex items-center p-0.5 bg-muted/30 rounded-md">
          {DENSIDADES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDensidade(d.id)}
              className={cn(
                'px-2.5 py-1 rounded-sm text-[10px] font-medium transition-all',
                densidade === d.id
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
