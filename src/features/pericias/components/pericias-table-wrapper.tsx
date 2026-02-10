'use client';

/**
 * PERÍCIAS FEATURE - PericiasTableWrapper
 *
 * Segue o padrão DataShell/DataTable do projeto (espelhado de Expedientes).
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { format, startOfDay, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { X } from 'lucide-react';

import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import { WeekNavigator, type WeekNavigatorProps } from '@/components/shared';
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
import type { Pericia, ListarPericiasParams, PericiasFilters } from '../domain';
import { CodigoTribunal } from '../domain';
import { GrauTribunal as GrauTribunalEnum } from '@/features/expedientes/domain';
import { GRAU_TRIBUNAL_LABELS } from '@/features/expedientes/domain';
import {
  SituacaoPericiaCodigo,
  SITUACAO_PERICIA_LABELS,
} from '../domain';
import {
  actionListarPericias,
  actionListarEspecialidadesPericia,
} from '../actions/pericias-actions';
import { actionListarUsuarios } from '@/features/usuarios';
import { actionListarTerceiros } from '@/features/partes/actions/terceiros-actions';
import type { EspecialidadePericiaOption, UsuarioOption, PeritoOption } from '../types';
import { columns } from './columns';

interface PericiasTableWrapperProps {
  initialData?: PaginatedResponse<Pericia>;
  fixedDate?: Date;
  hideDateFilters?: boolean;
  /** Props para renderizar o WeekNavigator dentro do wrapper */
  weekNavigatorProps?: Omit<WeekNavigatorProps, 'className' | 'variant'>;
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
  /** Callback para abrir o dialog de criar nova perícia */
  onNovaPericiaClick?: () => void;
}

type ResponsavelFilterType = 'todos' | 'sem_responsavel' | number;
type LaudoFilterType = 'todos' | 'sim' | 'nao';

function getUsuarioNome(u: UsuarioOption): string {
  return (
    u.nomeExibicao ||
    u.nome_exibicao ||
    u.nomeCompleto ||
    u.nome ||
    `Usuário ${u.id}`
  );
}

