'use client';

/**
 * ViewSwitcher - Componente para alternar entre visualizações temporais
 *
 * Usado em módulos que possuem múltiplas visualizações de dados temporais
 * (semana, mês, ano, lista). Baseado no Tabs do shadcn/ui.
 *
 * @example
 * ```tsx
 * <ViewSwitcher
 *   value={visualizacao}
 *   onValueChange={setVisualizacao}
 *   views={[
 *     { value: 'semana', label: 'Semana' },
 *     { value: 'mes', label: 'Mês' },
 *     { value: 'ano', label: 'Ano' },
 *     { value: 'lista', label: 'Lista' },
 *   ]}
 * />
 * ```
 */

import * as React from 'react';
import { Calendar, CalendarDays, CalendarRange, List } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// =============================================================================
// TIPOS
// =============================================================================

export type ViewType = 'semana' | 'mes' | 'ano' | 'lista';

export interface ViewOption {
  value: ViewType;
  label: string;
  icon?: React.ReactNode;
}

export interface ViewSwitcherProps {
  /** Visualização atual selecionada */
  value: ViewType;
  /** Callback quando a visualização muda */
  onValueChange: (value: ViewType) => void;
  /** Array de visualizações disponíveis */
  views?: ViewOption[];
  /** Classes CSS adicionais */
  className?: string;
  /** Mostrar ícones junto aos labels (default: false em mobile, true em desktop) */
  showIcons?: boolean;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const DEFAULT_ICONS: Record<ViewType, React.ReactNode> = {
  semana: <CalendarDays className="h-4 w-4" />,
  mes: <CalendarRange className="h-4 w-4" />,
  ano: <Calendar className="h-4 w-4" />,
  lista: <List className="h-4 w-4" />,
};

const DEFAULT_VIEWS: ViewOption[] = [
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'ano', label: 'Ano' },
  { value: 'lista', label: 'Lista' },
];

// =============================================================================
// COMPONENTE
// =============================================================================

export function ViewSwitcher({
  value,
  onValueChange,
  views = DEFAULT_VIEWS,
  className,
  showIcons = false,
}: ViewSwitcherProps) {
  // Use React.useId() to generate stable IDs for hydration
  const tabsId = React.useId();

  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as ViewType)}
      className={className}
      id={tabsId}
    >
      <TabsList>
        {views.map((view) => {
          const icon = view.icon ?? DEFAULT_ICONS[view.value];
          return (
            <TabsTrigger
              key={view.value}
              value={view.value}
              className={cn(
                'gap-1.5',
                showIcons && 'px-3'
              )}
            >
              {showIcons && icon}
              <span className={cn(showIcons && 'hidden sm:inline')}>
                {view.label}
              </span>
              {showIcons && (
                <span className="sm:hidden">{view.label}</span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

// =============================================================================
// EXPORTS AUXILIARES
// =============================================================================

export { DEFAULT_VIEWS, DEFAULT_ICONS };
