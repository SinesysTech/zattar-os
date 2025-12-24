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
import { Combobox } from '@/components/ui/combobox';
import {
  GrauBadgesSimple,
  ProcessosEmptyState,
  ProcessoDetailSheet,
  ProcessoStatusBadge,
  ProximaAudienciaPopover,
} from '@/features/processos/components';
import { actionListarProcessos } from '@/features/processos/actions';
import type {
  Processo,
  ProcessoUnificado,
  GrauProcesso,
} from '@/features/processos/types';
import {
  buildProcessosFilterOptions,
  buildProcessosFilterGroups,
} from './processos-toolbar-filters';
import { getSemanticBadgeVariant, GRAU_LABELS } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ColumnDef, Row, Table as TanstackTable } from '@tanstack/react-table';

// =============================================================================
// TIPOS
// =============================================================================

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}


interface ProcessosTableWrapperProps {
  initialData: ProcessoUnificado[];
  initialPagination: PaginationInfo | null;
  initialUsers: Record<number, { nome: string }>;
  initialTribunais: Array<{ codigo: string; nome: string }>;
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

/**
 * Retorna o órgão julgador do processo de forma segura
 */
function getOrgaoJulgador(processo: ProcessoUnificado): string {
  return processo.descricaoOrgaoJulgador || '-';
}

// =============================================================================
// CELL COMPONENTS
// =============================================================================

function ProcessoNumeroCell({ row }: { row: Row<ProcessoUnificado> }) {
  const processo = row.original;
  const classeJudicial = processo.classeJudicial || '';
  const numeroProcesso = processo.numeroProcesso;
  const orgaoJulgador = getOrgaoJulgador(processo);
  // FONTE DA VERDADE: Usar trtOrigem (1º grau) ao invés de trt (grau atual)
  // Isso garante que processos no TST ou 2º grau mostrem o tribunal de origem
  const trt = processo.trtOrigem || processo.trt;
  const isUnificado = isProcessoUnificado(processo);
  const segredoJustica = processo.segredoJustica;
  const dataProximaAudiencia = processo.dataProximaAudiencia;

  return (
    <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[min(92vw,23.75rem)]">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant={getSemanticBadgeVariant('tribunal', trt)} className="w-fit text-xs">
          {trt}
        </Badge>
        {isUnificado ? (
          <GrauBadgesSimple grausAtivos={(processo as ProcessoUnificado).grausAtivos} />
        ) : (
          <Badge variant={getSemanticBadgeVariant('grau', (processo as Processo).grau)} className="w-fit text-xs">
            {formatarGrau((processo as Processo).grau)}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium whitespace-nowrap">
          {classeJudicial && `${classeJudicial} `}
          {numeroProcesso}
        </div>
        {segredoJustica && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Lock className="h-3.5 w-3.5 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>Segredo de Justiça</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground max-w-full truncate">{orgaoJulgador}</span>
        <ProximaAudienciaPopover dataAudiencia={dataProximaAudiencia} />
      </div>
    </div>
  );
}

// =============================================================================
// COLUMNS
// =============================================================================

function criarColunas(
  usuariosMap: Record<number, { nome: string }>,
  onViewClick: (processo: ProcessoUnificado) => void
): ColumnDef<ProcessoUnificado>[] {
  return [
    {
      accessorKey: 'data_autuacao',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data Autuação" className="justify-center" />,
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Processo" />,
      cell: ({ row }) => <ProcessoNumeroCell row={row} />,
      enableSorting: true,
      size: 380,
      meta: {
        align: 'left' as const,
        headerLabel: 'Processo',
      },
    },
    {
      id: 'partes',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Partes" />,
      cell: ({ row }) => {
        // FONTE DA VERDADE: Usar nomes do 1º grau para evitar inversão por recursos
        // Em recursos, quem recorre vira polo ativo, mas não muda quem é autor/réu
        const parteAutora = row.original.nomeParteAutoraOrigem || row.original.nomeParteAutora || '-';
        const parteRe = row.original.nomeParteReOrigem || row.original.nomeParteRe || '-';
        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 py-2">
            <Badge
              variant="secondary"
              className="block whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis text-left font-normal bg-blue-100 text-blue-700 hover:bg-blue-200 border-none"
            >
              {parteAutora}
            </Badge>
            <Badge
              variant="secondary"
              className="block whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis text-left font-normal bg-red-100 text-red-700 hover:bg-red-200 border-none"
            >
              {parteRe}
            </Badge>
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
      id: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        // Fallback para ATIVO se status for nulo (cenário de migração de dados)
        const status = row.original.status;
        return (
          <div className="min-h-10 flex items-center justify-start">
            <ProcessoStatusBadge status={status} className="text-xs" />
          </div>
        );
      },
      enableSorting: false,
      size: 120,
      meta: {
        align: 'left' as const,
        headerLabel: 'Status',
      },
    },
    {
      id: 'acoes',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ações" className="justify-center" />,
      cell: ({ row }) => {
        const processo = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(processo.numeroProcesso);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copiar número</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copiar número</TooltipContent>
              </Tooltip>
            </TooltipProvider>

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
          </div>
        );
      },
      enableSorting: false,
      size: 100,
      meta: {
        align: 'center' as const,
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
  initialTribunais = [],
}: ProcessosTableWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estado dos dados
  const [processos, setProcessos] = React.useState<ProcessoUnificado[]>(initialData);
  const [usersMap, setUsersMap] = React.useState(initialUsers);
  const [table, setTable] = React.useState<TanstackTable<ProcessoUnificado> | null>(null);
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
  const [trtFilter, setTrtFilter] = React.useState<string[]>(() => {
    const trt = searchParams.get('trt');
    if (!trt || trt === 'all') return [];
    return trt.includes(',') ? trt.split(',') : [trt];
  });
  const [origemFilter, setOrigemFilter] = React.useState<string>(searchParams.get('origem') || 'all');

  // Estado do sheet de detalhes
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedProcessoId, setSelectedProcessoId] = React.useState<number | null>(null);

  // Dados auxiliares para mostrar nomes dos responsáveis
  // Removido useUsuarios em favor de initialUsers + updates do server action

  // Handler para clique na linha
  const handleRowClick = React.useCallback((row: ProcessoUnificado) => {
    setSelectedProcessoId(row.id);
    setIsSheetOpen(true);
  }, []);

  // Colunas memoizadas
  const colunas = React.useMemo(() => criarColunas(usersMap, handleRowClick), [usersMap, handleRowClick]);

  const buscaDebounced = useDebounce(globalFilter, 500);

  // Filtros
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filterOptions = React.useMemo(() => buildProcessosFilterOptions(initialTribunais), [initialTribunais]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filterGroups = React.useMemo(() => buildProcessosFilterGroups(), []);

  // Função para recarregar dados
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarProcessos({
        pagina: pageIndex + 1,
        limite: pageSize,
        busca: buscaDebounced || undefined,
        trt: trtFilter.length === 0 ? undefined : trtFilter,
        origem: origemFilter === 'all' ? undefined : (origemFilter as 'acervo_geral' | 'arquivado'),
      });

      if (result.success) {
        // Correcao de tipagem do payload
        const payload = result.data as {
          data: ProcessoUnificado[];
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
        if (trtFilter.length > 0) params.set('trt', trtFilter.join(','));
        if (origemFilter !== 'all') params.set('origem', origemFilter);

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar processos');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, buscaDebounced, trtFilter, origemFilter, router, pathname]);

  // Ref para controlar primeira renderização
  const isFirstRender = React.useRef(true);

  // Recarregar quando parâmetros mudam (skip primeira render)
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refetch();
  }, [pageIndex, pageSize, buscaDebounced, trtFilter, origemFilter, refetch]);

  // Handler para novo processo (placeholder)
  const handleNewProcesso = React.useCallback(() => {
    // TODO: Implementar dialog de criação de processo
    console.log('Novo processo');
  }, []);

  const hasFilters = trtFilter.length > 0 || origemFilter !== 'all' || globalFilter.length > 0;
  const showEmptyState = !isLoading && !error && (processos === null || processos.length === 0);

  return (
    <>
      <DataShell
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
              actionButton={{
                label: 'Novo Processo',
                onClick: handleNewProcesso,
              }}
              filtersSlot={
                <>
                  <Combobox
                    options={initialTribunais.map(t => ({ label: `${t.codigo} - ${t.nome}`, value: t.codigo }))}
                    value={trtFilter}
                    onValueChange={(val) => {
                      setTrtFilter(val);
                      setPageIndex(0);
                    }}
                    placeholder="Tribunais"
                    searchPlaceholder="Buscar tribunal..."
                    emptyText="Nenhum tribunal encontrado"
                    multiple={true}
                    className="w-[200px]"
                  />

                  <Select
                    value={origemFilter}
                    onValueChange={(val) => {
                      setOrigemFilter(val);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-10 w-[150px]">
                      <SelectValue placeholder="Origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Origens</SelectItem>
                      <SelectItem value="acervo_geral">Acervo Geral</SelectItem>
                      <SelectItem value="arquivado">Arquivados</SelectItem>
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
              setTrtFilter([]);
              setOrigemFilter('all');
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
              onTableReady={(t) => setTable(t as TanstackTable<ProcessoUnificado>)}
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
