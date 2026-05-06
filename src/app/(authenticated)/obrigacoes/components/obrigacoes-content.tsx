'use client';

/**
 * ObrigacoesContent - Orquestrador da página de obrigações
 *
 * Padrão alinhado com Expedientes/Audiências/Partes:
 * - Header com título + subtítulo + botão "Nova" à direita
 * - Pulse Strip (KPIs)
 * - Insight Banners (Alertas)
 * - Controls Row: FilterBar + SearchInput + ViewToggle (à direita)
 * - Main content: switch por viewMode
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  CalendarDays,
  CalendarRange,
  Calendar,
  List,
  Plus,
} from 'lucide-react';

import { useWeekNavigator, type ViewType } from '@/components/shared';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/typography';

import { useResumoObrigacoes } from '../hooks/use-resumo-obrigacoes';
import type { ResumoObrigacoesDB } from '../repository';

import { ObrigacoesPulseStrip } from './shared/obrigacoes-pulse-strip';
import {
  ObrigacoesFilterBar,
  type ObrigacoesFilterBarFilters,
} from './shared/obrigacoes-filter-bar';
import { ObrigacoesTableWrapper } from './table/obrigacoes-table-wrapper';
import { ObrigacoesSemanaWrapper } from './shared/obrigacoes-semana-wrapper';
import { ObrigacoesMonthWrapper } from './calendar/obrigacoes-month-wrapper';
import { ObrigacoesYearWrapper } from './calendar/obrigacoes-year-wrapper';
import { NovaObrigacaoDialog } from './dialogs/nova-obrigacao-dialog';

// =============================================================================
// ROTAS E VIEW OPTIONS
// =============================================================================

const VIEW_ROUTES: Record<ViewType, string> = {
  semana: '/obrigacoes/semana',
  mes: '/obrigacoes/mes',
  ano: '/obrigacoes/ano',
  lista: '/obrigacoes/lista',
  quadro: '/obrigacoes/quadro',
};

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/obrigacoes': 'lista',
  '/obrigacoes/semana': 'semana',
  '/obrigacoes/mes': 'mes',
  '/obrigacoes/ano': 'ano',
  '/obrigacoes/lista': 'lista',
};

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'lista', label: 'Lista', icon: List },
  { id: 'semana', label: 'Semana', icon: CalendarDays },
  { id: 'mes', label: 'Mês', icon: CalendarRange },
  { id: 'ano', label: 'Ano', icon: Calendar },
];

// =============================================================================
// TYPES
// =============================================================================

interface ObrigacoesContentProps {
  visualizacao?: ViewType;
  initialResumo?: ResumoObrigacoesDB | null;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ObrigacoesContent({
  visualizacao: initialView = 'lista',
  initialResumo,
}: ObrigacoesContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;
  const [viewMode, setViewMode] = React.useState<ViewType>(viewFromUrl);

  React.useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView && newView !== viewMode) setViewMode(newView);
  }, [pathname, viewMode]);

  // Controls state (compartilhado entre views)
  const [busca, setBusca] = React.useState('');
  const [filters, setFilters] = React.useState<ObrigacoesFilterBarFilters>({
    status: 'todos',
    tipo: null,
    direcao: null,
  });
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [refreshCounter, setRefreshCounter] = React.useState(0);

  const weekNav = useWeekNavigator();

  const handleViewChange = React.useCallback(
    (view: string) => {
      const targetRoute = VIEW_ROUTES[view as ViewType];
      if (targetRoute && targetRoute !== pathname) router.push(targetRoute);
    },
    [pathname, router],
  );

  // Resumo (KPIs do Pulse Strip)
  const { data: resumo, isLoading: isResumoLoading, refetch: refetchResumo } =
    useResumoObrigacoes({ initialData: initialResumo });

  // Subtítulo dinâmico
  const subtitle = React.useMemo(() => {
    if (isResumoLoading) return 'Carregando...';
    if (!resumo) return 'Acordos, condenações, parcelas e repasses';
    const p = resumo.pendentesTotal.quantidade;
    const v = resumo.vencidas.quantidade;
    return `${p} pendente${p !== 1 ? 's' : ''} · ${v} vencida${v !== 1 ? 's' : ''}`;
  }, [isResumoLoading, resumo]);

  // Success handler
  const handleCreateSuccess = React.useCallback(() => {
    setIsCreateOpen(false);
    refetchResumo();
    setRefreshCounter((c) => c + 1);
  }, [refetchResumo]);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className={cn("flex flex-col stack-default-plus")}>
      {/* 1. Header */}
      <div className={cn("flex items-end justify-between inline-default")}>
        <div>
          <Heading level="page">Obrigações</Heading>
          <p
            className={cn("text-body-sm text-muted-foreground mt-0.5")}
            aria-live="polite"
          >
            {subtitle}
          </p>
        </div>

        <div className={cn("flex items-center inline-tight")}>
          <Button
            size="sm"
            className="rounded-xl"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="size-3.5" />
            Nova obrigação
          </Button>
        </div>
      </div>

      {/* 2. KPI Strip */}
      <ObrigacoesPulseStrip resumo={resumo} isLoading={isResumoLoading} />

      {/* 3. Controls Row: filters (esquerda) + search + view toggle (direita) */}
      <div className={cn("flex flex-col sm:flex-row items-start sm:items-center inline-medium")}>
        <ObrigacoesFilterBar filters={filters} onChange={setFilters} />
        <div className={cn("flex items-center inline-tight flex-1 justify-end")}>
          <SearchInput
            value={busca}
            onChange={setBusca}
            placeholder="Buscar obrigação, processo..."
          />
          <ViewToggle
            mode={viewMode}
            onChange={handleViewChange}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* 5. Content Switcher */}
      <main className="min-h-0 transition-opacity duration-300">
        {viewMode === 'lista' && (
          <ObrigacoesTableWrapper
            busca={busca}
            filters={filters}
            refreshCounter={refreshCounter}
          />
        )}

        {viewMode === 'semana' && (
          <ObrigacoesSemanaWrapper
            busca={busca}
            filters={filters}
            refreshCounter={refreshCounter}
            weekDate={weekNav.selectedDate}
            onWeekDateChange={weekNav.setSelectedDate}
          />
        )}

        {viewMode === 'mes' && (
          <ObrigacoesMonthWrapper busca={busca} filters={filters} />
        )}

        {viewMode === 'ano' && (
          <ObrigacoesYearWrapper busca={busca} filters={filters} />
        )}
      </main>

      {/* 6. Dialogs */}
      <NovaObrigacaoDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
