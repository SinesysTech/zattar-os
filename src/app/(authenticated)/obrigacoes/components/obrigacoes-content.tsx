'use client';

/**
 * ObrigacoesContent - Orquestrador da página de obrigações
 *
 * Thin router que delega para wrappers auto-contidos:
 * - lista  → ObrigacoesTableWrapper
 * - semana → ObrigacoesTableWrapper (com WeekNavigator)
 * - mês    → ObrigacoesMonthWrapper
 * - ano    → ObrigacoesYearWrapper
 *
 * Gerencia:
 * - Routing por URL (sync visualização ↔ pathname)
 * - ViewModePopover (seletor de view compartilhado)
 * - Pulse Strip (KPIs) e Alertas no topo
 */

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';

import {
  ViewModePopover,
  useWeekNavigator,
  type ViewType,
} from '@/components/shared';

import { useResumoObrigacoes } from '../hooks/use-resumo-obrigacoes';
import { ObrigacoesPulseStrip } from './shared/obrigacoes-pulse-strip';
import { AlertasObrigacoes } from './shared/alertas-obrigacoes';
import { ObrigacoesTableWrapper } from './table/obrigacoes-table-wrapper';
import { ObrigacoesMonthWrapper } from './calendar/obrigacoes-month-wrapper';
import { ObrigacoesYearWrapper } from './calendar/obrigacoes-year-wrapper';
import type { AlertasObrigacoesType } from '../domain';
import type { ResumoObrigacoesDB } from '../repository';

// =============================================================================
// MAPEAMENTO URL -> VIEW
// =============================================================================

const VIEW_ROUTES: Record<ViewType, string> = {
  semana: '/obrigacoes/semana',
  mes: '/obrigacoes/mes',
  ano: '/obrigacoes/ano',
  lista: '/obrigacoes/lista',
  quadro: '/obrigacoes/quadro',
};

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/obrigacoes': 'semana',
  '/obrigacoes/semana': 'semana',
  '/obrigacoes/mes': 'mes',
  '/obrigacoes/ano': 'ano',
  '/obrigacoes/lista': 'lista',
};

interface ObrigacoesContentProps {
  visualizacao?: ViewType;
  /** Resumo pré-buscado no server (elimina flash de skeleton no primeiro render). */
  initialResumo?: ResumoObrigacoesDB | null;
}

export function ObrigacoesContent({
  visualizacao: initialView = 'semana',
  initialResumo,
}: ObrigacoesContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;

  const [visualizacao, setVisualizacao] = React.useState<ViewType>(viewFromUrl);

  React.useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView && newView !== visualizacao) {
      setVisualizacao(newView);
    }
  }, [pathname, visualizacao]);

  const weekNav = useWeekNavigator();

  const handleVisualizacaoChange = React.useCallback(
    (value: string) => {
      const viewValue = value as ViewType;
      const targetRoute = VIEW_ROUTES[viewValue];
      if (targetRoute && targetRoute !== pathname) {
        router.push(targetRoute);
      }
      setVisualizacao(viewValue);
    },
    [pathname, router],
  );

  // Resumo (KPIs + Alertas) — initialResumo vem do server pra pular fetch inicial
  const { data: resumo, isLoading: isResumoLoading } = useResumoObrigacoes({
    initialData: initialResumo,
  });

  // Adapta resumo -> AlertasObrigacoesType (shape esperado pelo componente)
  const alertas: AlertasObrigacoesType | null = React.useMemo(() => {
    if (!resumo) return null;
    return {
      vencidas: { ...resumo.vencidas, items: [] },
      vencendoHoje: { ...resumo.vencendoHoje, items: [] },
      vencendoEm7Dias: { ...resumo.vencendoEm7Dias, items: [] },
      inconsistentes: { quantidade: resumo.inconsistentes.quantidade, items: [] },
    };
  }, [resumo]);

  const viewModePopover = (
    <ViewModePopover
      value={visualizacao}
      onValueChange={handleVisualizacaoChange}
    />
  );

  const renderContent = () => {
    switch (visualizacao) {
      case 'lista':
        return <ObrigacoesTableWrapper viewModeSlot={viewModePopover} />;

      case 'semana':
        return (
          <ObrigacoesTableWrapper
            fixedDate={weekNav.selectedDate}
            hideDateFilters={true}
            viewModeSlot={viewModePopover}
            weekNavigatorProps={{
              weekDays: weekNav.weekDays,
              selectedDate: weekNav.selectedDate,
              onDateSelect: weekNav.setSelectedDate,
              onPreviousWeek: weekNav.goToPreviousWeek,
              onNextWeek: weekNav.goToNextWeek,
              onToday: weekNav.goToToday,
              isCurrentWeek: weekNav.isCurrentWeek,
            }}
          />
        );

      case 'mes':
        return <ObrigacoesMonthWrapper viewModeSlot={viewModePopover} />;

      case 'ano':
        return <ObrigacoesYearWrapper viewModeSlot={viewModePopover} />;

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <ObrigacoesPulseStrip resumo={resumo} isLoading={isResumoLoading} />
      <AlertasObrigacoes alertas={alertas} isLoading={isResumoLoading} />

      <div className="flex-1 min-h-0">{renderContent()}</div>
    </div>
  );
}
