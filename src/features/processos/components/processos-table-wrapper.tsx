'use client';

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableShell } from '@/components/shared/data-table-shell';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { TablePagination } from '@/components/shared/table-pagination';
import {
  buildProcessosFilterOptions,
  buildProcessosFilterGroups,
  parseProcessosFilters,
  GrauBadges,
  ProcessosEmptyState,
  ProcessoDetailSheet,
} from '@/features/processos/components';
import { useProcessos } from '@/features/processos/hooks';
import type { ProcessosFilters, Processo, ProcessoUnificado, GrauProcesso, ProcessoSortBy } from '@/features/processos/types';
import { getSemanticBadgeVariant, GRAU_LABELS } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy } from 'lucide-react';
import type { ColumnDef, SortingState, Row } from '@tanstack/react-table';

type ProcessoComParticipacao = Processo | ProcessoUnificado;

const isProcessoUnificado = (processo: Processo | ProcessoUnificado): processo is ProcessoUnificado => {
  return 'instances' in processo && 'grau_atual' in processo;
};

const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

const formatarGrau = (grau: GrauProcesso): string => {
  return GRAU_LABELS[grau] || grau;
};

function ProcessoNumeroCell({ row }: { row: Row<ProcessoComParticipacao> }) {
  const processo = row.original;
  const classeJudicial = processo.classeJudicial || '';
  const numeroProcesso = processo.numeroProcesso;
  // Use generic access or cast if property missing in Union type
  const orgaoJulgador = umaPropriedadeSegura(processo);
  const trt = processo.trt;
  const isUnificado = isProcessoUnificado(processo);
  const [copiado, setCopiado] = React.useState(false);

  React.useEffect(() => {
    if (!copiado) return undefined;
    const timeout = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(timeout);
  }, [copiado]);

  const copiarNumeroProcesso = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(numeroProcesso);
      setCopiado(true);
    } catch (err) {
      console.error('Erro ao copiar número do processo:', err);
    }
  };

  return (
    <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[min(92vw,23.75rem)]">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant={getSemanticBadgeVariant('tribunal', trt)} className="w-fit text-xs">
          {trt}
        </Badge>
        {isUnificado ? (
          <GrauBadges instances={processo.instances} />
        ) : (
          <Badge variant={getSemanticBadgeVariant('grau', processo.grau)} className="w-fit text-xs">
            {formatarGrau(processo.grau)}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium whitespace-nowrap">
          {classeJudicial && `${classeJudicial} `}
          {numeroProcesso}
        </div>
        <Button variant="outline" size="icon" className="h-6 w-6" onClick={copiarNumeroProcesso}>
          <Copy className={cn('h-3 w-3', copiado ? 'text-success' : '')} />
        </Button>
      </div>
      <div className="text-xs text-muted-foreground max-w-full truncate">{orgaoJulgador}</div>
    </div>
  );
}

// Helper seguro para propriedade que pode faltar no tipo
function umaPropriedadeSegura(processo: any): string {
    return processo.descricaoOrgaoJulgador || '-';
}

const colunas: ColumnDef<ProcessoComParticipacao>[] = [
    {
        accessorKey: 'numero_processo',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Número do Processo" />,
        cell: ({ row }) => <ProcessoNumeroCell row={row} />,
        enableSorting: true,
        size: 380,
    },
    {
        accessorKey: 'nome_parte_autora',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
        cell: ({ row }) => {
            const parteAutora = row.original.nomeParteAutora || '-';
            return (
            <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[min(92vw,15.625rem)]">
                <Badge variant={getSemanticBadgeVariant('polo', 'ATIVO')} className="block whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-left">
                {parteAutora}
                </Badge>
            </div>
            );
        },
        enableSorting: true,
        size: 250,
    },
    {
        accessorKey: 'trt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tribunal" />,
        cell: ({ row }) => {
            const trt = row.original.trt;
            return (
                <div className="min-h-10 flex items-center justify-center">
                    <Badge variant={getSemanticBadgeVariant('tribunal', trt)}>{trt}</Badge>
                </div>
            );
        },
        size: 150,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.status;
            return (
                <Badge variant={getSemanticBadgeVariant('status', status)}>
                    {status}
                </Badge>
            );
        },
        size: 150,
    },
    {
        accessorKey: 'data_autuacao',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Última Movimentação" />,
        cell: ({ row }) => (
            <div className="min-h-10 flex items-center justify-center text-sm">
                {formatarData(row.original.dataAutuacao)}
            </div>
          ),
        size: 150,
    },
];

