'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { addDays, subDays } from 'date-fns';
import {
  CalendarDays,
  CalendarRange,
  Calendar,
  List,
} from 'lucide-react';

import {
  DaysCarousel,
  MonthsCarousel,
  YearsCarousel,
  TemporalViewLoading,
} from '@/components/shared';
import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';

import { ResumoCards } from './shared/resumo-cards';
import { AlertasObrigacoes } from './shared/alertas-obrigacoes';
import { ObrigacoesTableWrapper } from './table/obrigacoes-table-wrapper';
import { ObrigacoesCalendarMonth } from './calendar/obrigacoes-calendar-month';
import { ObrigacoesCalendarYear } from './calendar/obrigacoes-calendar-year';
import { ViewType } from '../domain';

// =============================================================================
// MAPEAMENTO URL -> VIEW
// =============================================================================

const VIEW_ROUTES: Record<ViewType, string> = {
  semana: '/acordos-condenacoes/semana',
  mes: '/acordos-condenacoes/mes',
  ano: '/acordos-condenacoes/ano',
  lista: '/acordos-condenacoes/lista',
};

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/acordos-condenacoes': 'semana',
  '/acordos-condenacoes/semana': 'semana',
  '/acordos-condenacoes/mes': 'mes',
  '/acordos-condenacoes/ano': 'ano',
  '/acordos-condenacoes/lista': 'lista',
};

// =============================================================================
// TABS CONFIGURAÇÃO
// =============================================================================

const TABS_CONFIG = [
  { value: 'semana' as ViewType, label: 'Semana', icon: CalendarDays },
  { value: 'mes' as ViewType, label: 'Mês', icon: CalendarRange },
  { value: 'ano' as ViewType, label: 'Ano', icon: Calendar },
  { value: 'lista' as ViewType, label: 'Lista', icon: List },
];

const TABS_UI = TABS_CONFIG.map((tab) => {
  const Icon = tab.icon;
  return {
    value: tab.value,
    label: tab.label,
    icon: <Icon />,
  };
});

// =============================================================================
// PROPS
// =============================================================================

interface ObrigacoesContentProps {
  visualizacao?: ViewType;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ObrigacoesContent({ visualizacao: initialView = 'semana' }: ObrigacoesContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Derive view from URL pathname
  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;

  // View State - sync with URL
  const [visualizacao, setVisualizacao] = React.useState<ViewType>(viewFromUrl);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  
  // Loading State
  const [isLoading, setIsLoading] = React.useState(false);

  // Sync view state when URL changes
  React.useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView && newView !== visualizacao) {
      setVisualizacao(newView);
    }
  }, [pathname, visualizacao]);

  // Handle visualization change
  const handleVisualizacaoChange = React.useCallback((value: string) => {
    const viewValue = value as ViewType;
    const targetRoute = VIEW_ROUTES[viewValue];
    if (targetRoute && targetRoute !== pathname) {
      router.push(targetRoute);
    }
    setVisualizacao(viewValue);
  }, [pathname, router]);

  // =============================================================================
  // NAVEGAÇÃO POR DIA/SEMANA
  // =============================================================================
  const visibleDays = 21;

  const [startDate, setStartDate] = React.useState(() => {
    const offset = Math.floor(visibleDays / 2);
    return subDays(new Date(), offset);
  });

  const handlePreviousDay = React.useCallback(() => {
    setStartDate(prev => subDays(prev, 1));
  }, []);

  const handleNextDay = React.useCallback(() => {
    setStartDate(prev => addDays(prev, 1));
  }, []);

  // =============================================================================
  // NAVEGAÇÃO POR MÊS
  // =============================================================================
  const visibleMonths = 12;

  const [startMonth, setStartMonth] = React.useState(() => {
    const offset = Math.floor(visibleMonths / 2);
    return new Date(new Date().getFullYear(), new Date().getMonth() - offset, 1);
  });

  const handlePreviousMonth = React.useCallback(() => {
    setStartMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = React.useCallback(() => {
    setStartMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  // =============================================================================
  // NAVEGAÇÃO POR ANO
  // =============================================================================
  const visibleYears = 20;

  const [startYear, setStartYear] = React.useState(() => {
    const offset = Math.floor(visibleYears / 2);
    return new Date().getFullYear() - offset;
  });

  const handlePreviousYear = React.useCallback(() => {
    setStartYear(prev => prev - 1);
  }, []);

  const handleNextYear = React.useCallback(() => {
    setStartYear(prev => prev + 1);
  }, []);

  // =============================================================================
  // CARROSSEL BASEADO NA VISUALIZAÇÃO
  // =============================================================================

  const renderCarousel = () => {
    switch (visualizacao) {
      case 'semana':
        return (
          <DaysCarousel
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            startDate={startDate}
            onPrevious={handlePreviousDay}
            onNext={handleNextDay}
            visibleDays={visibleDays}
          />
        );
      case 'mes':
        return (
          <MonthsCarousel
            selectedDate={currentDate}
            onDateSelect={setCurrentDate}
            startMonth={startMonth}
            onPrevious={handlePreviousMonth}
            onNext={handleNextMonth}
            visibleMonths={visibleMonths}
          />
        );
      case 'ano':
        return (
          <YearsCarousel
            selectedDate={currentDate}
            onDateSelect={setCurrentDate}
            startYear={startYear}
            onPrevious={handlePreviousYear}
            onNext={handleNextYear}
            visibleYears={visibleYears}
          />
        );
      case 'lista':
      default:
        return null;
    }
  };

  // =============================================================================
  // CONTEÚDO BASEADO NA VISUALIZAÇÃO
  // =============================================================================

  const renderContent = () => {
    switch (visualizacao) {
      case 'lista':
        return <ObrigacoesTableWrapper />;

      case 'mes':
        return (
          <ObrigacoesCalendarMonth
            currentDate={currentDate}
            onLoadingChange={setIsLoading}
          />
        );

      case 'ano':
        return (
          <ObrigacoesCalendarYear
            currentDate={currentDate}
            onLoadingChange={setIsLoading}
          />
        );

      case 'semana':
        return (
          <ObrigacoesTableWrapper
            fixedDate={selectedDate}
            hideDateFilters={true}
          />
        );

      default:
        return isLoading ? (
          <TemporalViewLoading message="Carregando obrigações..." />
        ) : null;
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Resumo e Alertas */}
      <ResumoCards />
      <AlertasObrigacoes />

      {/* Tabs estilo Partes (Tabs02 - selecionado roxo) */}
      <AnimatedIconTabs
        tabs={TABS_UI}
        value={visualizacao}
        onValueChange={handleVisualizacaoChange}
        className="w-full"
        listClassName="flex-wrap"
      />

      {/* Carrossel com container branco (separado das tabs) */}
      {visualizacao !== 'lista' && (
        <div className="bg-card border border-border rounded-lg p-4">
          {renderCarousel()}
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>
    </div>
  );
}
