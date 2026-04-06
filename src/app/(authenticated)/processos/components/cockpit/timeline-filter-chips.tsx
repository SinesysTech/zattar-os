'use client';

import { FileText, Scale, ArrowUpRight, Mail, Calendar, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineFilterType } from './types';
import type { GrauProcesso } from '@/app/(authenticated)/partes';

interface FilterChip {
  id: TimelineFilterType;
  label: string;
  icon: typeof FileText;
}

const FILTER_CHIPS: FilterChip[] = [
  { id: 'todos', label: 'Todos', icon: Layers },
  { id: 'documentos', label: 'Docs', icon: FileText },
  { id: 'decisoes', label: 'Decisões', icon: Scale },
  { id: 'recursos', label: 'Recursos', icon: ArrowUpRight },
  { id: 'citacoes', label: 'Citações', icon: Mail },
  { id: 'audiencias', label: 'Aud.', icon: Calendar },
];

interface TimelineFilterChipsProps {
  counts: { docs: number; movs: number; total: number };
  activeFilter: TimelineFilterType;
  onFilterChange: (filter: TimelineFilterType) => void;
  graus?: GrauProcesso[];
  activeGrau?: GrauProcesso | 'todos';
  onGrauChange?: (grau: GrauProcesso | 'todos') => void;
}

const GRAU_LABELS: Record<string, string> = {
  todos: 'Todos',
  primeiro_grau: '1º',
  segundo_grau: '2º',
  tribunal_superior: 'TST',
};

export function TimelineFilterChips({
  counts,
  activeFilter,
  onFilterChange,
  graus,
  activeGrau = 'todos',
  onGrauChange,
}: TimelineFilterChipsProps) {
  const showGrauFilter = graus && graus.length > 1;

  return (
    <div className="flex-none border-b px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3" />
            {counts.docs} {counts.docs === 1 ? 'doc' : 'docs'}
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span>{counts.movs} {counts.movs === 1 ? 'mov' : 'movs'}</span>
        </div>
        <kbd className="flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          <span className="text-[9px]">&#x2318;</span>K
        </kbd>
      </div>

      <div className="flex gap-1 p-0.5 rounded-lg bg-border/6 overflow-x-auto" role="tablist">
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeFilter === chip.id;
          const Icon = chip.icon;
          return (
            <button
              key={chip.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(chip.id)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-primary/12 text-primary shadow-sm'
                  : 'text-muted-foreground/50 hover:text-muted-foreground/70 hover:bg-white/4'
              )}
            >
              <Icon className="size-3" />
              {chip.label}
            </button>
          );
        })}
      </div>

      {showGrauFilter && onGrauChange && (
        <div className="flex gap-1 p-0.5 rounded-md bg-border/4 w-fit" role="tablist" aria-label="Filtro de grau">
          {(['todos', ...graus] as const).map((grau) => {
            const isActive = activeGrau === grau;
            return (
              <button
                key={grau}
                role="tab"
                aria-selected={isActive}
                onClick={() => onGrauChange(grau as GrauProcesso | 'todos')}
                className={cn(
                  'px-2 py-0.5 rounded text-[9px] font-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground/40 hover:text-muted-foreground/60'
                )}
              >
                {GRAU_LABELS[grau] || grau}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