export function ProcessosTableWrapper() {
  const [busca, setBusca] = React.useState('');
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 50 });
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'data_autuacao', desc: true }]);

  const [filtros, setFiltros] = React.useState<ProcessosFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedProcessoId, setSelectedProcessoId] = React.useState<number | null>(null);

  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  const params = React.useMemo(() => {
    return {
      pagina: pagination.pageIndex + 1,
      limite: pagination.pageSize,
      busca: buscaDebounced || undefined,
      ordenar_por: (sorting[0]?.id === 'status' ? 'codigo_status_processo' : sorting[0]?.id) as ProcessoSortBy | undefined,
      ordem: (sorting[0]?.desc ? 'desc' : 'asc') as 'asc' | 'desc',
      ...filtros,
    };
  }, [pagination, buscaDebounced, sorting, filtros]);

  const { processos, paginacao, isLoading, error } = useProcessos(params);

  const filterOptions = React.useMemo(() => buildProcessosFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildProcessosFilterGroups(), []);

  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
    setSelectedFilterIds(selectedIds);
    const newFilters = parseProcessosFilters(selectedIds);
    setFiltros(newFilters);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleRowClick = (row: ProcessoComParticipacao) => {
    setSelectedProcessoId(row.id);
    setIsSheetOpen(true);
  }

  const toolbar = (
    <TableToolbar
        variant="integrated"
        searchValue={busca}
        onSearchChange={(value) => {
            setBusca(value);
            setPagination(prev => ({...prev, pageIndex: 0}));
        }}
        isSearching={isSearching}
        searchPlaceholder="Buscar processos..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        newButtonTooltip="Novo Processo"
        onNewClick={() => { /* Lógica para novo processo */ }}
    />
  );

  const paginationControl = paginacao ? (
    <TablePagination
      variant="integrated"
      pageIndex={paginacao.pagina - 1}
      pageSize={paginacao.limite}
      total={paginacao.total}
      totalPages={paginacao.totalPaginas}
      onPageChange={(pageIndex) => setPagination(prev => ({ ...prev, pageIndex }))}
      onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
      isLoading={isLoading}
    />
  ) : null;

  const hasFilters = selectedFilterIds.length > 0 || busca.length > 0;

  const showEmptyState = !isLoading && !error && (processos === null || processos.length === 0);

  return (
    <>
        <DataTableShell toolbar={toolbar} pagination={paginationControl}>
            {showEmptyState ? (
                <ProcessosEmptyState
                    onClearFilters={() => handleFilterIdsChange([])}
                    hasFilters={hasFilters}
                />
            ) : (
                <DataTable
                    columns={colunas}
                    data={processos || []}
                    isLoading={isLoading}
                    error={error}
                    onRowClick={handleRowClick}
                    hideTableBorder
                    hidePagination
                    className="border-none"
                    // Pass current pagination state for manual control internal logic
                    pagination={paginacao ? {
                        pageIndex: paginacao.pagina - 1,
                        pageSize: paginacao.limite,
                        total: paginacao.total,
                        totalPages: paginacao.totalPaginas,
                        onPageChange: (pageIndex) => setPagination(prev => ({ ...prev, pageIndex })),
                        onPageSizeChange: (pageSize) => setPagination({ pageIndex: 0, pageSize }),
                    } : undefined}
                    sorting={{
                        columnId: sorting[0]?.id,
                        direction: sorting[0]?.desc ? 'desc' : 'asc',
                        onSortingChange: (columnId, direction) => {
                            if (columnId === null || direction === null) {
                                setSorting([]);
                            } else {
                                setSorting([{ id: columnId, desc: direction === 'desc' }]);
                            }
                        }
                    }}
                />
            )}
        </DataTableShell>

        <ProcessoDetailSheet
            isOpen={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            processoId={selectedProcessoId}
        />
    </>
  );
}
