'use client';

/**
 * EXPEDIENTES FEATURE - ExpedientesTableWrapper
 *
 * Componente Client que encapsula a tabela de expedientes.
 * Implementação seguindo o padrão DataShell.
 * Referência: src/features/partes/components/clientes/clientes-table-wrapper.tsx
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { format, startOfDay, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { X } from 'lucide-react';

import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import { DaysCarousel } from '@/components/shared';
import { useDebounce } from '@/hooks/use-debounce';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';

import type { PaginatedResponse } from '@/types';
import type { Expediente, ListarExpedientesParams, ExpedientesFilters } from '../domain';
import { CodigoTribunal, GrauTribunal, GRAU_TRIBUNAL_LABELS, OrigemExpediente, ORIGEM_EXPEDIENTE_LABELS } from '../domain';
import { actionListarExpedientes } from '../actions';
import { actionListarUsuarios } from '@/features/usuarios';
import { columns } from './columns';
import { ExpedienteDialog } from './expediente-dialog';
import { ExpedientesBulkActions } from './expedientes-bulk-actions';

// =============================================================================
// TIPOS
// =============================================================================

interface DaysCarouselProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  startDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  visibleDays: number;
}

interface ExpedientesTableWrapperProps {
  initialData?: PaginatedResponse<Expediente>;
  fixedDate?: Date;
  hideDateFilters?: boolean;
  /** Props para renderizar o DaysCarousel dentro do wrapper */
  daysCarouselProps?: DaysCarouselProps;
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
}

type UsuarioOption = {
  id: number;
  nomeExibicao?: string;
  nome_exibicao?: string;
  nome?: string;
};

type TipoExpedienteOption = {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
};

type PrazoFilterType = 'todos' | 'vencidos' | 'hoje' | 'amanha' | 'semana' | 'sem_prazo';
type StatusFilterType = 'todos' | 'pendentes' | 'baixados';
type ResponsavelFilterType = 'todos' | 'sem_responsavel' | number;

// Helper para obter nome do usuário
function getUsuarioNome(u: UsuarioOption): string {
  return u.nomeExibicao || u.nome_exibicao || u.nome || `Usuário ${u.id}`;
}

