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
import { useRouter } from 'next/navigation';
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
  eachDayOfInterval,
  isSameDay,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search,
  RefreshCw,
  Settings,
  AlertTriangle,
  Calendar as CalendarIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataShell, DataTable } from '@/components/shared/data-shell';
import { TableToolbar } from '@/components/ui/table-toolbar';
import {
  TemporalViewShell,
  TemporalViewContent,
  TemporalViewLoading,
  TemporalViewError,
  TemporalViewHeader,
  ViewSwitcher,
  DateNavigation,
  WeekDaysCarousel,
  type ViewType,
  type NavigationMode,
} from '@/components/shared';

import type { PaginatedResponse } from '@/lib/types';
import { ListarExpedientesParams, type Expediente } from '../domain';
import { actionListarExpedientes } from '../actions';
import { columns } from './columns';
import { ExpedienteDialog } from './expediente-dialog';
import { buildExpedientesFilterGroups, parseExpedientesFilters } from './expedientes-toolbar-filters';
import { TiposExpedientesList } from '@/features/tipos-expedientes';
import { ExpedientesTableWrapper } from './expedientes-table-wrapper';
import { ExpedientesCalendarMonth } from './expedientes-calendar-month';
import { ExpedientesCalendarYear } from './expedientes-calendar-year';

// =============================================================================
// TIPOS
// =============================================================================

type UsuarioOption = { id: number; nome_exibicao?: string; nomeExibicao?: string; nome?: string };
type TipoExpedienteOption = { id: number; tipoExpediente?: string; tipo_expediente?: string; nome?: string };

interface ExpedientesContentProps {
  visualizacao?: ViewType;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedientesContent({ visualizacao: initialView = 'semana' }: ExpedientesContentProps) {
  const router = useRouter();

  // View State
  const [visualizacao, setVisualizacao] = React.useState<ViewType>(initialView);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  // Filters State
  const [statusFilter, setStatusFilter] = React.useState<'todos' | 'pendentes' | 'baixados'>('pendentes');
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
  const [mostrarTodos, setMostrarTodos] = React.useState(false);

  // Dialog State
  const [isNovoDialogOpen, setIsNovoDialogOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  // Data State
  const [data, setData] = React.useState<PaginatedResponse<Expediente> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Aux Data State
  const [usuarios, setUsuarios] = React.useState<UsuarioOption[]>([]);
  const [tiposExpedientes, setTiposExpedientes] = React.useState<TipoExpedienteOption[]>([]);
  const [currentUserId, setCurrentUserId] = React.useState<number | null>(null);

  // Calendar Days for Week View
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Load auxiliary data and current user
  React.useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [usersResponse, tiposResponse, userResponse] = await Promise.all([
          fetch('/api/usuarios?ativo=true&limite=100'),
          fetch('/api/tipos-expedientes?limite=100'),
          fetch('/api/me').catch(() => null)
        ]);

        if (usersResponse.ok) {
          const contentType = usersResponse.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const usersRes = await usersResponse.json();
            if (usersRes.success && usersRes.data?.usuarios) {
              setUsuarios(usersRes.data.usuarios);
            }
          }
        }

        if (tiposResponse.ok) {
          const contentType = tiposResponse.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const tiposRes = await tiposResponse.json();
            if (tiposRes.success && tiposRes.data?.data) {
              setTiposExpedientes(tiposRes.data.data);
            }
          }
        }

