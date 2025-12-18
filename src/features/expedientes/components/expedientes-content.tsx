'use client';

/**
 * ExpedientesContent - Componente principal da página de expedientes
 *
 * Gerencia:
 * - Seleção de visualização (semana, mês, ano, lista)
 * - Navegação de data para visualizações de calendário
 * - Renderização condicional das visualizações
 *
 * Usa os componentes do System Design para visualizações temporais:
 * - TemporalViewShell: Container unificado
 * - ViewSwitcher: Alternância entre visualizações
 * - DateNavigation: Navegação temporal
 * - WeekDaysCarousel: Carrossel de dias (na visualização de semana)
 */

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search,
  Settings,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
// Removed DataTable import
import {
  TemporalViewShell,
  TemporalViewContent,
  TemporalViewLoading,
  TemporalViewHeader,
  ViewSwitcher,
  DateNavigation,
  WeekDaysCarousel,
  type ViewType,
  type NavigationMode,
} from '@/components/shared';

import { TiposExpedientesList } from '@/features/tipos-expedientes';
import { ExpedientesTableWrapper } from './expedientes-table-wrapper';
import { ExpedientesCalendarMonth } from './expedientes-calendar-month';
import { ExpedientesCalendarYear } from './expedientes-calendar-year';

// =============================================================================
// MAPEAMENTO URL -> VIEW
// =============================================================================

const VIEW_ROUTES: Record<ViewType, string> = {
  semana: '/expedientes/semana',
  mes: '/expedientes/mes',
  ano: '/expedientes/ano',
  lista: '/expedientes/lista',
};

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/expedientes': 'semana',
  '/expedientes/semana': 'semana',
  '/expedientes/mes': 'mes',
  '/expedientes/ano': 'ano',
  '/expedientes/lista': 'lista',
};

// =============================================================================
// TIPOS
// =============================================================================

// =============================================================================
// TIPOS
// =============================================================================

interface ExpedientesContentProps {
  visualizacao?: ViewType;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedientesContent({ visualizacao: initialView = 'semana' }: ExpedientesContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Derive view from URL pathname
  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;

  // View State - sync with URL
  const [visualizacao, setVisualizacao] = React.useState<ViewType>(viewFromUrl);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  // Sync view state when URL changes
  React.useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView && newView !== visualizacao) {
      setVisualizacao(newView);
    }
  }, [pathname, visualizacao]);

  // Filters State
  const [statusFilter, setStatusFilter] = React.useState<'todos' | 'pendentes' | 'baixados'>('pendentes');
  const [globalFilter, setGlobalFilter] = React.useState('');
  // Dialog State
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  // Loading State (for Month/Year views)
  const [isLoading, setIsLoading] = React.useState(false);

  // Calendar Days for Week View
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });

  // Navigation handlers
  const handlePrevious = React.useCallback(() => {
    switch (visualizacao) {
      case 'semana':
        const newPrevDate = subWeeks(currentDate, 1);
        setCurrentDate(newPrevDate);
        setSelectedDate(startOfWeek(newPrevDate, { weekStartsOn: 0 }));
        break;
      case 'mes':
        setCurrentDate((prev) => subMonths(prev, 1));
        break;
      case 'ano':
        setCurrentDate((prev) => subYears(prev, 1));
        break;
    }
  }, [visualizacao, currentDate]);

  const handleNext = React.useCallback(() => {
    switch (visualizacao) {
      case 'semana':
        const newNextDate = addWeeks(currentDate, 1);
        setCurrentDate(newNextDate);
        setSelectedDate(startOfWeek(newNextDate, { weekStartsOn: 0 }));
        break;
      case 'mes':
        setCurrentDate((prev) => addMonths(prev, 1));
        break;
      case 'ano':
        setCurrentDate((prev) => addYears(prev, 1));
        break;
    }
  }, [visualizacao, currentDate]);

  const handleToday = React.useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  // Display date range for calendar
  const displayDateRange = React.useMemo(() => {
    switch (visualizacao) {
      case 'semana':
        return `${format(weekStart, 'd MMM', { locale: ptBR })} - ${format(weekEnd, 'd MMM, yyyy', { locale: ptBR })}`;
      case 'mes':
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
      case 'ano':
        return format(currentDate, 'yyyy', { locale: ptBR });
      case 'lista':
      default:
        return '';
    }
  }, [visualizacao, currentDate, weekStart, weekEnd]);

  // Map visualization to navigation mode
  const navigationMode: NavigationMode = visualizacao === 'lista' ? 'semana' : visualizacao as NavigationMode;

  // Handle visualization change - navigate to the correct URL
  const handleVisualizacaoChange = React.useCallback((value: ViewType) => {
    const targetRoute = VIEW_ROUTES[value];
    if (targetRoute && targetRoute !== pathname) {
      router.push(targetRoute);
    }
    setVisualizacao(value);
  }, [pathname, router]);

  return (
    <TemporalViewShell
      headerClassName={['semana', 'lista'].includes(visualizacao) ? 'border-b-0' : undefined}
      viewSwitcher={
        <ViewSwitcher
          value={visualizacao}
          onValueChange={handleVisualizacaoChange}
        />
      }
      dateNavigation={
        visualizacao !== 'lista' ? (
          <DateNavigation
            onPrevious={handlePrevious}
            onNext={handleNext}
            onToday={handleToday}
            displayText={displayDateRange}
            mode={navigationMode}
          />
        ) : undefined
      }
      search={
        !['lista', 'semana'].includes(visualizacao) ? (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9 w-[180px] pl-8"
            />
          </div>
        ) : undefined
      }
      filters={
        !['lista', 'semana'].includes(visualizacao) ? (
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendentes">Pendentes</SelectItem>
                <SelectItem value="baixados">Baixados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : undefined
      }
      extraActions={
        !['lista', 'semana'].includes(visualizacao) ? (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Configurações</TooltipContent>
            </Tooltip>
          </div>
        ) : undefined
      }
    >
      {/* Content */}
      {visualizacao === 'lista' ? (
        <ExpedientesTableWrapper />
      ) : visualizacao === 'mes' ? (
        <TemporalViewContent>
          <ExpedientesCalendarMonth
            currentDate={currentDate}
            statusFilter={statusFilter}
            globalFilter={globalFilter}
            onLoadingChange={setIsLoading}
          />
        </TemporalViewContent>
      ) : visualizacao === 'ano' ? (
        <TemporalViewContent>
          <ExpedientesCalendarYear
            currentDate={currentDate}
            statusFilter={statusFilter}
            globalFilter={globalFilter}
            onLoadingChange={setIsLoading}
          />
        </TemporalViewContent>
      ) : visualizacao === 'semana' ? (
        <div className="flex flex-col h-full">
          {/* Week Days Carousel */}
          <div className="p-4 bg-card border rounded-md mb-4 shrink-0">
            <WeekDaysCarousel
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              weekStartsOn={0}
              renderBadge={() => null} // Badges disabled as parent doesn't fetch data anymore
            />
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <TemporalViewHeader
              title={`Expedientes de ${format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}`}
              className="mb-0 border-none px-0 pt-0"
            />
            <div className="flex-1 overflow-auto">
              <ExpedientesTableWrapper
                fixedDate={selectedDate}
                hideDateFilters={true}
              />
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <TemporalViewLoading message="Carregando expedientes..." />
      ) : null}

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Tipos de Expedientes</DialogTitle>
            <DialogDescription>
              Gerencie os tipos de expedientes utilizados no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <TiposExpedientesList />
          </div>
        </DialogContent>
      </Dialog>
    </TemporalViewShell>
  );
}
