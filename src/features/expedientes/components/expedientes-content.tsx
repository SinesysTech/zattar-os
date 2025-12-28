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
import {
  addDays,
  subDays,
} from 'date-fns';
import {
  Search,
  Settings,
  CalendarDays,
  CalendarRange,
  Calendar,
  List,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DialogFormShell } from '@/components/shared/dialog-shell';

import { CodigoTribunal, GRAU_TRIBUNAL_LABELS, ORIGEM_EXPEDIENTE_LABELS } from '../domain';
import { actionListarUsuarios } from '@/features/usuarios';
import {
  TemporalViewLoading,
  MonthsCarousel,
  YearsCarousel,
  type ViewType,
} from '@/components/shared';
import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';

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
// TABS CONFIGURAÇÃO
// =============================================================================

const TABS_CONFIG = [
  { value: 'semana' as ViewType, label: 'Dia', icon: CalendarDays },
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

  // =============================================================================
  // NAVEGAÇÃO POR DIA (visualização 'semana')
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
            className="h-9 w-[200px] pl-8 bg-card"
          />
        </div>

        {/* Tribunal */}
        <Select
          value={tribunalFilter || '_all'}
          onValueChange={(v) => setTribunalFilter(v === '_all' ? '' : v)}
        >
          <SelectTrigger className="h-9 w-[120px] bg-card">
            <SelectValue placeholder="Tribunal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tribunal</SelectItem>
            {CodigoTribunal.map((trt) => (
              <SelectItem key={trt} value={trt}>
                {trt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Grau */}
        <Select
          value={grauFilter || '_all'}
          onValueChange={(v) => setGrauFilter(v === '_all' ? '' : v)}
        >
          <SelectTrigger className="h-9 w-[130px] bg-card">
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

        {/* Tipo de Expediente */}
        <Select
          value={tipoExpedienteFilter || '_all'}
          onValueChange={(v) => setTipoExpedienteFilter(v === '_all' ? '' : v)}
        >
          <SelectTrigger className="h-9 w-[160px] bg-card">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Tipo</SelectItem>
            {tiposExpedientes.map((tipo) => (
              <SelectItem key={tipo.id} value={tipo.id.toString()}>
                {getTipoNome(tipo)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Origem */}
        <Select
          value={origemFilter || '_all'}
          onValueChange={(v) => setOrigemFilter(v === '_all' ? '' : v)}
        >
          <SelectTrigger className="h-9 w-[120px] bg-card">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Origem</SelectItem>
            {Object.entries(ORIGEM_EXPEDIENTE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="h-9 w-[130px] bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendentes">Pendentes</SelectItem>
            <SelectItem value="baixados">Baixados</SelectItem>
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
          <SelectTrigger className="h-9 w-[160px] bg-card">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Responsável</SelectItem>
            <SelectItem value="sem_responsavel">Sem Responsável</SelectItem>
            {usuarios.map((usuario) => (
              <SelectItem key={usuario.id} value={String(usuario.id)}>
                {getUsuarioNome(usuario)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
  );

  // =============================================================================
  // CONTEÚDO BASEADO NA VISUALIZAÇÃO
  // =============================================================================

  const renderContent = () => {
    switch (visualizacao) {
      case 'lista':
        return <ExpedientesTableWrapper />;

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
            fixedDate={selectedDate}
            hideDateFilters={true}
            daysCarouselProps={{
              selectedDate,
              onDateSelect: setSelectedDate,
              startDate,
              onPrevious: handlePreviousDay,
              onNext: handleNextDay,
              visibleDays,
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
      {/* Tabs estilo Partes (Tabs02 - selecionado roxo) */}
      <AnimatedIconTabs
        tabs={TABS_UI}
        value={visualizacao}
        onValueChange={handleVisualizacaoChange}
        className="w-full"
        listClassName="flex-wrap"
      />

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
