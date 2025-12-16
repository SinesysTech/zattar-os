'use client';

/**
 * AudienciasContent - Componente principal da página de audiências
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
 */

import { useCallback, useMemo, useState } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  TemporalViewShell,
  TemporalViewContent,
  TemporalViewLoading,
  TemporalViewError,
  ViewSwitcher,
  DateNavigation,
  type ViewType,
  type NavigationMode,
} from '@/components/shared';

import {
  type BuscarAudienciasParams,
} from '@/features/audiencias';
import { useAudiencias, useTiposAudiencias } from '@/features/audiencias';
import { useUsuarios } from '@/features/usuarios';

import { AudienciasListWrapper } from './audiencias-list-wrapper';
import { AudienciasCalendarWeekView } from './audiencias-calendar-week-view';
import { AudienciasCalendarMonthView } from './audiencias-calendar-month-view';
import { AudienciasCalendarYearView } from './audiencias-calendar-year-view';
import {
  AudienciasCalendarFilters,
  type CalendarFiltersState,
} from './audiencias-calendar-filters';

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasContentProps {
  visualizacao: ViewType;
}

const DEFAULT_FILTERS: CalendarFiltersState = {
  status: 'todas',
  modalidade: 'todas',
  trt: 'todas',
  grau: 'todas',
  responsavel: 'todos',
  tipoAudiencia: 'todos',
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasContent({ visualizacao: initialView }: AudienciasContentProps) {
  const [visualizacao, setVisualizacao] = useState<ViewType>(initialView);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calendar filters and search
  const [busca, setBusca] = useState<string>('');
  const [filters, setFilters] = useState<CalendarFiltersState>(DEFAULT_FILTERS);

  // Auxiliary data for calendar filters
  const { tiposAudiencia } = useTiposAudiencias();
  const { usuarios } = useUsuarios();

  // Calculate date range based on visualization (memoized)
  const dateRange = useMemo(() => {
    if (visualizacao === 'lista') {
      return {}; // No date range for list view
    }

    let start: Date;
    let end: Date;

    switch (visualizacao) {
      case 'semana':
        start = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
        end = endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
        break;
      case 'mes':
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        break;
      case 'ano':
        start = startOfYear(currentDate);
        end = endOfYear(currentDate);
        break;
      default:
        return {};
    }

    return {
      data_inicio_inicio: start.toISOString(),
      data_inicio_fim: end.toISOString(),
    };
  }, [visualizacao, currentDate]);

  // Map tipo audiencia ID to description
  const tipoDescricaoFiltro = useMemo(() => {
    if (filters.tipoAudiencia === 'todos') return undefined;
    return tiposAudiencia.find((t: { id: number; descricao: string }) => t.id === filters.tipoAudiencia)?.descricao;
  }, [filters.tipoAudiencia, tiposAudiencia]);

  // Build params for calendar views (memoized to prevent infinite loops)
  const calendarParams = useMemo<BuscarAudienciasParams>(() => ({
    pagina: 1,
    limite: 1000, // Large limit for calendar views
    busca: busca || undefined,
    modalidade: filters.modalidade === 'todas' ? undefined : filters.modalidade,
    trt: filters.trt === 'todas' ? undefined : filters.trt,
    grau: filters.grau === 'todas' ? undefined : filters.grau,
    responsavel_id:
      filters.responsavel === 'todos'
        ? undefined
        : filters.responsavel === 'null'
          ? 'null'
          : Number(filters.responsavel),
    tipo_descricao: tipoDescricaoFiltro,
    status: filters.status === 'todas' ? undefined : filters.status,
    ...dateRange,
  }), [busca, filters, tipoDescricaoFiltro, dateRange]);

  // Only fetch for calendar views
  const { audiencias, isLoading, error, refetch } = useAudiencias(calendarParams, {
    enabled: visualizacao !== 'lista',
  });

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    switch (visualizacao) {
      case 'semana':
        setCurrentDate((prev) => subWeeks(prev, 1));
        break;
      case 'mes':
        setCurrentDate((prev) => subMonths(prev, 1));
        break;
      case 'ano':
        setCurrentDate((prev) => subYears(prev, 1));
        break;
    }
  }, [visualizacao]);

  const handleNext = useCallback(() => {
    switch (visualizacao) {
      case 'semana':
        setCurrentDate((prev) => addWeeks(prev, 1));
        break;
      case 'mes':
        setCurrentDate((prev) => addMonths(prev, 1));
        break;
      case 'ano':
        setCurrentDate((prev) => addYears(prev, 1));
        break;
    }
  }, [visualizacao]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Display date range for calendar
  const displayDateRange = useMemo(() => {
    switch (visualizacao) {
      case 'semana': {
        const start = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
        return `${format(start, 'dd/MM')} - ${format(end, 'dd/MM/yyyy')}`;
      }
      case 'mes':
        return format(currentDate, 'MMMM yyyy', { locale: ptBR });
      case 'ano':
        return format(currentDate, 'yyyy', { locale: ptBR });
      case 'lista':
      default:
        return '';
    }
  }, [visualizacao, currentDate]);

  // Map visualization to navigation mode
  const navigationMode: NavigationMode = visualizacao === 'lista' ? 'semana' : visualizacao as NavigationMode;

  // Handle visualization change
  const handleVisualizacaoChange = useCallback((value: ViewType) => {
    setVisualizacao(value);
  }, []);

  return (
    <TemporalViewShell
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
        visualizacao !== 'lista' ? (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-9 w-[180px] pl-8"
            />
          </div>
        ) : undefined
      }
      filters={
        visualizacao !== 'lista' ? (
          <AudienciasCalendarFilters
            filters={filters}
            onFiltersChange={setFilters}
            usuarios={usuarios}
            tiposAudiencia={tiposAudiencia}
          />
        ) : undefined
      }
    >
      {/* Content */}
      {visualizacao === 'lista' ? (
        <AudienciasListWrapper />
      ) : isLoading ? (
        <TemporalViewLoading message="Carregando audiências..." />
      ) : error ? (
        <TemporalViewError message={`Erro ao carregar audiências: ${error}`} onRetry={refetch} />
      ) : (
        <TemporalViewContent>
          {visualizacao === 'semana' && (
            <AudienciasCalendarWeekView
              audiencias={audiencias}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              refetch={refetch}
            />
          )}
          {visualizacao === 'mes' && (
            <AudienciasCalendarMonthView
              audiencias={audiencias}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              refetch={refetch}
            />
          )}
          {visualizacao === 'ano' && (
            <AudienciasCalendarYearView
              audiencias={audiencias}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              refetch={refetch}
            />
          )}
        </TemporalViewContent>
      )}
    </TemporalViewShell>
  );
}
