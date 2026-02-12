'use client';

/**
 * AudienciasContent - Componente principal da página de audiências
 *
 * Gerencia:
 * - Seleção de visualização (dia, mês, ano, lista)
 * - Navegação de data para visualizações de calendário
 * - Renderização condicional das visualizações
 *
 * Usa os componentes do System Design para visualizações temporais:
 * - Tabs (estilo simples/flat): Tabs separadas do carrossel
 * - DaysCarousel: Carrossel de dias (na visualização de dia)
 * - MonthsCarousel: Carrossel de meses (na visualização de mês)
 * - YearsCarousel: Carrossel de anos (na visualização de ano)
 */

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,

} from 'date-fns';
import { Search, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DialogFormShell } from '@/components/shared/dialog-shell';

import {
  StatusAudiencia,
  ModalidadeAudiencia,
  GrauTribunal,
  CODIGO_TRIBUNAL,
  STATUS_AUDIENCIA_LABELS,
  MODALIDADE_AUDIENCIA_LABELS,
  GRAU_TRIBUNAL_LABELS,
  type BuscarAudienciasParams,
  type CodigoTribunal,
} from '../domain';

import {
  TemporalViewLoading,
  TemporalViewError,
  MonthsCarousel,
  YearsCarousel,
  ViewModePopover,

  useWeekNavigator,
  type ViewType,
} from '@/components/shared';

import { useAudiencias, useTiposAudiencias } from '../hooks';
import { useUsuarios } from '@/features/usuarios';

import { AudienciasListWrapper } from './audiencias-list-wrapper';
import { AudienciasTableWrapper } from './audiencias-table-wrapper';
import { AudienciasCalendarMonthView } from './audiencias-calendar-month-view';
import { AudienciasCalendarYearView } from './audiencias-calendar-year-view';
import { TiposAudienciasList } from './tipos-audiencias-list';

// =============================================================================
// MAPEAMENTO URL -> VIEW
// =============================================================================

