'use client';

/**
 * ProcessosTableWrapper - Componente Client que encapsula a tabela de processos
 *
 * Recebe dados iniciais do Server Component e gerencia:
 * - Estado de busca e filtros
 * - Paginacao client-side com refresh via Server Actions
 * - Sheet de visualizacao de detalhes
 */

import * as React from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { DataShell, DataPagination, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GrauBadges,
  ProcessosEmptyState,
  ProcessoDetailSheet,
} from '@/features/processos/components';
import { actionListarProcessos } from '@/features/processos/actions';
import type { Processo, ProcessoUnificado } from '@/features/processos/domain';
import { getSemanticBadgeVariant, GRAU_LABELS } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, MoreHorizontal } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ColumnDef, Row, Table as TanstackTable } from '@tanstack/react-table';

// =============================================================================
// TIPOS
// =============================================================================

type ProcessoComParticipacao = Processo | ProcessoUnificado;

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}


interface ProcessosTableWrapperProps {
  initialData: ProcessoComParticipacao[];
  initialPagination: PaginationInfo | null;
  initialUsers: Record<number, { nome: string }>;
}

// =============================================================================
// HELPERS
// =============================================================================

const isProcessoUnificado = (processo: Processo | ProcessoUnificado): processo is ProcessoUnificado => {
  return 'instances' in processo && 'grauAtual' in processo;
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

const formatarGrau = (grau: string): string => {
  return GRAU_LABELS[grau as keyof typeof GRAU_LABELS] || grau;
};

function umaPropriedadeSegura(processo: ProcessoComParticipacao): string {
  return (processo as unknown as { descricaoOrgaoJulgador?: string }).descricaoOrgaoJulgador || '-';
}

// =============================================================================
// CELL COMPONENTS
// =============================================================================

function ProcessoNumeroCell({ row }: { row: Row<ProcessoComParticipacao> }) {
  const processo = row.original;
  const classeJudicial = processo.classeJudicial || '';
  const numeroProcesso = processo.numeroProcesso;
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

// =============================================================================
// COLUMNS
// =============================================================================

function criarColunas(
  usuariosMap: Record<number, { nome: string }>,
  onViewClick: (processo: ProcessoComParticipacao) => void
): ColumnDef<ProcessoComParticipacao>[] {
  return [
    {
      accessorKey: 'data_autuacao',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data Autuação" />,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {formatarData(row.original.dataAutuacao)}
        </div>
      ),
      enableSorting: true,
      size: 120,
      meta: {
        align: 'center' as const,
        headerLabel: 'Data Autuação',
      },
    },
    {
      accessorKey: 'numero_processo',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Número do Processo" />,
      cell: ({ row }) => <ProcessoNumeroCell row={row} />,
      enableSorting: true,
      size: 380,
      meta: {
        align: 'left' as const,
        headerLabel: 'Número do Processo',
      },
    },
    {
      id: 'partes',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Partes" />,
      cell: ({ row }) => {
        const parteAutora = row.original.nomeParteAutora || '-';
        const parteRe = row.original.nomeParteRe || '-';
        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 py-2">
            <div className="flex items-center gap-2 max-w-full">
              <span className="text-xs text-muted-foreground shrink-0">Autor:</span>
              <Badge
                variant={getSemanticBadgeVariant('polo', 'ATIVO')}
                className="block whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis text-left"
              >
                {parteAutora}
              </Badge>
            </div>
            <div className="flex items-center gap-2 max-w-full">
              <span className="text-xs text-muted-foreground shrink-0">Réu:</span>
              <Badge
                variant={getSemanticBadgeVariant('polo', 'PASSIVO')}
                className="block whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis text-left"
              >
                {parteRe}
              </Badge>
            </div>
          </div>
        );
      },
      enableSorting: false,
      size: 300,
      meta: {
        align: 'left' as const,
        headerLabel: 'Partes',
      },
    },
    {
      id: 'responsavel',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Responsável" />,
      cell: ({ row }) => {
        const responsavelId = row.original.responsavelId;
        const responsavelNome = responsavelId ? usuariosMap[responsavelId]?.nome : null;
        return (
          <div className="min-h-10 flex items-center justify-start text-sm">
            {responsavelNome || (
              <span className="text-muted-foreground">Não atribuído</span>
            )}
          </div>
        );
      },
      enableSorting: false,
      size: 180,
      meta: {
        align: 'left' as const,
        headerLabel: 'Responsável',
      },
    },
    {
      id: 'acoes',
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => {
        const processo = row.original;
        return (
          <div className="min-h-10 flex items-center justify-end gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewClick(processo);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver detalhes</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver detalhes</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Mais ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(processo.numeroProcesso);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar número
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewClick(processo);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalhes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      size: 100,
      meta: {
        align: 'right' as const,
        headerLabel: 'Ações',
      },
    },
  ];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ProcessosTableWrapper({
  initialData,
  initialPagination,
  initialUsers,
}: ProcessosTableWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estado dos dados
  const [processos, setProcessos] = React.useState<ProcessoComParticipacao[]>(initialData);
  const [usersMap, setUsersMap] = React.useState(initialUsers);
  const [table, setTable] = React.useState<TanstackTable<ProcessoComParticipacao> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Estado de paginação
  const [pageIndex, setPageIndex] = React.useState(initialPagination ? initialPagination.page - 1 : 0);
  const [pageSize, setPageSize] = React.useState(initialPagination ? initialPagination.limit : 50);
  const [total, setTotal] = React.useState(initialPagination ? initialPagination.total : 0);
  const [totalPages, setTotalPages] = React.useState(initialPagination ? initialPagination.totalPages : 0);

  // Estado de loading/error
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estado de busca e filtros (inicializado da URL)
  const [globalFilter, setGlobalFilter] = React.useState(searchParams.get('search') || '');
  const [trtFilter, setTrtFilter] = React.useState<string>(searchParams.get('trt') || 'all');
  const [statusFilter, setStatusFilter] = React.useState<string>(searchParams.get('status') || 'all');

  // Estado do sheet de detalhes
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedProcessoId, setSelectedProcessoId] = React.useState<number | null>(null);

  // Dados auxiliares para mostrar nomes dos responsáveis
  // Removido useUsuarios em favor de initialUsers + updates do server action

  // Handler para clique na linha
  const handleRowClick = React.useCallback((row: ProcessoComParticipacao) => {
    setSelectedProcessoId(row.id);
    setIsSheetOpen(true);
  }, []);

  // Colunas memoizadas
  const colunas = React.useMemo(() => criarColunas(usersMap, handleRowClick), [usersMap, handleRowClick]);

  const buscaDebounced = useDebounce(globalFilter, 500);

  // Função para recarregar dados
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarProcessos({
        pagina: pageIndex + 1,
        limite: pageSize,
        busca: buscaDebounced || undefined,
        trt: trtFilter === 'all' ? undefined : trtFilter,
        codigoStatusProcesso: statusFilter === 'all' ? undefined : statusFilter,
      });

      if (result.success) {
        // Correcao de tipagem do payload
        const payload = result.data as {
          data: ProcessoComParticipacao[];
          pagination: PaginationInfo;
          referencedUsers: Record<number, { nome: string }>;
        };
        
        setProcessos(payload.data);
        setTotal(payload.pagination.total);
        setTotalPages(payload.pagination.totalPages);
        setUsersMap((prev) => ({ ...prev, ...payload.referencedUsers }));
        
        // Atualizar URL
        const params = new URLSearchParams();
        if (pageIndex > 0) params.set('page', String(pageIndex + 1));
        if (pageSize !== 50) params.set('limit', String(pageSize));
        if (buscaDebounced) params.set('search', buscaDebounced);
        if (trtFilter !== 'all') params.set('trt', trtFilter);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar processos');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, buscaDebounced, trtFilter, statusFilter, router, pathname]);

  // Ref para controlar primeira renderização
  const isFirstRender = React.useRef(true);

  // Recarregar quando parâmetros mudam (skip primeira render)
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refetch();
  }, [pageIndex, pageSize, buscaDebounced, trtFilter, statusFilter, refetch]);

  // Handler para novo processo (placeholder)
  const handleNewProcesso = React.useCallback(() => {
    // TODO: Implementar dialog de criação de processo
    console.log('Novo processo');
  }, []);

  const hasFilters = trtFilter !== 'all' || statusFilter !== 'all' || globalFilter.length > 0;
  const showEmptyState = !isLoading && !error && (processos === null || processos.length === 0);

  return (
    <>
      <DataShell
        actionButton={{
          label: 'Novo Processo',
          onClick: handleNewProcesso,
        }}
        header={
          table ? (
            <DataTableToolbar
              table={table}
              density={density}
              onDensityChange={setDensity}
              searchValue={globalFilter}
              onSearchValueChange={(value) => {
                setGlobalFilter(value);
                setPageIndex(0);
              }}
              filtersSlot={
                <>
                  <Select
                    value={trtFilter}
                    onValueChange={(val) => {
                      setTrtFilter(val);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-10 w-[150px]">
                      <SelectValue placeholder="Tribunal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="TRT1">TRT1</SelectItem>
                      <SelectItem value="TRT2">TRT2</SelectItem>
                      <SelectItem value="TRT3">TRT3</SelectItem>
                      <SelectItem value="TRT4">TRT4</SelectItem>
                      <SelectItem value="TRT5">TRT5</SelectItem>
                      <SelectItem value="TRT6">TRT6</SelectItem>
                      <SelectItem value="TRT7">TRT7</SelectItem>
                      <SelectItem value="TRT8">TRT8</SelectItem>
                      <SelectItem value="TRT9">TRT9</SelectItem>
                      <SelectItem value="TRT10">TRT10</SelectItem>
                      <SelectItem value="TRT11">TRT11</SelectItem>
                      <SelectItem value="TRT12">TRT12</SelectItem>
                      <SelectItem value="TRT13">TRT13</SelectItem>
                      <SelectItem value="TRT14">TRT14</SelectItem>
                      <SelectItem value="TRT15">TRT15</SelectItem>
                      <SelectItem value="TRT16">TRT16</SelectItem>
                      <SelectItem value="TRT17">TRT17</SelectItem>
                      <SelectItem value="TRT18">TRT18</SelectItem>
                      <SelectItem value="TRT19">TRT19</SelectItem>
                      <SelectItem value="TRT20">TRT20</SelectItem>
                      <SelectItem value="TRT21">TRT21</SelectItem>
                      <SelectItem value="TRT22">TRT22</SelectItem>
                      <SelectItem value="TRT23">TRT23</SelectItem>
                      <SelectItem value="TRT24">TRT24</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                      setStatusFilter(val);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-10 w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="arquivado">Arquivado</SelectItem>
                      <SelectItem value="suspenso">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          totalPages > 0 ? (
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        {showEmptyState ? (
          <ProcessosEmptyState
            onClearFilters={() => {
              setTrtFilter('all');
              setStatusFilter('all');
              setGlobalFilter('');
              setPageIndex(0);
            }}
            hasFilters={hasFilters}
          />
        ) : (
          <div className="relative border-t">
            <DataTable
              columns={colunas}
              data={processos || []}
              isLoading={isLoading}
              error={error}
              density={density}
              onTableReady={(t) => setTable(t as TanstackTable<ProcessoComParticipacao>)}
              onRowClick={handleRowClick}
              hideTableBorder={true}
              emptyMessage="Nenhum processo encontrado."
              pagination={{
                pageIndex,
                pageSize,
                total,
                totalPages,
                onPageChange: setPageIndex,
                onPageSizeChange: setPageSize,
              }}
            />
          </div>
        )}
      </DataShell>

      <ProcessoDetailSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        processoId={selectedProcessoId}
      />
    </>
  );
}