        if (userResponse && userResponse.ok) {
          const contentType = userResponse.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const userRes = await userResponse.json();
            if (userRes.success && userRes.data?.id) {
              setCurrentUserId(userRes.data.id);
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados auxiliares:', err);
      }
    };
    fetchAuxData();
  }, []);

  // Parse filters from selected filter IDs
  const parsedFilters = React.useMemo(() => {
    return parseExpedientesFilters(selectedFilters);
  }, [selectedFilters]);

  // Fetch Data (for week view)
  const fetchData = React.useCallback(async () => {
    if (visualizacao === 'lista') return; // Lista tem sua própria lógica

    setIsLoading(true);
    setError(null);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const params: ListarExpedientesParams = {
        pagina: 1,
        limite: 100,
        busca: globalFilter || undefined,
        dataPrazoLegalInicio: dateStr,
        dataPrazoLegalFim: dateStr,
        incluirSemPrazo: true,
        baixado: false,
      };

      Object.assign(params, parsedFilters);

      if (!mostrarTodos && currentUserId) {
        params.responsavelId = currentUserId;
      }

      if (statusFilter === 'pendentes') {
        params.baixado = false;
      } else if (statusFilter === 'baixados') {
        params.baixado = true;
      } else {
        delete params.baixado;
      }

      const result = await actionListarExpedientes(params);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao listar expedientes');
      }

      setData(result.data as PaginatedResponse<Expediente>);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [visualizacao, selectedDate, globalFilter, statusFilter, parsedFilters, mostrarTodos, currentUserId]);

  React.useEffect(() => {
    if (visualizacao === 'semana') {
      fetchData();
    }
  }, [fetchData, visualizacao]);

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

  const handleSucessoOperacao = () => {
    fetchData();
    router.refresh();
  };

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

  // Handle visualization change
  const handleVisualizacaoChange = React.useCallback((value: ViewType) => {
    setVisualizacao(value);
  }, []);

  // Build filter groups with dynamic data
  const filterGroups = React.useMemo(() => {
    return buildExpedientesFilterGroups(usuarios, tiposExpedientes);
  }, [usuarios, tiposExpedientes]);

  // Count expedientes sem data e vencidos
  const tableData = data?.data ?? [];
  const total = data?.pagination.total ?? 0;
  const semDataCount = tableData.filter(e => !e.dataPrazoLegalParte).length;
  const vencidosCount = tableData.filter(e => e.prazoVencido && !e.baixadoEm).length;

  // Render badge for week carousel
  const renderDayBadge = React.useCallback((date: Date) => {
    const count = tableData.filter(e => {
      if (!e.dataPrazoLegalParte) return false;
      try {
        return isSameDay(parseISO(e.dataPrazoLegalParte), date);
      } catch {
        return false;
      }
    }).length;
    if (count === 0) return null;
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
        {count}
      </Badge>
    );
  }, [tableData]);

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
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9 w-[180px] pl-8"
            />
          </div>
        ) : undefined
      }
      filters={
        visualizacao !== 'lista' ? (
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
        visualizacao !== 'lista' ? (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => fetchData()}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atualizar</TooltipContent>
            </Tooltip>

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
          <ExpedientesCalendarMonth />
        </TemporalViewContent>
      ) : visualizacao === 'ano' ? (
        <TemporalViewContent>
          <ExpedientesCalendarYear />
        </TemporalViewContent>
      ) : isLoading ? (
        <TemporalViewLoading message="Carregando expedientes..." />
      ) : error ? (
        <TemporalViewError message={`Erro ao carregar expedientes: ${error}`} onRetry={fetchData} />
      ) : (
        <div className="flex flex-col h-full">
          {/* Week Days Carousel */}
          <div className="p-4 bg-card border-b">
            <WeekDaysCarousel
              currentDate={currentDate}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              weekStartsOn={0}
              renderBadge={renderDayBadge}
            />
          </div>

          {/* Day Header */}
          <TemporalViewHeader
            title={`Expedientes de ${format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}`}
            rightElement={
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{total}</Badge>
                {semDataCount > 0 && (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {semDataCount} sem data
                  </Badge>
                )}
                {vencidosCount > 0 && (
                  <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {vencidosCount} vencidos
                  </Badge>
                )}
              </div>
            }
          />

          {/* User filter info */}
          {!mostrarTodos && currentUserId && (
            <div className="px-4 py-2 text-sm text-muted-foreground border-b bg-muted/30">
              Mostrando apenas seus expedientes.{' '}
              <Button
                variant="link"
                className="h-auto p-0 text-primary"
                onClick={() => setMostrarTodos(true)}
              >
                Ver todos
              </Button>
            </div>
          )}
          {mostrarTodos && (
            <div className="px-4 py-2 text-sm text-muted-foreground border-b bg-muted/30">
              Mostrando todos os expedientes.{' '}
              <Button
                variant="link"
                className="h-auto p-0 text-primary"
                onClick={() => setMostrarTodos(false)}
              >
                Ver apenas meus
              </Button>
            </div>
          )}

          {/* Data Table */}
          <div className="flex-1 overflow-auto">
            <DataTable
              data={tableData}
              columns={columns}
              isLoading={isLoading}
              error={error}
              hidePagination={true}
              hideTableBorder={true}
              options={{
                meta: {
                  usuarios,
                  tiposExpedientes,
                  onSuccess: handleSucessoOperacao,
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ExpedienteDialog
        open={isNovoDialogOpen}
        onOpenChange={setIsNovoDialogOpen}
        onSuccess={handleSucessoOperacao}
      />

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
