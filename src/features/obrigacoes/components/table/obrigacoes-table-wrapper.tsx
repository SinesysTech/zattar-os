'use client';

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
import { AppBadge as Badge } from '@/components/ui/app-badge';

import type { PaginatedResponse } from '@/types';
import type {
  AcordoComParcelas,
  ListarAcordosParams,
  StatusAcordo,
  TipoObrigacao,
  DirecaoPagamento,
  ObrigacaoComDetalhes,
  StatusObrigacao
} from '../../domain';
import { 
  TIPO_LABELS, 
  DIRECAO_LABELS, 
  STATUS_LABELS 
} from '../../domain';
import { actionListarAcordos } from '../../actions';

import { columns } from './columns';
import { ObrigacoesBulkActions } from './obrigacoes-bulk-actions';
import { ObrigacaoDetalhesDialog } from '../dialogs/obrigacao-detalhes-dialog';
import { NovaObrigacaoDialog } from '../dialogs/nova-obrigacao-dialog';

// =============================================================================
// TIPOS
// =============================================================================

interface ObrigacoesTableWrapperProps {
  initialData?: PaginatedResponse<AcordoComParcelas>;
  fixedDate?: Date;
  hideDateFilters?: boolean;
}

type PrazoFilterType = 'todos' | 'vencidos' | 'hoje' | 'amanha' | 'semana' | 'sem_prazo';

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ObrigacoesTableWrapper({ initialData, fixedDate, hideDateFilters }: ObrigacoesTableWrapperProps) {
  const router = useRouter();

  // ---------- Estado da Tabela (DataShell pattern) ----------
  const [table, setTable] = React.useState<TanstackTable<AcordoComParcelas> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // ---------- Estado de Paginação ----------
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(initialData?.pagination?.limit || 10);
  const [total, setTotal] = React.useState(initialData?.pagination?.total || 0);
  const [totalPages, setTotalPages] = React.useState(initialData?.pagination?.totalPages || 0);

  // ---------- Estado de Loading/Error ----------
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ---------- Estado dos Dados ----------
  const [obrigacoes, setObrigacoes] = React.useState<AcordoComParcelas[]>(initialData?.data || []);

  // ---------- Estado de Filtros Primários ----------
  const [busca, setBusca] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusAcordo | 'todos'>('todos');
  const [tipoFilter, setTipoFilter] = React.useState<TipoObrigacao | 'todos'>('todos');
  const [direcaoFilter, setDirecaoFilter] = React.useState<DirecaoPagamento | 'todos'>('todos');
  const [prazoFilter] = React.useState<PrazoFilterType>('todos');
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date } | undefined>(undefined);

  // ---------- Estado de Dialogs ----------
  const [isNovoDialogOpen, setIsNovoDialogOpen] = React.useState(false);
  const [detalhesItem, setDetalhesItem] = React.useState<ObrigacaoComDetalhes | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = React.useState(false);

  // Debounce da busca (500ms)
  const buscaDebounced = useDebounce(busca, 500);

  // ---------- Calcular datas para filtro de prazo ----------
  const getPrazoDates = React.useCallback((prazo: PrazoFilterType): { from?: string; to?: string } | null => {
    const hoje = new Date();

    switch (prazo) {
      case 'vencidos':
        // Lógica de vencidos geralmente é feita via status ou data < hoje
        return null; 
      case 'hoje':
        const hojeStr = format(startOfDay(hoje), 'yyyy-MM-dd');
        return { from: hojeStr, to: hojeStr };
      case 'amanha':
        const amanha = addDays(hoje, 1);
        const amanhaStr = format(startOfDay(amanha), 'yyyy-MM-dd');
        return { from: amanhaStr, to: amanhaStr };
      case 'semana':
        const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
        const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });
        return {
          from: format(inicioSemana, 'yyyy-MM-dd'),
          to: format(fimSemana, 'yyyy-MM-dd'),
        };
      default:
        return null;
    }
  }, []);

  // ---------- Refetch Function ----------
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ListarAcordosParams = {
        pagina: pageIndex + 1,
        limite: pageSize,
        busca: buscaDebounced || undefined,
      };

      if (statusFilter !== 'todos') params.status = statusFilter;
      if (tipoFilter !== 'todos') params.tipo = tipoFilter;
      if (direcaoFilter !== 'todos') params.direcao = direcaoFilter;

      // Handle Date Filters
      if (prazoFilter !== 'todos') {
         if (prazoFilter === 'vencidos') {
             // If API supports 'atrasado' status, it's already covered by statusFilter usually.
             // If separate param needed, add it. Assuming status 'atrasado' covers it.
             params.status = 'atrasado';
         } else {
            const dates = getPrazoDates(prazoFilter);
            if (dates) {
                params.dataInicio = dates.from;
                params.dataFim = dates.to;
            }
         }
      }

      // Date Range (overrides prazoFilter dates)
      if (dateRange?.from) params.dataInicio = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange?.to) params.dataFim = format(dateRange.to, 'yyyy-MM-dd');

      // Fixed Date (override manual filters)
      if (fixedDate) {
        const dateStr = format(fixedDate, 'yyyy-MM-dd');
        params.dataInicio = dateStr;
        params.dataFim = dateStr;
      }

      const result = await actionListarAcordos(params);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao listar obrigações');
      }

      const responseData = result.data as { acordos: AcordoComParcelas[]; total: number; totalPaginas: number };
      setObrigacoes(responseData.acordos);
      setTotal(responseData.total);
      setTotalPages(responseData.totalPaginas);
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
    tipoFilter,
    direcaoFilter,
    prazoFilter,
    dateRange,
    getPrazoDates,
    fixedDate,
  ]);

  // ---------- Skip First Render ----------
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
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

  const handleVerDetalhes = (acordo: AcordoComParcelas) => {
      // Map AcordoComParcelas to ObrigacaoComDetalhes
      const detalhes: ObrigacaoComDetalhes = {
          id: acordo.id,
          tipo: acordo.tipo,
          descricao: `Processo ${acordo.processo?.numero_processo || 'N/A'}`,
          valor: acordo.valorTotal,
          dataVencimento: acordo.dataVencimentoPrimeiraParcela,
          status: acordo.status as StatusObrigacao, // Ensure compatible types
          statusSincronizacao: 'nao_aplicavel',
          diasAteVencimento: null,
          tipoEntidade: 'obrigacao',
          acordoId: acordo.id,
          processoId: acordo.processoId,
          // Add other fields mapping
      };
      setDetalhesItem(detalhes);
      setIsDetalhesOpen(true);
  };

  // Gerar chips de filtros ativos
  const activeFilterChips = React.useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (statusFilter !== 'todos') {
      chips.push({
        key: 'status',
        label: STATUS_LABELS[statusFilter],
        onRemove: () => setStatusFilter('todos'),
      });
    }
    
    if (tipoFilter !== 'todos') {
        chips.push({
            key: 'tipo',
            label: TIPO_LABELS[tipoFilter],
            onRemove: () => setTipoFilter('todos'),
        });
    }

    if (direcaoFilter !== 'todos') {
        chips.push({
            key: 'direcao',
            label: DIRECAO_LABELS[direcaoFilter],
            onRemove: () => setDirecaoFilter('todos'),
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

    return chips;
  }, [statusFilter, tipoFilter, direcaoFilter, dateRange]);

  return (
    <>
      <DataShell
        header={
          table ? (
            <>
              {Object.keys(rowSelection).length > 0 && (
                <ObrigacoesBulkActions
                  selectedRows={obrigacoes.filter((o) => rowSelection[o.id.toString()])}
                  onSuccess={() => {
                    setRowSelection({});
                    handleSucessoOperacao();
                  }}
                />
              )}
              <DataTableToolbar
                table={table}
                title="Obrigações"
                density={density}
                onDensityChange={setDensity}
                searchValue={busca}
                onSearchValueChange={(value) => {
                  setBusca(value);
                  setPageIndex(0);
                }}
                searchPlaceholder="Buscar obrigações..."
                actionButton={{
                  label: 'Nova Obrigação',
                  onClick: () => setIsNovoDialogOpen(true),
                }}
                filtersSlot={
                  <>
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusAcordo | 'todos'); setPageIndex(0); }}>
                      <SelectTrigger className="w-[130px] bg-card">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Status</SelectItem>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={tipoFilter} onValueChange={(v) => { setTipoFilter(v as TipoObrigacao | 'todos'); setPageIndex(0); }}>
                      <SelectTrigger className="w-[130px] bg-card">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Tipo</SelectItem>
                        {Object.entries(TIPO_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {!hideDateFilters && (
                        <DateRangePicker
                            value={dateRange}
                            onChange={(range) => {
                                setDateRange(range);
                                setPageIndex(0);
                            }}
                            placeholder="Vencimento"
                            className="w-[240px] bg-card"
                        />
                    )}
                  </>
                }
              />
              
               {/* Active Filter Chips */}
               {activeFilterChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
                  <span className="text-sm text-muted-foreground">Filtros:</span>
                  {activeFilterChips.map((chip) => (
                    <Badge
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
                    </Badge>
                  ))}
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
          data={obrigacoes}
          columns={columns}
          isLoading={isLoading}
          error={error}
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<AcordoComParcelas>)}
          emptyMessage="Nenhuma obrigação encontrada."
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange: setRowSelection,
            getRowId: (row) => row.id.toString(),
          }}
          options={{
            meta: {
              onVerDetalhes: handleVerDetalhes,
              onSucessoOperacao: handleSucessoOperacao,
            },
          }}
        />
      </DataShell>

      <ObrigacaoDetalhesDialog
        obrigacao={detalhesItem}
        open={isDetalhesOpen}
        onOpenChange={setIsDetalhesOpen}
      />
      
      <NovaObrigacaoDialog
        open={isNovoDialogOpen}
        onOpenChange={setIsNovoDialogOpen}
        onSuccess={handleSucessoOperacao}
      />
    </>
  );
}
