'use client';

/**
 * ExpedientesContent - Componente principal da página de expedientes
 *
 * Gerencia:
 * - Seleção de visualização (dia, mês, ano, lista)
 * - Navegação de data para visualizações de calendário
 * - Renderização condicional das visualizações
 *
 * Usa os componentes do System Design para visualizações temporais:
 * - ChromeTabsCarousel: Tabs estilo Chrome integradas com carrossel
 * - DaysCarousel: Carrossel de dias (na visualização de dia)
 * - MonthsCarousel: Carrossel de meses (na visualização de mês)
 * - YearsCarousel: Carrossel de anos (na visualização de ano)
 */

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { FilterPopover, type FilterOption } from '@/features/partes/components/shared';

import { CodigoTribunal, GRAU_TRIBUNAL_LABELS, ORIGEM_EXPEDIENTE_LABELS } from '../domain';
import { actionListarUsuarios } from '@/features/usuarios';
import {
  TemporalViewLoading,
  MonthsCarousel,
  YearsCarousel,
  ViewModePopover,
  useWeekNavigator,
  type ViewType,
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
// OPÇÕES DE FILTRO (estáticas)
// =============================================================================

const STATUS_OPTIONS: readonly FilterOption[] = [
  { value: 'pendentes', label: 'Pendentes' },
  { value: 'baixados', label: 'Baixados' },
];

const TRIBUNAL_OPTIONS: readonly FilterOption[] = CodigoTribunal.map(
  (trt) => ({ value: trt, label: trt })
);

const GRAU_OPTIONS: readonly FilterOption[] = Object.entries(GRAU_TRIBUNAL_LABELS).map(
  ([value, label]) => ({ value, label })
);

const ORIGEM_OPTIONS: readonly FilterOption[] = Object.entries(ORIGEM_EXPEDIENTE_LABELS).map(
  ([value, label]) => ({ value, label })
);

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
  const [responsavelFilter, setResponsavelFilter] = React.useState<'todos' | 'sem_responsavel' | number>('todos');

  // Filtros Avançados
  const [tribunalFilter, setTribunalFilter] = React.useState<string>('');
  const [grauFilter, setGrauFilter] = React.useState<string>('');
  const [tipoExpedienteFilter, setTipoExpedienteFilter] = React.useState<string>('');
  const [origemFilter, setOrigemFilter] = React.useState<string>('');

  // Dialog State
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  // Loading State (for Month/Year views)
  const [isLoading, setIsLoading] = React.useState(false);

  // Dados Auxiliares
  type UsuarioOption = { id: number; nomeExibicao?: string; nome_exibicao?: string; nome?: string };
  type TipoExpedienteOption = { id: number; tipoExpediente?: string; tipo_expediente?: string };

  const [usuarios, setUsuarios] = React.useState<UsuarioOption[]>([]);
  const [tiposExpedientes, setTiposExpedientes] = React.useState<TipoExpedienteOption[]>([]);

  // Carregar dados auxiliares
  React.useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [usersRes, tiposRes] = await Promise.all([
          actionListarUsuarios({ ativo: true, limite: 100 }),
          fetch('/api/tipos-expedientes?limite=100').then((r) => r.json()),
        ]);

        if (usersRes.success && usersRes.data?.usuarios) {
          setUsuarios(usersRes.data.usuarios as UsuarioOption[]);
        }

        const tiposPayload = tiposRes as { success?: boolean; data?: { data?: TipoExpedienteOption[] } };
        const tiposArr = tiposPayload.data?.data;
        if (tiposPayload.success && Array.isArray(tiposArr)) {
          setTiposExpedientes(tiposArr);
        }
      } catch (err) {
        console.error('Erro ao carregar dados auxiliares:', err);
      }
    };
    fetchAuxData();
  }, []);

  // Helpers
  const getUsuarioNome = (u: UsuarioOption): string => {
    return u.nomeExibicao || u.nome_exibicao || u.nome || `Usuário ${u.id}`;
  };

  const getTipoNome = (t: TipoExpedienteOption): string => {
    return t.tipoExpediente || t.tipo_expediente || `Tipo ${t.id}`;
  };

  // ---------- Opções dinâmicas de filtro ----------
  const responsavelOptions: readonly FilterOption[] = React.useMemo(
    () => [
      { value: 'sem_responsavel', label: 'Sem Responsável' },
      ...usuarios.map((u) => ({
        value: String(u.id),
        label: getUsuarioNome(u),
      })),
    ],
    [usuarios]
  );

  const tipoExpedienteOptions: readonly FilterOption[] = React.useMemo(
    () => tiposExpedientes.map((t) => ({ value: String(t.id), label: getTipoNome(t) })),
    [tiposExpedientes]
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

  // ViewModePopover component para passar aos wrappers e renderFiltersBar
  const viewModePopover = (
    <ViewModePopover
      value={visualizacao}
      onValueChange={handleVisualizacaoChange}
    />
  );

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
        <FilterPopover
          label="Tribunal"
          options={TRIBUNAL_OPTIONS}
          value={tribunalFilter || 'all'}
          onValueChange={(v) => setTribunalFilter(v === 'all' ? '' : v)}
        />

        {/* Grau */}
        <FilterPopover
          label="Grau"
          options={GRAU_OPTIONS}
          value={grauFilter || 'all'}
          onValueChange={(v) => setGrauFilter(v === 'all' ? '' : v)}
        />

        {/* Tipo de Expediente */}
        <FilterPopover
          label="Tipo"
          options={tipoExpedienteOptions}
          value={tipoExpedienteFilter || 'all'}
          onValueChange={(v) => setTipoExpedienteFilter(v === 'all' ? '' : v)}
        />

        {/* Origem */}
        <FilterPopover
          label="Origem"
          options={ORIGEM_OPTIONS}
          value={origemFilter || 'all'}
          onValueChange={(v) => setOrigemFilter(v === 'all' ? '' : v)}
        />

        {/* Status */}
        <FilterPopover
          label="Status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          defaultValue="todos"
        />

        {/* Responsável */}
        <FilterPopover
          label="Responsável"
          options={responsavelOptions}
          value={typeof responsavelFilter === 'number' ? String(responsavelFilter) : responsavelFilter}
          onValueChange={(v) => {
            if (v === 'todos') setResponsavelFilter('todos');
            else if (v === 'sem_responsavel') setResponsavelFilter('sem_responsavel');
            else setResponsavelFilter(parseInt(v, 10));
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
  );

  // =============================================================================
  // CONTEÚDO BASEADO NA VISUALIZAÇÃO
  // =============================================================================

  const renderContent = () => {
    switch (visualizacao) {
      case 'lista':
        return <ExpedientesTableWrapper viewModeSlot={viewModePopover} />;

      case 'mes':
        return (
          <ExpedientesCalendarMonth
            currentDate={currentDate}
            statusFilter={statusFilter}
            globalFilter={globalFilter}
            onLoadingChange={setIsLoading}
          />
        );

      case 'ano':
        return (
          <ExpedientesCalendarYear
            currentDate={currentDate}
            statusFilter={statusFilter}
            globalFilter={globalFilter}
            onLoadingChange={setIsLoading}
          />
        );

      case 'semana':
        return (
          <ExpedientesTableWrapper
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

      default:
        return isLoading ? (
          <TemporalViewLoading message="Carregando expedientes..." />
        ) : null;
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Carrossel com container branco (apenas para mês e ano) */}
      {(visualizacao === 'mes' || visualizacao === 'ano') && (
        <div className="bg-card border border-border rounded-lg p-4">
          {renderCarousel()}
        </div>
      )}

      {/* Filtros (apenas para visualizações de mês e ano) */}
      {(visualizacao === 'mes' || visualizacao === 'ano') && renderFiltersBar()}

      {/* Conteúdo principal */}
      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>

      {/* Dialog de Configurações */}
      <DialogFormShell
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        title="Tipos de Expedientes"
        description="Gerencie os tipos de expedientes utilizados no sistema."
        maxWidth="4xl"
        footer={
          <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
            Fechar
          </Button>
        }
      >
        <div className="flex-1 overflow-auto h-[60vh]">
          <TiposExpedientesList />
        </div>
      </DialogFormShell>
    </div>
  );
}
