'use client';

/**
 * AudienciasContent - Componente principal da página de audiências
 *
 * Gerencia:
 * - Seleção de visualização (tabs: semana, mês, ano, lista)
 * - Navegação de data para visualizações de calendário
 * - Renderização condicional das visualizações
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
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

import {
  ModalidadeAudiencia,
  StatusAudiencia,
  GrauTribunal,
  type CodigoTribunal,
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
  visualizacao: 'semana' | 'mes' | 'ano' | 'lista';
}

type Visualizacao = 'semana' | 'mes' | 'ano' | 'lista';

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
  const [visualizacao, setVisualizacao] = useState<Visualizacao>(initialView);
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
  const handlePrevious = () => {
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
  };

  const handleNext = () => {
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
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Display date range for calendar
  const displayDateRange = useCallback(() => {
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

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs and calendar controls */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-background">
        {/* Left: Tabs */}
        <Tabs
          value={visualizacao}
          onValueChange={(value) => setVisualizacao(value as Visualizacao)}
        >
          <TabsList>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
            <TabsTrigger value="ano">Ano</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Right: Calendar navigation + filters (only for calendar views) */}
        {visualizacao !== 'lista' && (
          <div className="flex items-center gap-3">
            {/* Date Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3"
                onClick={handleToday}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Date Range Display */}
            <span className="text-sm font-medium min-w-[140px]">
              {displayDateRange()}
            </span>

            {/* Separator */}
            <div className="h-6 w-px bg-border" />

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-9 w-[180px] pl-8"
              />
            </div>

            {/* Filters Popover */}
            <AudienciasCalendarFilters
              filters={filters}
              onFiltersChange={setFilters}
              usuarios={usuarios}
              tiposAudiencia={tiposAudiencia}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {visualizacao === 'lista' ? (
          <AudienciasListWrapper />
        ) : isLoading ? (
          <div className="flex flex-1 items-center justify-center h-full">
            <div className="text-muted-foreground">Carregando audiências...</div>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center h-full">
            <div className="text-destructive">Erro ao carregar audiências: {error}</div>
          </div>
        ) : (
          <div className="h-full overflow-auto p-4">
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
          </div>
        )}
      </div>
    </div>
  );
}
