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
 * - TemporalViewShell: Container unificado
 * - ViewSwitcher: Alternância entre visualizações
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
  Filter,
  Building2,
  Scale,
  FileType,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
// Dialog imports removed as they are replaced by DialogFormShell
import { DialogFormShell } from '@/components/shared/dialog-form-shell';

import { CodigoTribunal, GrauTribunal, GRAU_TRIBUNAL_LABELS, OrigemExpediente, ORIGEM_EXPEDIENTE_LABELS } from '../domain';
import { actionListarUsuarios } from '@/features/usuarios';
// Removed DataTable import
import {
  TemporalViewShell,
  TemporalViewContent,
  TemporalViewLoading,
  ViewSwitcher,
  DaysCarousel,
  MonthsCarousel,
  YearsCarousel,
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
  const [responsavelFilter, setResponsavelFilter] = React.useState<'todos' | 'sem_responsavel' | number>('todos');

  // Filtros Avançados
  const [tribunalFilter, setTribunalFilter] = React.useState<string[]>([]);
  const [grauFilter, setGrauFilter] = React.useState<string[]>([]);
  const [tipoExpedienteFilter, setTipoExpedienteFilter] = React.useState<number[]>([]);
  const [origemFilter, setOrigemFilter] = React.useState<string[]>([]);
  const [semTipoFilter, setSemTipoFilter] = React.useState(false);
  const [segredoJusticaFilter, setSegredoJusticaFilter] = React.useState(false);
  const [prioridadeFilter, setPrioridadeFilter] = React.useState(false);

  // Popover State
  const [moreFiltersOpen, setMoreFiltersOpen] = React.useState(false);

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

  // Contar filtros avançados ativos
  const activeAdvancedFiltersCount = React.useMemo(() => {
    let count = 0;
    if (responsavelFilter !== 'todos') count++;
    if (tribunalFilter.length > 0) count++;
    if (grauFilter.length > 0) count++;
    if (tipoExpedienteFilter.length > 0) count++;
    if (origemFilter.length > 0) count++;
    if (semTipoFilter) count++;
    if (segredoJusticaFilter) count++;
    if (prioridadeFilter) count++;
    return count;
  }, [responsavelFilter, tribunalFilter, grauFilter, tipoExpedienteFilter, origemFilter, semTipoFilter, segredoJusticaFilter, prioridadeFilter]);

  // Limpar filtros avançados
  const handleClearAdvancedFilters = React.useCallback(() => {
    setResponsavelFilter('todos');
    setTribunalFilter([]);
    setGrauFilter([]);
    setTipoExpedienteFilter([]);
    setOrigemFilter([]);
    setSemTipoFilter(false);
    setSegredoJusticaFilter(false);
    setPrioridadeFilter(false);
  }, []);

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
  const visibleYears = 10;

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
  const handleVisualizacaoChange = React.useCallback((value: ViewType) => {
    const targetRoute = VIEW_ROUTES[value];
    if (targetRoute && targetRoute !== pathname) {
      router.push(targetRoute);
    }
    setVisualizacao(value);
  }, [pathname, router]);

  // Barra de filtros reutilizável para mês e ano
  const renderFiltersBar = () => (
    <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-card border rounded-md">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 w-[200px] pl-8 bg-white dark:bg-card"
          />
        </div>

        {/* Status */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="h-9 w-[130px] bg-white dark:bg-card">
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
          <SelectTrigger className="h-9 w-[160px] bg-white dark:bg-card">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="sem_responsavel">Sem Responsável</SelectItem>
            {usuarios.map((usuario) => (
              <SelectItem key={usuario.id} value={String(usuario.id)}>
                {getUsuarioNome(usuario)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mais Filtros */}
        <Popover open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 bg-white dark:bg-card">
              <Filter className="h-4 w-4" />
              Mais Filtros
              {activeAdvancedFiltersCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {activeAdvancedFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px]" align="end">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Filtros Avançados</h4>
                <p className="text-sm text-muted-foreground">
                  Configure filtros adicionais para refinar sua busca.
                </p>
              </div>
              <Separator />

              {/* Tribunal */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Tribunal
                </Label>
                <Select
                  value={tribunalFilter[0] || '_all'}
                  onValueChange={(v) => {
                    setTribunalFilter(v === '_all' ? [] : [v]);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todos</SelectItem>
                    {CodigoTribunal.map((trt) => (
                      <SelectItem key={trt} value={trt}>
                        {trt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Grau */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Grau
                </Label>
                <Select
                  value={grauFilter[0] || '_all'}
                  onValueChange={(v) => {
                    setGrauFilter(v === '_all' ? [] : [v]);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todos</SelectItem>
                    {Object.entries(GRAU_TRIBUNAL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Expediente */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileType className="h-4 w-4" />
                  Tipo de Expediente
                </Label>
                <Select
                  value={tipoExpedienteFilter[0]?.toString() || '_all'}
                  onValueChange={(v) => {
                    setTipoExpedienteFilter(v === '_all' ? [] : [parseInt(v, 10)]);
                    setSemTipoFilter(false);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todos</SelectItem>
                    {tiposExpedientes.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        {getTipoNome(tipo)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Origem */}
              <div className="space-y-2">
                <Label>Origem</Label>
                <Select
                  value={origemFilter[0] || '_all'}
                  onValueChange={(v) => {
                    setOrigemFilter(v === '_all' ? [] : [v]);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Todas</SelectItem>
                    {Object.entries(ORIGEM_EXPEDIENTE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="semTipo"
                    checked={semTipoFilter}
                    onCheckedChange={(checked) => {
                      setSemTipoFilter(!!checked);
                      if (checked) setTipoExpedienteFilter([]);
                    }}
                  />
                  <Label htmlFor="semTipo" className="text-sm cursor-pointer">
                    Sem Tipo Definido
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="segredo"
                    checked={segredoJusticaFilter}
                    onCheckedChange={(checked) => {
                      setSegredoJusticaFilter(!!checked);
                    }}
                  />
                  <Label htmlFor="segredo" className="text-sm cursor-pointer">
                    Segredo de Justiça
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prioridade"
                    checked={prioridadeFilter}
                    onCheckedChange={(checked) => {
                      setPrioridadeFilter(!!checked);
                    }}
                  />
                  <Label htmlFor="prioridade" className="text-sm cursor-pointer">
                    Prioridade Processual
                  </Label>
                </div>
              </div>

              <Separator />

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleClearAdvancedFilters();
                  setMoreFiltersOpen(false);
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </PopoverContent>
        </Popover>
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

  return (
    <TemporalViewShell
      headerClassName="border-b-0"
      viewSwitcher={
        <ViewSwitcher
          value={visualizacao}
          onValueChange={handleVisualizacaoChange}
        />
      }
    >
      {/* Content */}
      {visualizacao === 'lista' ? (
        <ExpedientesTableWrapper />
      ) : visualizacao === 'mes' ? (
        <div className="flex flex-col h-full">
          {/* Months Carousel */}
          <div className="p-4 bg-card border rounded-md mb-4 shrink-0">
            <MonthsCarousel
              selectedDate={currentDate}
              onDateSelect={setCurrentDate}
              startMonth={startMonth}
              onPrevious={handlePreviousMonth}
              onNext={handleNextMonth}
              visibleMonths={visibleMonths}
            />
          </div>

          {/* Filters Bar */}
          {renderFiltersBar()}

          {/* Calendar Content */}
          <TemporalViewContent className="mt-4">
            <ExpedientesCalendarMonth
              currentDate={currentDate}
              statusFilter={statusFilter}
              globalFilter={globalFilter}
              onLoadingChange={setIsLoading}
            />
          </TemporalViewContent>
        </div>
      ) : visualizacao === 'ano' ? (
        <div className="flex flex-col h-full">
          {/* Years Carousel */}
          <div className="p-4 bg-card border rounded-md mb-4 shrink-0">
            <YearsCarousel
              selectedDate={currentDate}
              onDateSelect={setCurrentDate}
              startYear={startYear}
              onPrevious={handlePreviousYear}
              onNext={handleNextYear}
              visibleYears={visibleYears}
            />
          </div>

          {/* Filters Bar */}
          {renderFiltersBar()}

          {/* Calendar Content */}
          <TemporalViewContent className="mt-4">
            <ExpedientesCalendarYear
              currentDate={currentDate}
              statusFilter={statusFilter}
              globalFilter={globalFilter}
              onLoadingChange={setIsLoading}
            />
          </TemporalViewContent>
        </div>
      ) : visualizacao === 'semana' ? (
        <div className="flex flex-col h-full">
          {/* Days Carousel com navegação por dia */}
          <div className="p-4 bg-card border rounded-md mb-4 shrink-0">
            <DaysCarousel
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              startDate={startDate}
              onPrevious={handlePreviousDay}
              onNext={handleNextDay}
              visibleDays={visibleDays}
            />
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
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
    </TemporalViewShell>
  );
}
