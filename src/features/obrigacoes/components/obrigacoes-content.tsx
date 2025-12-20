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
  ExpedientesTabsCarousel, 
  DaysCarousel,
  MonthsCarousel,
  YearsCarousel,
  TemporalViewLoading,
  type ExpedientesTab
} from '@/components/shared';

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
  semana: '/financeiro/obrigacoes/semana',
  mes: '/financeiro/obrigacoes/mes',
  ano: '/financeiro/obrigacoes/ano',
  lista: '/financeiro/obrigacoes/lista',
};

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/financeiro/obrigacoes': 'semana',
  '/financeiro/obrigacoes/semana': 'semana',
  '/financeiro/obrigacoes/mes': 'mes',
  '/financeiro/obrigacoes/ano': 'ano',
  '/financeiro/obrigacoes/lista': 'lista',
};

// =============================================================================
// TABS CONFIGURAÇÃO
// =============================================================================

const TABS: ExpedientesTab[] = [
  { value: 'semana', label: 'Semana', icon: <CalendarDays className="h-4 w-4" /> },
  { value: 'mes', label: 'Mês', icon: <CalendarRange className="h-4 w-4" /> },
  { value: 'ano', label: 'Ano', icon: <Calendar className="h-4 w-4" /> },
  { value: 'lista', label: 'Lista', icon: <List className="h-4 w-4" /> },
];

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
    <div className="flex flex-col h-full space-y-4">
      {/* Resumo e Alertas */}
      <ResumoCards />
      <AlertasObrigacoes />

      <ExpedientesTabsCarousel
        tabs={TABS}
        activeTab={visualizacao}
        onTabChange={handleVisualizacaoChange}
        carousel={renderCarousel()}
        id="obrigacoes-tabs"
      >
        <div className="flex-1 min-h-0">
          {renderContent()}
        </div>
      </ExpedientesTabsCarousel>
    </div>
  );
}
