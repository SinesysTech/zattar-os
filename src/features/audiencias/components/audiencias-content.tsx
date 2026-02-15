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
import { Plus, Search, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilterPopover, type FilterOption } from '@/features/partes/components/shared';
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
import { AudienciasCalendarYearView } from './audiencias-calendar-year-view';
import { AudienciasCalendarCompact } from './audiencias-calendar-compact';
import { AudienciasDayList } from './audiencias-day-list';
import { TiposAudienciasList } from './tipos-audiencias-list';
import { NovaAudienciaDialog } from './nova-audiencia-dialog';

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
// OPÇÕES DE FILTRO (estáticas)
// =============================================================================

const STATUS_OPTIONS: readonly FilterOption[] = Object.entries(STATUS_AUDIENCIA_LABELS).map(
  ([value, label]) => ({ value, label })
);

const MODALIDADE_OPTIONS: readonly FilterOption[] = Object.entries(MODALIDADE_AUDIENCIA_LABELS).map(
  ([value, label]) => ({ value, label })
);

const GRAU_OPTIONS: readonly FilterOption[] = Object.entries(GRAU_TRIBUNAL_LABELS).map(
  ([value, label]) => ({ value, label })
);

const TRIBUNAL_OPTIONS: readonly FilterOption[] = CODIGO_TRIBUNAL.map(
  (trt) => ({ value: trt, label: trt })
);

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // Month Master-Detail State
  const [monthSelectedDate, setMonthSelectedDate] = React.useState<Date>(new Date());
  const [monthCurrentMonth, setMonthCurrentMonth] = React.useState<Date>(new Date());

  // Dados Auxiliares
  const { usuarios } = useUsuarios();
  const { tiposAudiencia } = useTiposAudiencias();

  // Opções dinâmicas de filtro
  const responsavelOptions: readonly FilterOption[] = React.useMemo(
    () => [
      { value: 'sem_responsavel', label: 'Sem Responsável' },
      ...usuarios.map((u) => ({
        value: String(u.id),
        label: u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`,
      })),
    ],
    [usuarios]
  );

  const tipoAudienciaOptions: readonly FilterOption[] = React.useMemo(
    () => tiposAudiencia.map((t) => ({ value: String(t.id), label: t.descricao })),
    [tiposAudiencia]
  );

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
        // Usar monthCurrentMonth para a view Master-Detail
        start = startOfMonth(monthCurrentMonth);
        end = endOfMonth(monthCurrentMonth);
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
  }, [visualizacao, currentDate, monthCurrentMonth]);

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

  // Handler para criação de audiência bem-sucedida
  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setIsCreateDialogOpen(false);
  }, [refetch]);

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
    <div className="bg-card border rounded-md">
      {/* Linha 1: Título */}
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-2xl font-bold tracking-tight font-heading">Audiências</h1>
      </div>

      {/* Linha 2: Filtros */}
      <div className="flex items-center justify-between gap-4 px-4 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Busca */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9 w-full pl-9 bg-card"
            />
          </div>

        {/* Tribunal */}
        <FilterPopover
          label="Tribunal"
          options={TRIBUNAL_OPTIONS}
          value={tribunalFilter || 'all'}
          onValueChange={(v) => setTribunalFilter(v === 'all' ? '' : v as CodigoTribunal)}
        />

        {/* Grau */}
        <FilterPopover
          label="Grau"
          options={GRAU_OPTIONS}
          value={grauFilter || 'all'}
          onValueChange={(v) => setGrauFilter(v === 'all' ? '' : v as GrauTribunal)}
        />

        {/* Status */}
        <FilterPopover
          label="Status"
          options={STATUS_OPTIONS}
          value={statusFilter || 'all'}
          onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v as StatusAudiencia)}
        />

        {/* Modalidade */}
        <FilterPopover
          label="Modalidade"
          options={MODALIDADE_OPTIONS}
          value={modalidadeFilter || 'all'}
          onValueChange={(v) => setModalidadeFilter(v === 'all' ? '' : v as ModalidadeAudiencia)}
        />

        {/* Tipo de Audiência */}
        <FilterPopover
          label="Tipo"
          options={tipoAudienciaOptions}
          value={tipoAudienciaFilter ? String(tipoAudienciaFilter) : 'all'}
          onValueChange={(v) => setTipoAudienciaFilter(v === 'all' ? '' : Number(v))}
        />

        {/* Responsável */}
        <FilterPopover
          label="Responsável"
          options={responsavelOptions}
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
          defaultValue="todos"
        />
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
    </div>
  );

  // =============================================================================
  // CONTEÚDO BASEADO NA VISUALIZAÇÃO
  // =============================================================================

  const renderContent = () => {
    switch (visualizacao) {
      case 'lista':
        return (
          <AudienciasListWrapper
            viewModeSlot={viewModePopover}
            usuariosData={usuarios}
            tiposAudienciaData={tiposAudiencia}
          />
        );

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
            usuariosData={usuarios}
            tiposAudienciaData={tiposAudiencia}
          />
        );

      case 'mes':
        return (
          <div className="flex flex-col h-full gap-4">
            {/* Toolbar - sem card, direto no background */}
            {/* Linha 1: Título + Ação */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight font-heading">Audiências</h1>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Audiência
              </Button>
            </div>

            {/* Linha 2: Filtros */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Busca */}
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="h-9 w-full pl-9 bg-card"
                  />
                </div>

                {/* Tribunal */}
                <FilterPopover
                  label="Tribunal"
                  options={TRIBUNAL_OPTIONS}
                  value={tribunalFilter || 'all'}
                  onValueChange={(v) => setTribunalFilter(v === 'all' ? '' : v as CodigoTribunal)}
                />

                {/* Grau */}
                <FilterPopover
                  label="Grau"
                  options={GRAU_OPTIONS}
                  value={grauFilter || 'all'}
                  onValueChange={(v) => setGrauFilter(v === 'all' ? '' : v as GrauTribunal)}
                />

                {/* Status */}
                <FilterPopover
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={statusFilter || 'all'}
                  onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v as StatusAudiencia)}
                />

                {/* Modalidade */}
                <FilterPopover
                  label="Modalidade"
                  options={MODALIDADE_OPTIONS}
                  value={modalidadeFilter || 'all'}
                  onValueChange={(v) => setModalidadeFilter(v === 'all' ? '' : v as ModalidadeAudiencia)}
                />

                {/* Tipo de Audiência */}
                <FilterPopover
                  label="Tipo"
                  options={tipoAudienciaOptions}
                  value={tipoAudienciaFilter ? String(tipoAudienciaFilter) : 'all'}
                  onValueChange={(v) => setTipoAudienciaFilter(v === 'all' ? '' : Number(v))}
                />

                {/* Responsável */}
                <FilterPopover
                  label="Responsável"
                  options={responsavelOptions}
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
                  defaultValue="todos"
                />
              </div>

              {/* Ações à direita */}
              <div className="flex items-center gap-2">
                {viewModePopover}
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

            {/* Master-Detail Layout - ocupa toda a altura restante */}
            <div className="flex-1 min-h-0 bg-card border rounded-md overflow-hidden">
              {isLoading ? (
                <TemporalViewLoading message="Carregando audiências..." />
              ) : error ? (
                <TemporalViewError message={`Erro ao carregar audiências: ${error}`} onRetry={refetch} />
              ) : (
                <div className="flex h-full">
                  {/* Calendário compacto (40%) */}
                  <div className="w-2/5 border-r p-4 overflow-auto">
                    <AudienciasCalendarCompact
                      selectedDate={monthSelectedDate}
                      onDateSelect={setMonthSelectedDate}
                      audiencias={audiencias}
                      currentMonth={monthCurrentMonth}
                      onMonthChange={setMonthCurrentMonth}
                    />
                  </div>

                  {/* Lista do dia (60%) */}
                  <div className="flex-1 min-w-0">
                    <AudienciasDayList
                      selectedDate={monthSelectedDate}
                      audiencias={audiencias}
                      onAddAudiencia={() => setIsCreateDialogOpen(true)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
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
      {/* Carrossel com container branco (apenas para ano - semana usa carrossel dentro do TableWrapper, mês usa Master-Detail) */}
      {visualizacao === 'ano' && (
        <div className="bg-card border border-border rounded-lg p-4">
          {renderCarousel()}
        </div>
      )}

      {/* Filtros (apenas para visualização de ano - semana e lista têm toolbar no TableWrapper, mês usa Master-Detail) */}
      {visualizacao === 'ano' && renderFiltersBar()}

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

      {/* Dialog de Nova Audiência (para view de mês) */}
      <NovaAudienciaDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
