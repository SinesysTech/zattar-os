'use client';

import * as React from 'react';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { PageShell } from '@/components/shared/page-shell';
import { DataTable } from '@/components/ui/data-table';
import { DataTableShell } from '@/components/shared/data-table-shell';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { buildProcessosFilterOptions, buildProcessosFilterGroups, parseProcessosFilters } from './components/processos-toolbar-filters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy } from 'lucide-react';
import { useProcessos } from '@/app/_lib/hooks/use-processos';
import { GrauBadges } from './components/grau-badges';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import type { Acervo, ProcessoUnificado } from '@/backend/types/acervo/types';
import type { ProcessosFilters } from '@/app/_lib/types/acervo';
import { ProcessoDetailSheet } from '@/components/modules/processos/processo-detail-sheet';
import { ProcessosEmptyState } from '@/components/modules/processos/processos-empty-state';

type ProcessoComParticipacao = Acervo | ProcessoUnificado;

const isProcessoUnificado = (processo: Acervo | ProcessoUnificado): processo is ProcessoUnificado => {
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

const getTRTColorClass = (trt: string): string => {
    const trtColors: Record<string, string> = {
      'TRT1': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
      'TRT2': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    };
    return trtColors[trt] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

const getGrauColorClass = (grau: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior'): string => {
  const grauColors: Record<string, string> = {
    'primeiro_grau': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800',
    'segundo_grau': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
    'tribunal_superior': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800',
  };
  return grauColors[grau] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

const formatarGrau = (grau: 'primeiro_grau' | 'segundo_grau' | 'tribunal_superior'): string => {
  if (grau === 'primeiro_grau') return '1º Grau';
  if (grau === 'segundo_grau') return '2º Grau';
  if (grau === 'tribunal_superior') return 'Tribunal Superior';
  return grau;
};

const getParteAutoraColorClass = (): string => {
  return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800';
};

const colunas: ColumnDef<ProcessoComParticipacao>[] = [
    {
        accessorKey: 'numero_processo',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Número do Processo" />,
        cell: ({ row }) => {
            const processo = row.original;
            const classeJudicial = processo.classe_judicial || '';
            const numeroProcesso = processo.numero_processo;
            const orgaoJulgador = processo.descricao_orgao_julgador || '-';
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
                    <Badge variant="outline" className={`${getTRTColorClass(trt)} w-fit text-xs`}>
                    {trt}
                    </Badge>
                    {isUnificado ? (
                    <GrauBadges instances={processo.instances} />
                    ) : (
                    <Badge variant="outline" className={`${getGrauColorClass(processo.grau)} w-fit text-xs`}>
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
                        <Copy className={`h-3 w-3 ${copiado ? 'text-green-600' : ''}`} />
                    </Button>
                </div>
                <div className="text-xs text-muted-foreground max-w-full truncate">{orgaoJulgador}</div>
                </div>
            );
        },
        enableSorting: true,
        size: 380,
    },
    {
        accessorKey: 'nome_parte_autora',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
        cell: ({ row }) => {
            const parteAutora = row.original.nome_parte_autora || '-';
            return (
            <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[min(92vw,15.625rem)]">
                <Badge variant="outline" className={`${getParteAutoraColorClass()} block whitespace-nowrap max-w-full overflow-hidden text-ellipsis text-left`}>
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
                    <Badge variant="outline" className={getTRTColorClass(trt)}>{trt}</Badge>
                </div>
            );
        },
        size: 150,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const status = row.original.status;
            return (
              <div className="min-h-10 flex items-center justify-center">
                <Badge variant="default">{status}</Badge>
              </div>
            );
        },
        size: 150,
    },
    {
        accessorKey: 'data_autuacao',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Última Movimentação" />,
        cell: ({ row }) => (
            <div className="min-h-10 flex items-center justify-center text-sm">
              {formatarData(row.original.data_autuacao)}
            </div>
          ),
        size: 150,
    },
];

export default function ProcessosPage() {
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
      ordenar_por: sorting[0]?.id,
      ordem: sorting[0]?.desc ? 'desc' : 'asc',
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
        newButtonText="Novo Processo"
        onNewClick={() => { /* Lógica para novo processo */ }}
    />
  );
  
  const hasFilters = selectedFilterIds.length > 0 || busca.length > 0;
  
  const showEmptyState = !isLoading && !error && (processos === null || processos.length === 0);

  return (
    <PageShell
      title="Processos"
      actions={<Button>Novo Processo</Button>}
    >
        {/*
          Nota: DataTableShell possui slot `pagination` opcional, mas neste contexto
          a paginação é gerenciada internamente pelo DataTable para manter coesão
          entre dados, estado de ordenação e controles de paginação.
        */}
        <DataTableShell toolbar={toolbar}>
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
                    pagination={paginacao ? {
                        pageIndex: paginacao.pagina -1,
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
    </PageShell>
  );
}