const VIEW_ROUTES: Record<ViewType, string> = {
  semana: '/audiencias/semana',
  mes: '/audiencias/mes',
  ano: '/audiencias/ano',
  lista: '/audiencias/lista',
};

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/audiencias': 'semana',
  '/audiencias/semana': 'semana',
  '/audiencias/mes': 'mes',
  '/audiencias/ano': 'ano',
  '/audiencias/lista': 'lista',
};

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasContentProps {
  visualizacao?: ViewType;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasContent({ visualizacao: initialView = 'semana' }: AudienciasContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Derive view from URL pathname
  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;

  // View State - sync with URL
  const [visualizacao, setVisualizacao] = React.useState<ViewType>(viewFromUrl);
  const [currentDate, setCurrentDate] = React.useState(new Date());


  // Sync view state when URL changes
  React.useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView && newView !== visualizacao) {
      setVisualizacao(newView);
    }
  }, [pathname, visualizacao]);

  // Filters State
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusAudiencia | ''>('');
  const [modalidadeFilter, setModalidadeFilter] = React.useState<ModalidadeAudiencia | ''>('');
  const [tribunalFilter, setTribunalFilter] = React.useState<CodigoTribunal | ''>('');
  const [grauFilter, setGrauFilter] = React.useState<GrauTribunal | ''>('');
  const [responsavelFilter, setResponsavelFilter] = React.useState<'todos' | 'sem_responsavel' | number>('todos');
  const [tipoAudienciaFilter, setTipoAudienciaFilter] = React.useState<number | ''>('');

  // Dialog State
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  // Dados Auxiliares
  const { usuarios } = useUsuarios();
  const { tiposAudiencia } = useTiposAudiencias();

  // =============================================================================
  // NAVEGAÇÃO POR SEMANA (visualização 'semana')
  // =============================================================================
  const weekNav = useWeekNavigator();

  // =============================================================================
  // NAVEGAÇÃO POR MÊS (visualização 'mes')
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
  // NAVEGAÇÃO POR ANO (visualização 'ano')
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

  // Handle visualization change - navigate to the correct URL
  const handleVisualizacaoChange = React.useCallback((value: string) => {
    const viewValue = value as ViewType;
    const targetRoute = VIEW_ROUTES[viewValue];
    if (targetRoute && targetRoute !== pathname) {
      router.push(targetRoute);
    }
    setVisualizacao(viewValue);
  }, [pathname, router]);

  // =============================================================================
  // DATE RANGE PARA BUSCA DE AUDIÊNCIAS
  // =============================================================================

  const dateRange = React.useMemo(() => {
    // Não buscar para lista e semana - eles têm seus próprios wrappers
    if (visualizacao === 'lista' || visualizacao === 'semana') {
      return {};
    }

    let start: Date;
    let end: Date;

    switch (visualizacao) {
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

  // Build params for calendar views (memoized to prevent infinite loops)
  const calendarParams = React.useMemo<BuscarAudienciasParams>(() => ({
    pagina: 1,
    limite: 1000, // Large limit for calendar views
    busca: globalFilter || undefined,
    status: statusFilter || undefined,
    modalidade: modalidadeFilter || undefined,
    trt: tribunalFilter || undefined,
    grau: grauFilter || undefined,
    responsavel_id:
      responsavelFilter === 'todos'
        ? undefined
        : responsavelFilter === 'sem_responsavel'
          ? 'null'
          : responsavelFilter,
    tipo_audiencia_id: tipoAudienciaFilter || undefined,
    ...dateRange,
  }), [globalFilter, statusFilter, modalidadeFilter, tribunalFilter, grauFilter, responsavelFilter, tipoAudienciaFilter, dateRange]);

  // Only fetch for calendar views (mes and ano - semana and lista have their own wrappers)
  const { audiencias, isLoading, error, refetch } = useAudiencias(calendarParams, {
    enabled: visualizacao === 'mes' || visualizacao === 'ano',
  });

  // =============================================================================
  // CARROSSEL BASEADO NA VISUALIZAÇÃO
  // =============================================================================

  const renderCarousel = () => {
    switch (visualizacao) {
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
      case 'semana':
      case 'lista':
      default:
        return null;
    }
  };

  // =============================================================================
  // BARRA DE FILTROS
  // =============================================================================

  const renderFiltersBar = () => (
    <div className="flex items-center justify-between gap-4 p-4 bg-card border rounded-md">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 w-50 pl-8 bg-card"
          />
        </div>

        {/* Tribunal */}
        <Select
          value={tribunalFilter || '_all'}
          onValueChange={(v) => setTribunalFilter(v === '_all' ? '' : v as CodigoTribunal)}
        >
          <SelectTrigger className="h-9 w-30 bg-card">
            <SelectValue placeholder="Tribunal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tribunal</SelectItem>
            {CODIGO_TRIBUNAL.map((trt) => (
              <SelectItem key={trt} value={trt}>
                {trt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Grau */}
        <Select
          value={grauFilter || '_all'}
          onValueChange={(v) => setGrauFilter(v === '_all' ? '' : (v as GrauTribunal))}
        >
          <SelectTrigger className="h-9 w-32.5 bg-card">
            <SelectValue placeholder="Grau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Grau</SelectItem>
            {Object.entries(GRAU_TRIBUNAL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={statusFilter || '_all'}
          onValueChange={(v) => setStatusFilter(v === '_all' ? '' : (v as StatusAudiencia))}
        >
          <SelectTrigger className="h-9 w-32.5 bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Status</SelectItem>
            {Object.entries(STATUS_AUDIENCIA_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Modalidade */}
        <Select
          value={modalidadeFilter || '_all'}
          onValueChange={(v) => setModalidadeFilter(v === '_all' ? '' : (v as ModalidadeAudiencia))}
        >
          <SelectTrigger className="h-9 w-32.5 bg-card">
            <SelectValue placeholder="Modalidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Modalidade</SelectItem>
            {Object.entries(MODALIDADE_AUDIENCIA_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tipo de Audiência */}
        <Select
          value={tipoAudienciaFilter ? String(tipoAudienciaFilter) : '_all'}
          onValueChange={(v) => setTipoAudienciaFilter(v === '_all' ? '' : Number(v))}
        >
          <SelectTrigger className="h-9 w-40 bg-card">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tipo</SelectItem>
            {tiposAudiencia.map((tipo) => (
              <SelectItem key={tipo.id} value={String(tipo.id)}>
                {tipo.descricao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Responsável */}
        <Select
          value={
            responsavelFilter === 'todos'
              ? 'todos'
              : responsavelFilter === 'sem_responsavel'
                ? 'sem_responsavel'
                : String(responsavelFilter)
          }
          onValueChange={(v) => {
            if (v === 'todos') {
              setResponsavelFilter('todos');
            } else if (v === 'sem_responsavel') {
              setResponsavelFilter('sem_responsavel');
            } else {
              setResponsavelFilter(parseInt(v, 10));
            }
          }}
        >
          <SelectTrigger className="h-9 w-40 bg-card">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Responsável</SelectItem>
            <SelectItem value="sem_responsavel">Sem Responsável</SelectItem>
            {usuarios.map((usuario) => (
              <SelectItem key={usuario.id} value={String(usuario.id)}>
                {usuario.nomeExibicao || usuario.nomeCompleto || `Usuário ${usuario.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ações à direita */}
      <div className="flex items-center gap-2">
        {/* View Mode Popover */}
        {viewModePopover}

        {/* Configurações */}
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
    </div>
  );

  // =============================================================================
  // CONTEÚDO BASEADO NA VISUALIZAÇÃO
  // =============================================================================

  const renderContent = () => {
    switch (visualizacao) {
      case 'lista':
        return <AudienciasListWrapper viewModeSlot={viewModePopover} />;

      case 'semana':
        return (
          <AudienciasTableWrapper
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
        return isLoading ? (
          <TemporalViewLoading message="Carregando audiências..." />
        ) : error ? (
          <TemporalViewError message={`Erro ao carregar audiências: ${error}`} onRetry={refetch} />
        ) : (
          <AudienciasCalendarMonthView
            audiencias={audiencias}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            refetch={refetch}
          />
        );

      case 'ano':
        return isLoading ? (
          <TemporalViewLoading message="Carregando audiências..." />
        ) : error ? (
          <TemporalViewError message={`Erro ao carregar audiências: ${error}`} onRetry={refetch} />
        ) : (
          <AudienciasCalendarYearView
            audiencias={audiencias}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            refetch={refetch}
          />
        );

      default:
        return null;
    }
  };

  // ViewModePopover component para passar aos wrappers
  const viewModePopover = (
    <ViewModePopover
      value={visualizacao}
      onValueChange={handleVisualizacaoChange}
    />
  );

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Carrossel com container branco (apenas para mês e ano - semana usa carrossel dentro do TableWrapper) */}
      {(visualizacao === 'mes' || visualizacao === 'ano') && (
        <div className="bg-card border border-border rounded-lg p-4">
          {renderCarousel()}
        </div>
      )}

      {/* Filtros (apenas para visualizações de mês e ano - semana e lista já têm toolbar no TableWrapper) */}
      {(visualizacao === 'mes' || visualizacao === 'ano') && renderFiltersBar()}

      {/* Conteúdo principal */}
      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>

      {/* Dialog de Configurações */}
      <DialogFormShell
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        title="Tipos de Audiências"
        description="Gerencie os tipos de audiências utilizados no sistema."
        maxWidth="4xl"
        footer={
          <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
            Fechar
          </Button>
        }
      >
        <div className="flex-1 overflow-auto h-[60vh]">
          <TiposAudienciasList />
        </div>
      </DialogFormShell>
    </div>
  );
}