// Helper para obter nome do tipo
function getTipoNome(t: TipoExpedienteOption): string {
  return t.tipoExpediente || t.tipo_expediente || `Tipo ${t.id}`;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedientesTableWrapper({ initialData, fixedDate, hideDateFilters, daysCarouselProps, viewModeSlot }: ExpedientesTableWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---------- Estado da Tabela (DataShell pattern) ----------
  const [table, setTable] = React.useState<TanstackTable<Expediente> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // ---------- Estado de Paginação ----------
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(initialData?.pagination.limit || 10);
  const [total, setTotal] = React.useState(initialData?.pagination.total || 0);
  const [totalPages, setTotalPages] = React.useState(initialData?.pagination.totalPages || 0);

  // ---------- Estado de Loading/Error ----------
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ---------- Estado dos Dados ----------
  const [expedientes, setExpedientes] = React.useState<Expediente[]>(initialData?.data || []);

  // ---------- Estado de Filtros Primários ----------
  const [busca, setBusca] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilterType>('pendentes');
  const [prazoFilter, setPrazoFilter] = React.useState<PrazoFilterType>('todos');
  const [responsavelFilter, setResponsavelFilter] = React.useState<ResponsavelFilterType>('todos');
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date } | undefined>(undefined);

  // ---------- Track se já inicializou com query param ----------
  const hasInitializedFromParams = React.useRef(false);

  // ---------- Sincronizar responsavelFilter com query param (apenas no mount) ----------
  React.useEffect(() => {
    // Só sincroniza na primeira vez (mount) para evitar loops
    if (hasInitializedFromParams.current) return;
    hasInitializedFromParams.current = true;

    const responsavelParam = searchParams.get('responsavel');
    if (!responsavelParam) return;

    if (responsavelParam === 'sem_responsavel') {
      setResponsavelFilter('sem_responsavel');
    } else {
      const parsed = parseInt(responsavelParam, 10);
      if (!Number.isNaN(parsed)) {
        setResponsavelFilter(parsed);
      }
    }
  }, [searchParams]);

  // ---------- Estado de Filtros Secundários (Mais Filtros) ----------
  const [tribunalFilter, setTribunalFilter] = React.useState<string[]>([]);
  const [grauFilter, setGrauFilter] = React.useState<string[]>([]);
  const [tipoExpedienteFilter, setTipoExpedienteFilter] = React.useState<number[]>([]);
  const [origemFilter, setOrigemFilter] = React.useState<string[]>([]);
  const [semTipoFilter, setSemTipoFilter] = React.useState(false);
  const [segredoJusticaFilter, setSegredoJusticaFilter] = React.useState(false);
  const [prioridadeFilter, setPrioridadeFilter] = React.useState(false);

  // ---------- Estado de Dialogs ----------
  const [isNovoDialogOpen, setIsNovoDialogOpen] = React.useState(false);

  // ---------- Dados Auxiliares ----------
  const [usuarios, setUsuarios] = React.useState<UsuarioOption[]>([]);
  const [tiposExpedientes, setTiposExpedientes] = React.useState<TipoExpedienteOption[]>([]);

  // Debounce da busca (500ms)
  const buscaDebounced = useDebounce(busca, 500);

  // ---------- Carregar dados auxiliares ----------
  React.useEffect(() => {
    const fetchAuxData = async () => {
      try {
        // Fetch users via server action and tipos via API
        const [usersRes, tiposRes] = await Promise.all([
          actionListarUsuarios({ ativo: true, limite: 100 }),
          fetch('/api/tipos-expedientes?limite=100').then((r) => r.json()),
        ]);

        // Handle usuarios from server action
        if (usersRes.success && usersRes.data?.usuarios) {
          setUsuarios(usersRes.data.usuarios as UsuarioOption[]);
        }

        // Handle tipos from API
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

  // ---------- Calcular datas para filtro de prazo ----------
  const getPrazoDates = React.useCallback((prazo: PrazoFilterType): { from?: string; to?: string } | null => {
    const hoje = new Date();

    switch (prazo) {
      case 'vencidos':
        // Prazo vencido é tratado pelo campo prazoVencido, não por datas
        return null;
      case 'hoje':
        const hojeStr = format(startOfDay(hoje), 'yyyy-MM-dd');
        return { from: hojeStr, to: hojeStr };
      case 'amanha':
        const amanha = addDays(hoje, 1);
        const amanhaStr = format(startOfDay(amanha), 'yyyy-MM-dd');
        return { from: amanhaStr, to: amanhaStr };
      case 'semana':
        // Segunda a Domingo da semana atual
        const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
        const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });
        return {
          from: format(inicioSemana, 'yyyy-MM-dd'),
          to: format(fimSemana, 'yyyy-MM-dd'),
        };
      case 'sem_prazo':
        // Tratado separadamente
        return null;
      default:
        return null;
    }
  }, []);

  // ---------- Refetch Function ----------
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ListarExpedientesParams = {
        pagina: pageIndex + 1, // API usa 1-based
        limite: pageSize,
        busca: buscaDebounced || undefined,
      };

      const filters: ExpedientesFilters = {};

      // Filtro de Status (Pendentes/Baixados)
      if (statusFilter === 'pendentes') filters.baixado = false;
      if (statusFilter === 'baixados') filters.baixado = true;

      // Filtro de Prazo
      if (prazoFilter === 'vencidos') {
        filters.prazoVencido = true;
      } else if (prazoFilter === 'sem_prazo') {
        filters.semPrazo = true;
        // Não definir datas para buscar apenas sem prazo
      } else if (prazoFilter !== 'todos') {
        const prazoDates = getPrazoDates(prazoFilter);
        if (prazoDates) {
          filters.dataPrazoLegalInicio = prazoDates.from;
          filters.dataPrazoLegalFim = prazoDates.to;
        }
      }

      // Filtro de Responsável
      if (responsavelFilter === 'sem_responsavel') {
        filters.semResponsavel = true;
      } else if (typeof responsavelFilter === 'number') {
        filters.responsavelId = responsavelFilter;
      }

      // Date Range (sobrescreve prazoFilter se definido)
      if (dateRange?.from) filters.dataPrazoLegalInicio = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange?.to) filters.dataPrazoLegalFim = format(dateRange.to, 'yyyy-MM-dd');

      // Fixed Date (override manual filters)
      if (fixedDate) {
        const dateStr = format(fixedDate, 'yyyy-MM-dd');
        filters.dataPrazoLegalInicio = dateStr;
        filters.dataPrazoLegalFim = dateStr;
        filters.incluirSemPrazo = false; // Na visão de dia, geralmente queremos ver o que é do dia
        delete filters.prazoVencido;
      }

      // Filtros Secundários
      if (tribunalFilter.length === 1) {
        filters.trt = tribunalFilter[0] as typeof CodigoTribunal[number];
      }
      if (grauFilter.length === 1) {
        filters.grau = grauFilter[0] as GrauTribunal;
      }
      if (tipoExpedienteFilter.length === 1) {
        filters.tipoExpedienteId = tipoExpedienteFilter[0];
      }
      if (semTipoFilter) {
        filters.semTipo = true;
      }
      if (segredoJusticaFilter) {
        filters.segredoJustica = true;
      }
      if (origemFilter.length === 1) {
        filters.origem = origemFilter[0] as OrigemExpediente;
      }
      if (prioridadeFilter) {
        filters.prioridadeProcessual = true;
      }

      const mergedParams: ListarExpedientesParams = {
        ...params,
        ...filters,
      };

      const result = await actionListarExpedientes(mergedParams);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao listar expedientes');
      }

      const responseData = result.data as PaginatedResponse<Expediente>;
      setExpedientes(responseData.data);
      setTotal(responseData.pagination.total);
      setTotalPages(responseData.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [
    pageIndex,
    pageSize,
    buscaDebounced,
    statusFilter,
    prazoFilter,
    responsavelFilter,
    dateRange,
    tribunalFilter,
    grauFilter,
    tipoExpedienteFilter,
    origemFilter,
    semTipoFilter,
    segredoJusticaFilter,
    prioridadeFilter,
    getPrazoDates,
    fixedDate,
  ]);

  // ---------- Skip First Render ----------
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    // Se tivermos dados iniciais, pular o primeiro fetch
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialData) return;
    }
    refetch();
  }, [refetch, initialData]);

  // ---------- Handlers ----------
  const handleSucessoOperacao = React.useCallback(() => {
    refetch();
    router.refresh();
  }, [refetch, router]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setIsNovoDialogOpen(false);
    router.refresh();
  }, [refetch, router]);

  // Handler para limpar todos os filtros
  const handleClearAllFilters = React.useCallback(() => {
    setStatusFilter('pendentes');
    setPrazoFilter('todos');
    setResponsavelFilter('todos');
    setDateRange(undefined);
    setTribunalFilter([]);
    setGrauFilter([]);
    setTipoExpedienteFilter([]);
    setOrigemFilter([]);
    setSemTipoFilter(false);
    setSegredoJusticaFilter(false);
    setPrioridadeFilter(false);
    setPageIndex(0);
  }, []);

  // Gerar chips de filtros ativos
  const activeFilterChips = React.useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (statusFilter !== 'pendentes') {
      chips.push({
        key: 'status',
        label: statusFilter === 'todos' ? 'Todos Status' : 'Baixados',
        onRemove: () => setStatusFilter('pendentes'),
      });
    }

    if (prazoFilter !== 'todos') {
      const prazoLabels: Record<PrazoFilterType, string> = {
        todos: 'Todos',
        vencidos: 'Vencidos',
        hoje: 'Hoje',
        amanha: 'Amanhã',
        semana: 'Esta Semana',
        sem_prazo: 'Sem Prazo',
      };
      chips.push({
        key: 'prazo',
        label: prazoLabels[prazoFilter],
        onRemove: () => setPrazoFilter('todos'),
      });
    }

    if (responsavelFilter === 'sem_responsavel') {
      chips.push({
        key: 'responsavel',
        label: 'Sem Responsável',
        onRemove: () => setResponsavelFilter('todos'),
      });
    } else if (typeof responsavelFilter === 'number') {
      const usuario = usuarios.find((u) => u.id === responsavelFilter);
      chips.push({
        key: 'responsavel',
        label: usuario ? getUsuarioNome(usuario) : `Responsável #${responsavelFilter}`,
        onRemove: () => setResponsavelFilter('todos'),
      });
    }

    if (dateRange?.from || dateRange?.to) {
      const fromStr = dateRange.from ? format(dateRange.from, 'dd/MM') : '';
      const toStr = dateRange.to ? format(dateRange.to, 'dd/MM') : '';
      chips.push({
        key: 'dateRange',
        label: `${fromStr} - ${toStr}`,
        onRemove: () => setDateRange(undefined),
      });
    }

    tribunalFilter.forEach((trt) => {
      chips.push({
        key: `tribunal-${trt}`,
        label: trt,
        onRemove: () => setTribunalFilter((prev) => prev.filter((t) => t !== trt)),
      });
    });

    grauFilter.forEach((grau) => {
      chips.push({
        key: `grau-${grau}`,
        label: GRAU_TRIBUNAL_LABELS[grau as GrauTribunal] || grau,
        onRemove: () => setGrauFilter((prev) => prev.filter((g) => g !== grau)),
      });
    });

    tipoExpedienteFilter.forEach((tipoId) => {
      const tipo = tiposExpedientes.find((t) => t.id === tipoId);
      chips.push({
        key: `tipo-${tipoId}`,
        label: tipo ? getTipoNome(tipo) : `Tipo #${tipoId}`,
        onRemove: () => setTipoExpedienteFilter((prev) => prev.filter((t) => t !== tipoId)),
      });
    });

    origemFilter.forEach((origem) => {
      chips.push({
        key: `origem-${origem}`,
        label: ORIGEM_EXPEDIENTE_LABELS[origem as OrigemExpediente] || origem,
        onRemove: () => setOrigemFilter((prev) => prev.filter((o) => o !== origem)),
      });
    });

    if (semTipoFilter) {
      chips.push({
        key: 'semTipo',
        label: 'Sem Tipo',
        onRemove: () => setSemTipoFilter(false),
      });
    }

    if (segredoJusticaFilter) {
      chips.push({
        key: 'segredo',
        label: 'Segredo de Justiça',
        onRemove: () => setSegredoJusticaFilter(false),
      });
    }

    if (prioridadeFilter) {
      chips.push({
        key: 'prioridade',
        label: 'Prioridade',
        onRemove: () => setPrioridadeFilter(false),
      });
    }

    return chips;
  }, [
    statusFilter,
    prazoFilter,
    responsavelFilter,
    dateRange,
    tribunalFilter,
    grauFilter,
    tipoExpedienteFilter,
    origemFilter,
    semTipoFilter,
    segredoJusticaFilter,
    prioridadeFilter,
    usuarios,
    tiposExpedientes,
  ]);

  // ---------- Render ----------
  return (
    <>
      <DataShell
        header={
          table ? (
            <>
              {Object.keys(rowSelection).length > 0 && (
                <ExpedientesBulkActions
                  selectedRows={expedientes.filter((exp) => rowSelection[exp.id.toString()])}
                  usuarios={usuarios.map(u => ({ id: u.id, nomeExibicao: getUsuarioNome(u) }))}
                  onSuccess={() => {
                    setRowSelection({});
                    handleSucessoOperacao();
                  }}
                />
              )}
              <DataTableToolbar
                table={table}
                title="Expedientes"
                density={density}
                onDensityChange={setDensity}
                searchValue={busca}
                onSearchValueChange={(value) => {
                  setBusca(value);
                  setPageIndex(0);
                }}
                searchPlaceholder="Buscar expedientes..."
                actionButton={{
                  label: 'Novo Expediente',
                  onClick: () => setIsNovoDialogOpen(true),
                }}
                viewModeSlot={viewModeSlot}
                filtersSlot={
                  <>
                    {/* Status Filter */}
                    <Select
                      value={statusFilter}
                      onValueChange={(v: StatusFilterType) => {
                        setStatusFilter(v);
                        setPageIndex(0);
                      }}
                    >
                      <SelectTrigger className="w-32.5 bg-card">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="pendentes">Pendentes</SelectItem>
                        <SelectItem value="baixados">Baixados</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Prazo Filter - Hide if date is fixed */}
                    {!hideDateFilters && (
                      <Select
                        value={prazoFilter}
                        onValueChange={(v: PrazoFilterType) => {
                          setPrazoFilter(v);
                          setDateRange(undefined); // Limpa date range ao usar prazo
                          setPageIndex(0);
                        }}
                      >
                        <SelectTrigger className="w-37.5 bg-card">
                          <SelectValue placeholder="Prazo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos Prazos</SelectItem>
                          <SelectItem value="vencidos">Vencidos</SelectItem>
                          <SelectItem value="hoje">Vence Hoje</SelectItem>
                          <SelectItem value="amanha">Vence Amanhã</SelectItem>
                          <SelectItem value="semana">Esta Semana</SelectItem>
                          <SelectItem value="sem_prazo">Sem Prazo</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {/* Responsável Filter */}
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
                        setPageIndex(0);
                      }}
                    >
                      <SelectTrigger className="w-40 bg-card">
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

                    {/* Date Range Picker - Hide if date is fixed */}
                    {!hideDateFilters && (
                      <DateRangePicker
                        value={dateRange}
                        onChange={(range) => {
                          setDateRange(range);
                          if (range?.from || range?.to) {
                            setPrazoFilter('todos'); // Limpa prazo ao usar date range
                          }
                          setPageIndex(0);
                        }}
                        placeholder="Período"
                        className="w-60 bg-card"
                      />
                    )}

                    {/* Tribunal Filter */}
                    <Select
                      value={tribunalFilter[0] || '_all'}
                      onValueChange={(v) => {
                        setTribunalFilter(v === '_all' ? [] : [v]);
                        setPageIndex(0);
                      }}
                    >
                      <SelectTrigger className="w-30 bg-card">
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

                    {/* Grau Filter */}
                    <Select
                      value={grauFilter[0] || '_all'}
                      onValueChange={(v) => {
                        setGrauFilter(v === '_all' ? [] : [v]);
                        setPageIndex(0);
                      }}
                    >
                      <SelectTrigger className="w-32.5 bg-card">
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

                    {/* Tipo Filter */}
                    <Select
                      value={tipoExpedienteFilter[0]?.toString() || '_all'}
                      onValueChange={(v) => {
                        setTipoExpedienteFilter(v === '_all' ? [] : [parseInt(v, 10)]);
                        setSemTipoFilter(false);
                        setPageIndex(0);
                      }}
                    >
                      <SelectTrigger className="w-40 bg-card">
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

                    {/* Origem Filter */}
                    <Select
                      value={origemFilter[0] || '_all'}
                      onValueChange={(v) => {
                        setOrigemFilter(v === '_all' ? [] : [v]);
                        setPageIndex(0);
                      }}
                    >
                      <SelectTrigger className="w-30 bg-card">
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
                  </>
                }
              />

              {/* Days Carousel - apenas quando daysCarouselProps existe */}
              {daysCarouselProps && (
                <>
                  <div className="border-t border-border" />
                  <div className="px-6 py-4">
                    <DaysCarousel
                      selectedDate={daysCarouselProps.selectedDate}
                      onDateSelect={daysCarouselProps.onDateSelect}
                      startDate={daysCarouselProps.startDate}
                      onPrevious={daysCarouselProps.onPrevious}
                      onNext={daysCarouselProps.onNext}
                      visibleDays={daysCarouselProps.visibleDays}
                    />
                  </div>
                </>
              )}

              {/* Active Filter Chips */}
              {activeFilterChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
                  <span className="text-sm text-muted-foreground">Filtros:</span>
                  {activeFilterChips.map((chip) => (
                    <AppBadge
                      key={chip.key}
                      variant="secondary"
                      className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                    >
                      {chip.label}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={chip.onRemove}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </AppBadge>
                  ))}
                  {activeFilterChips.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={handleClearAllFilters}
                    >
                      Limpar todos
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : undefined
        }
        footer={
          totalPages > 0 ? (
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPageIndex}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPageIndex(0);
              }}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          data={expedientes}
          columns={columns}
          isLoading={isLoading}
          error={error}
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<Expediente>)}
          emptyMessage="Nenhum expediente encontrado."
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange: setRowSelection,
            getRowId: (row) => row.id.toString(),
          }}
          options={{
            meta: {
              usuarios,
              tiposExpedientes,
              onSuccess: handleSucessoOperacao,
            },
          }}
        />
      </DataShell >

      <ExpedienteDialog
        open={isNovoDialogOpen}
        onOpenChange={setIsNovoDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}