export function PericiasTableWrapper({
  initialData,
  fixedDate,
  hideDateFilters,
  weekNavigatorProps,
  viewModeSlot,
  onNovaPericiaClick,
}: PericiasTableWrapperProps) {
  const router = useRouter();

  // ---------- Estado da Tabela ----------
  const [table, setTable] = React.useState<TanstackTable<Pericia> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // ---------- Paginação ----------
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(initialData?.pagination.limit || 10);
  const [total, setTotal] = React.useState(initialData?.pagination.total || 0);
  const [totalPages, setTotalPages] = React.useState(initialData?.pagination.totalPages || 0);

  // ---------- Loading/Error ----------
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ---------- Dados ----------
  const [pericias, setPericias] = React.useState<Pericia[]>(initialData?.data || []);

  // ---------- Filtros ----------
  const [busca, setBusca] = React.useState('');
  const buscaDebounced = useDebounce(busca, 500);

  const [situacaoFilter, setSituacaoFilter] = React.useState<'todos' | SituacaoPericiaCodigo>('todos');
  const [responsavelFilter, setResponsavelFilter] = React.useState<ResponsavelFilterType>('todos');
  const [laudoFilter, setLaudoFilter] = React.useState<LaudoFilterType>('todos');
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date } | undefined>(undefined);

  // Secundários
  const [tribunalFilter, setTribunalFilter] = React.useState<string[]>([]);
  const [grauFilter, setGrauFilter] = React.useState<string[]>([]);
  const [especialidadeFilter, setEspecialidadeFilter] = React.useState<number[]>([]);
  const [peritoFilter, setPeritoFilter] = React.useState<number[]>([]);

  // Auxiliares
  const [usuarios, setUsuarios] = React.useState<UsuarioOption[]>([]);
  const [especialidades, setEspecialidades] = React.useState<EspecialidadePericiaOption[]>([]);
  const [peritos, setPeritos] = React.useState<PeritoOption[]>([]);

  React.useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [usersRes, espRes, peritosRes] = await Promise.all([
          actionListarUsuarios({ ativo: true, limite: 200 }),
          actionListarEspecialidadesPericia(),
          actionListarTerceiros({ limite: 200, tipo_parte: 'PERITO', situacao: 'A' }),
        ]);

        if (usersRes.success && usersRes.data?.usuarios) {
          setUsuarios(usersRes.data.usuarios as UsuarioOption[]);
        }

        if (espRes.success) {
          const payload = espRes.data as { especialidades?: EspecialidadePericiaOption[] };
          setEspecialidades(payload.especialidades || []);
        }

        if (peritosRes.success && peritosRes.data?.data) {
          const arr = (peritosRes.data.data as unknown as { id: number; nome: string }[]) || [];
          setPeritos(arr.map((p) => ({ id: p.id, nome: p.nome })));
        }
      } catch (e) {
        console.error('Erro ao carregar dados auxiliares:', e);
      }
    };
    fetchAuxData();
  }, []);

  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ListarPericiasParams = {
        pagina: pageIndex + 1,
        limite: pageSize,
        busca: buscaDebounced || undefined,
      };

      const filters: PericiasFilters = {};

      if (situacaoFilter !== 'todos') {
        filters.situacaoCodigo = situacaoFilter;
      } else {
        // Filtro padrão: excluir Finalizadas e Canceladas
        filters.situacoesExcluidas = [
          SituacaoPericiaCodigo.FINALIZADA,
          SituacaoPericiaCodigo.CANCELADA,
        ];
      }

      if (responsavelFilter === 'sem_responsavel') {
        filters.semResponsavel = true;
      } else if (typeof responsavelFilter === 'number') {
        filters.responsavelId = responsavelFilter;
      }

      if (laudoFilter === 'sim') filters.laudoJuntado = true;
      if (laudoFilter === 'nao') filters.laudoJuntado = false;

      if (dateRange?.from) filters.prazoEntregaInicio = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange?.to) filters.prazoEntregaFim = format(dateRange.to, 'yyyy-MM-dd');

      if (fixedDate) {
        const dateStr = format(fixedDate, 'yyyy-MM-dd');
        filters.prazoEntregaInicio = dateStr;
        filters.prazoEntregaFim = dateStr;
      }

      if (tribunalFilter.length === 1) {
        filters.trt = tribunalFilter[0] as typeof CodigoTribunal[number];
      }
      if (grauFilter.length === 1) {
        filters.grau = grauFilter[0] as GrauTribunalEnum;
      }
      if (especialidadeFilter.length === 1) {
        filters.especialidadeId = especialidadeFilter[0];
      }
      if (peritoFilter.length === 1) {
        filters.peritoId = peritoFilter[0];
      }

      const mergedParams: ListarPericiasParams = {
        ...params,
        ...filters,
      };

      const result = await actionListarPericias(mergedParams);
      if (!result.success) {
        throw new Error(result.message || 'Erro ao listar perícias');
      }

      const responseData = result.data as PaginatedResponse<Pericia>;
      setPericias(responseData.data);
      setTotal(responseData.pagination.total);
      setTotalPages(responseData.pagination.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [
    pageIndex,
    pageSize,
    buscaDebounced,
    situacaoFilter,
    responsavelFilter,
    laudoFilter,
    dateRange,
    fixedDate,
    tribunalFilter,
    grauFilter,
    especialidadeFilter,
    peritoFilter,
  ]);

  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialData) return;
    }
    refetch();
  }, [refetch, initialData]);

  const handleSucessoOperacao = React.useCallback(() => {
    refetch();
    router.refresh();
  }, [refetch, router]);

  const handleClearAllFilters = React.useCallback(() => {
    setSituacaoFilter('todos');
    setResponsavelFilter('todos');
    setLaudoFilter('todos');
    setDateRange(undefined);
    setTribunalFilter([]);
    setGrauFilter([]);
    setEspecialidadeFilter([]);
    setPeritoFilter([]);
    setPageIndex(0);
  }, []);

  const activeFilterChips = React.useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (situacaoFilter !== 'todos') {
      chips.push({
        key: 'situacao',
        label: SITUACAO_PERICIA_LABELS[situacaoFilter],
        onRemove: () => setSituacaoFilter('todos'),
      });
    }

    if (responsavelFilter === 'sem_responsavel') {
      chips.push({
        key: 'responsavel',
        label: 'Sem responsável',
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

    if (laudoFilter !== 'todos') {
      chips.push({
        key: 'laudo',
        label: laudoFilter === 'sim' ? 'Laudo juntado' : 'Sem laudo',
        onRemove: () => setLaudoFilter('todos'),
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
        label: GRAU_TRIBUNAL_LABELS[grau as GrauTribunalEnum] || grau,
        onRemove: () => setGrauFilter((prev) => prev.filter((g) => g !== grau)),
      });
    });

    especialidadeFilter.forEach((id) => {
      const esp = especialidades.find((e) => e.id === id);
      chips.push({
        key: `especialidade-${id}`,
        label: esp ? esp.descricao : `Especialidade #${id}`,
        onRemove: () => setEspecialidadeFilter((prev) => prev.filter((x) => x !== id)),
      });
    });

    peritoFilter.forEach((id) => {
      const p = peritos.find((x) => x.id === id);
      chips.push({
        key: `perito-${id}`,
        label: p ? p.nome : `Perito #${id}`,
        onRemove: () => setPeritoFilter((prev) => prev.filter((x) => x !== id)),
      });
    });

    return chips;
  }, [
    situacaoFilter,
    responsavelFilter,
    laudoFilter,
    dateRange,
    tribunalFilter,
    grauFilter,
    especialidadeFilter,
    peritoFilter,
    usuarios,
    especialidades,
    peritos,
  ]);

  // Helpers para filtro rápido de prazo (semana/hoje etc.) – útil para UX
  type PrazoQuick = 'todos' | 'hoje' | 'amanha' | 'semana';
  const [prazoQuick, setPrazoQuick] = React.useState<PrazoQuick>('todos');

  const getPrazoDates = React.useCallback((p: PrazoQuick) => {
    const hoje = new Date();
    switch (p) {
      case 'hoje': {
        const hojeStr = format(startOfDay(hoje), 'yyyy-MM-dd');
        return { from: hojeStr, to: hojeStr };
      }
      case 'amanha': {
        const amanha = addDays(hoje, 1);
        const amanhaStr = format(startOfDay(amanha), 'yyyy-MM-dd');
        return { from: amanhaStr, to: amanhaStr };
      }
      case 'semana': {
        const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
        const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });
        return {
          from: format(inicioSemana, 'yyyy-MM-dd'),
          to: format(fimSemana, 'yyyy-MM-dd'),
        };
      }
      default:
        return null;
    }
  }, []);

  return (
    <DataShell
      header={
        table ? (
          <>
            <DataTableToolbar
              table={table}
              title="Perícias"
              density={density}
              onDensityChange={setDensity}
              searchValue={busca}
              onSearchValueChange={(value) => {
                setBusca(value);
                setPageIndex(0);
              }}
              searchPlaceholder="Buscar perícias..."
              viewModeSlot={viewModeSlot}
              actionButton={onNovaPericiaClick ? {
                label: 'Nova Perícia',
                onClick: onNovaPericiaClick,
              } : undefined}
              filtersSlot={
                <>
                  {/* Situação */}
                  <Select
                    value={situacaoFilter === 'todos' ? '_all' : situacaoFilter}
                    onValueChange={(v) => {
                      setSituacaoFilter(v === '_all' ? 'todos' : (v as SituacaoPericiaCodigo));
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-9 w-32 border-dashed bg-card font-normal">
                      <SelectValue placeholder="Situação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Ativas</SelectItem>
                      {Object.values(SituacaoPericiaCodigo).map((codigo) => (
                        <SelectItem key={codigo} value={codigo}>
                          {SITUACAO_PERICIA_LABELS[codigo]}
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
                      if (v === 'todos') setResponsavelFilter('todos');
                      else if (v === 'sem_responsavel') setResponsavelFilter('sem_responsavel');
                      else setResponsavelFilter(parseInt(v, 10));
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-9 w-40 border-dashed bg-card font-normal">
                      <SelectValue placeholder="Responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Responsável</SelectItem>
                      <SelectItem value="sem_responsavel">Sem responsável</SelectItem>
                      {usuarios.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {getUsuarioNome(u)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Laudo juntado */}
                  <Select
                    value={laudoFilter}
                    onValueChange={(v: LaudoFilterType) => {
                      setLaudoFilter(v);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-9 w-32 border-dashed bg-card font-normal">
                      <SelectValue placeholder="Laudo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Laudo</SelectItem>
                      <SelectItem value="sim">Juntado</SelectItem>
                      <SelectItem value="nao">Não juntado</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Tribunal */}
                  <Select
                    value={tribunalFilter[0] || '_all'}
                    onValueChange={(v) => {
                      setTribunalFilter(v === '_all' ? [] : [v]);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-9 w-28 border-dashed bg-card font-normal">
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
                    value={grauFilter[0] || '_all'}
                    onValueChange={(v) => {
                      setGrauFilter(v === '_all' ? [] : [v]);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-9 w-28 border-dashed bg-card font-normal">
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

                  {/* Especialidade */}
                  <Select
                    value={especialidadeFilter[0]?.toString() || '_all'}
                    onValueChange={(v) => {
                      setEspecialidadeFilter(v === '_all' ? [] : [parseInt(v, 10)]);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-9 w-40 border-dashed bg-card font-normal">
                      <SelectValue placeholder="Especialidade" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[240px]">
                      <SelectItem value="_all">Especialidade</SelectItem>
                      {especialidades.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Perito */}
                  <Select
                    value={peritoFilter[0]?.toString() || '_all'}
                    onValueChange={(v) => {
                      setPeritoFilter(v === '_all' ? [] : [parseInt(v, 10)]);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-9 w-40 border-dashed bg-card font-normal">
                      <SelectValue placeholder="Perito" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[240px]">
                      <SelectItem value="_all">Perito</SelectItem>
                      {peritos.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtros de data (range) – oculto quando view é dia */}
                  {!hideDateFilters && (
                    <>
                      <Select
                        value={prazoQuick}
                        onValueChange={(v: PrazoQuick) => {
                          setPrazoQuick(v);
                          setPageIndex(0);
                          setDateRange(undefined);
                          const dates = getPrazoDates(v);
                          if (dates) {
                            setDateRange({
                              from: new Date(dates.from),
                              to: new Date(dates.to),
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 w-36 border-dashed bg-card font-normal">
                          <SelectValue placeholder="Prazo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Prazo</SelectItem>
                          <SelectItem value="hoje">Hoje</SelectItem>
                          <SelectItem value="amanha">Amanhã</SelectItem>
                          <SelectItem value="semana">Esta semana</SelectItem>
                        </SelectContent>
                      </Select>

                      <DateRangePicker
                        value={dateRange}
                        onChange={(range) => {
                          setDateRange(range);
                          if (range?.from || range?.to) {
                            setPrazoQuick('todos');
                          }
                          setPageIndex(0);
                        }}
                        placeholder="Prazo entrega"
                        className="h-9 w-60 bg-card"
                      />
                    </>
                  )}
                </>
              }
            />

            {/* Week Navigator - apenas quando weekNavigatorProps existe */}
            {weekNavigatorProps && (
              <div className="px-6 pt-2 pb-4">
                <WeekNavigator
                  weekDays={weekNavigatorProps.weekDays}
                  selectedDate={weekNavigatorProps.selectedDate}
                  onDateSelect={weekNavigatorProps.onDateSelect}
                  onPreviousWeek={weekNavigatorProps.onPreviousWeek}
                  onNextWeek={weekNavigatorProps.onNextWeek}
                  onToday={weekNavigatorProps.onToday}
                  isCurrentWeek={weekNavigatorProps.isCurrentWeek}
                />
              </div>
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
                    onClick={() => chip.onRemove()}
                  >
                    {chip.label}
                    <button
                      type="button"
                      className="inline-flex h-5 w-5 items-center justify-center rounded-sm hover:bg-background/40"
                      onClick={(e) => {
                        e.stopPropagation();
                        chip.onRemove();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
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
        data={pericias}
        columns={columns}
        isLoading={isLoading}
        error={error}
        density={density}
        onTableReady={(t) => setTable(t as TanstackTable<Pericia>)}
        emptyMessage="Nenhuma perícia encontrada."
        rowSelection={{
          state: rowSelection,
          onRowSelectionChange: setRowSelection,
          getRowId: (row) => row.id.toString(),
        }}
        options={{
          meta: {
            usuarios,
            onSuccess: handleSucessoOperacao,
          },
        }}
      />
    </DataShell>
  );
}


