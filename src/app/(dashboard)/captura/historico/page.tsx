'use client';

// Página de histórico de capturas

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Trash2 } from 'lucide-react';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableToolbar } from '@/components/ui/table-toolbar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CapturaDialog } from '../components/captura-dialog';
import { buildCapturasFilterOptions, buildCapturasFilterGroups, parseCapturasFilters } from './components/capturas-toolbar-filters';
import { useCapturasLog } from '@/app/_lib/hooks/use-capturas-log';
import { useAdvogados } from '@/app/_lib/hooks/use-advogados';
import { useCredenciais } from '@/app/_lib/hooks/use-credenciais';
import type { ColumnDef } from '@tanstack/react-table';
import type { CapturaLog, TipoCaptura, StatusCaptura } from '@/backend/types/captura/capturas-log-types';
import type { CapturasFilters } from './components/capturas-toolbar-filters';
import type { CodigoTRT } from '@/core/app/_lib/types/credenciais';

/**
 * Formata data e hora ISO para formato brasileiro (DD/MM/YYYY HH:mm)
 */
const formatarDataHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

/**
 * Formata tipo de captura para exibição
 */
const formatarTipoCaptura = (tipo: TipoCaptura): string => {
  const tipos: Record<TipoCaptura, string> = {
    acervo_geral: 'Acervo Geral',
    arquivados: 'Arquivados',
    audiencias: 'Audiências',
    pendentes: 'Pendentes',
    partes: 'Partes',
    combinada: 'Combinada',
  };
  return tipos[tipo] || tipo;
};

/**
 * Retorna badge de status com cor apropriada
 */
const StatusBadge = ({ status }: { status: StatusCaptura }) => {
  const statusConfig: Record<StatusCaptura, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    pending: {
      label: 'Pendente',
      variant: 'secondary',
      className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    },
    in_progress: {
      label: 'Em Progresso',
      variant: 'secondary',
      className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
    },
    completed: {
      label: 'Concluída',
      variant: 'secondary',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    },
    failed: {
      label: 'Falhou',
      variant: 'destructive',
      className: 'bg-red-600 text-white border-red-600 dark:bg-red-700 dark:border-red-700'
    },
  };

  const config = statusConfig[status] || {
    label: status,
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  };

  return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
};

/**
 * Retorna a classe CSS de cor para badge do TRT
 */
const getTRTColorClass = (trt: string): string => {
  const trtColors: Record<string, string> = {
    'TRT1': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    'TRT2': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    'TRT3': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
    'TRT4': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800',
    'TRT5': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
    'TRT6': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800',
    'TRT7': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
    'TRT8': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-800',
    'TRT9': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800',
    'TRT10': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-200 dark:border-cyan-800',
    'TRT11': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-800',
    'TRT12': 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900 dark:text-violet-200 dark:border-violet-800',
    'TRT13': 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-800',
    'TRT14': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
    'TRT15': 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900 dark:text-lime-200 dark:border-lime-800',
    'TRT16': 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-800',
    'TRT17': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900 dark:text-fuchsia-200 dark:border-fuchsia-800',
    'TRT18': 'bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-900 dark:text-stone-200 dark:border-stone-800',
    'TRT19': 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800',
    'TRT20': 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-800',
    'TRT21': 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-800',
    'TRT22': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800',
    'TRT23': 'bg-blue-200 text-blue-900 border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-700',
    'TRT24': 'bg-green-200 text-green-900 border-green-300 dark:bg-green-800 dark:text-green-100 dark:border-green-700',
    'TST': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800',
  };

  return trtColors[trt] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

/**
 * Colunas da tabela de histórico
 */
function criarColunas(
  router: ReturnType<typeof useRouter>,
  onDelete: (captura: CapturaLog) => void,
  advogadosMap: Map<number, string>,
  credenciaisMap: Map<number, CodigoTRT>
): ColumnDef<CapturaLog>[] {
  return [
    {
      accessorKey: 'tipo_captura',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      enableSorting: true,
      size: 140,
      cell: ({ row }) => (
        <div className="text-sm">{formatarTipoCaptura(row.getValue('tipo_captura'))}</div>
      ),
    },
    {
      accessorKey: 'advogado_id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Advogado" />
      ),
      enableSorting: true,
      size: 200,
      cell: ({ row }) => {
        const advogadoId = row.getValue('advogado_id') as number | null;
        const nomeAdvogado = advogadoId ? advogadosMap.get(advogadoId) : null;
        return (
          <div className="text-sm">
            {nomeAdvogado || (advogadoId ? `#${advogadoId}` : '-')}
          </div>
        );
      },
    },
    {
      accessorKey: 'credencial_ids',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Tribunais" />
        </div>
      ),
      enableSorting: false,
      size: 200,
      cell: ({ row }) => {
        const credencialIds = row.getValue('credencial_ids') as number[];
        const tribunais = credencialIds
          .map((id) => credenciaisMap.get(id))
          .filter((tribunal): tribunal is CodigoTRT => tribunal !== undefined);

        // Remover duplicatas mantendo ordem
        const tribunaisUnicos = Array.from(new Set(tribunais));

        if (tribunaisUnicos.length === 0) {
          return <div className="text-sm text-center">-</div>;
        }

        const visibleCount = 3;
        const tribunaisVisiveis = tribunaisUnicos.slice(0, visibleCount);
        const tribunaisOcultos = tribunaisUnicos.slice(visibleCount);
        const hasMore = tribunaisOcultos.length > 0;

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-wrap gap-1 justify-center cursor-default">
                {tribunaisVisiveis.map((tribunal) => (
                  <Badge
                    key={tribunal}
                    variant="outline"
                    className={`text-xs ${getTRTColorClass(tribunal)}`}
                  >
                    {tribunal}
                  </Badge>
                ))}
                {hasMore && (
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
                    +{tribunaisOcultos.length}
                  </Badge>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="text-center">
                <div className="font-medium mb-1">Tribunais capturados</div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {tribunaisUnicos.map((tribunal) => (
                    <span key={tribunal} className="text-xs">
                      {tribunal}
                    </span>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 130,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <StatusBadge status={row.getValue('status')} />
        </div>
      ),
    },
    {
      accessorKey: 'iniciado_em',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Iniciado Em" />
      ),
      enableSorting: true,
      size: 180,
      cell: ({ row }) => (
        <div className="text-sm">{formatarDataHora(row.getValue('iniciado_em'))}</div>
      ),
    },
    {
      accessorKey: 'concluido_em',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Concluído Em" />
      ),
      enableSorting: true,
      size: 180,
      cell: ({ row }) => {
        const concluidoEm = row.getValue('concluido_em') as string | null;
        return (
          <div className="text-sm">{concluidoEm ? formatarDataHora(concluidoEm) : '-'}</div>
        );
      },
    },
    {
      accessorKey: 'erro',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Erro" />
      ),
      enableSorting: false,
      size: 250,
      cell: ({ row }) => {
        const erro = row.getValue('erro') as string | null;
        return (
          <div className="text-sm text-destructive max-w-[250px] truncate" title={erro || undefined}>
            {erro || '-'}
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Ações" />
        </div>
      ),
      size: 120,
      cell: ({ row }) => {
        const captura = row.original;
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/captura/historico/${captura.id}`)}
              title="Visualizar detalhes"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" title="Deletar">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar esta captura? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(captura)}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];
}

export default function HistoricoCapturasPage() {
  const router = useRouter();
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<CapturasFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [capturaDialogOpen, setCapturaDialogOpen] = React.useState(false);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  // Buscar advogados para filtro e mapeamento
  const { advogados } = useAdvogados({ limite: 1000 });

  // Buscar credenciais para mapeamento
  const { credenciais } = useCredenciais();

  // Criar mapa de advogado_id -> nome
  const advogadosMap = React.useMemo(() => {
    const map = new Map<number, string>();
    advogados?.forEach((advogado) => {
      map.set(advogado.id, advogado.nome_completo);
    });
    return map;
  }, [advogados]);

  // Criar mapa de credencial_id -> tribunal
  const credenciaisMap = React.useMemo(() => {
    const map = new Map<number, CodigoTRT>();
    credenciais?.forEach((credencial) => {
      map.set(credencial.id, credencial.tribunal);
    });
    return map;
  }, [credenciais]);

  // Parâmetros para buscar capturas
  const params = React.useMemo(
    () => ({
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      ...filtros,
    }),
    [pagina, limite, filtros]
  );

  // Buscar histórico de capturas
  const { capturas, paginacao, isLoading, error, refetch } = useCapturasLog(params);

  // Handler para deletar captura
  const handleDelete = React.useCallback(async (captura: CapturaLog) => {
    try {
      const response = await fetch(`/api/captura/historico/${captura.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar captura');
      }

      // Recarregar lista após deletar
      refetch();
    } catch (err) {
      console.error('Erro ao deletar captura:', err);
    }
  }, [refetch]);

  const colunas = React.useMemo(
    () => criarColunas(router, handleDelete, advogadosMap, credenciaisMap),
    [router, handleDelete, advogadosMap, credenciaisMap]
  );

  // Gerar opções de filtro
  const filterOptions = React.useMemo(() => buildCapturasFilterOptions(advogados), [advogados]);
  const filterGroups = React.useMemo(() => buildCapturasFilterGroups(advogados), [advogados]);

  // Converter IDs selecionados para filtros
  const handleFilterIdsChange = React.useCallback((newSelectedIds: string[]) => {
    setSelectedFilterIds(newSelectedIds);
    const newFilters = parseCapturasFilters(newSelectedIds);
    setFiltros(newFilters);
    setPagina(0);
  }, []);

  return (
    <div className="space-y-4">
      {/* Barra de busca e filtros */}
      <div className="flex items-center gap-4">
        <TableToolbar
          searchValue={busca}
          onSearchChange={(value) => {
            setBusca(value);
            setPagina(0);
          }}
          isSearching={isSearching}
          searchPlaceholder="Buscar capturas..."
          filterOptions={filterOptions}
          filterGroups={filterGroups}
          selectedFilters={selectedFilterIds}
          onFiltersChange={handleFilterIdsChange}
          filterButtonsMode="buttons"
          onNewClick={() => setCapturaDialogOpen(true)}
          newButtonTooltip="Nova Captura"
        />
      </div>

      {/* Tabela */}
      <DataTable
        data={capturas}
        columns={colunas}
        pagination={
          paginacao
            ? {
              pageIndex: paginacao.pagina - 1, // Converter para 0-indexed
              pageSize: paginacao.limite,
              total: paginacao.total,
              totalPages: paginacao.totalPaginas,
              onPageChange: setPagina,
              onPageSizeChange: setLimite,
            }
            : undefined
        }
        sorting={undefined}
        isLoading={isLoading}
        error={error}
        emptyMessage="Nenhuma captura encontrada no histórico."
      />

      {/* Dialog de nova captura */}
      <CapturaDialog
        open={capturaDialogOpen}
        onOpenChange={setCapturaDialogOpen}
        onSuccess={() => {
          refetch();
          setCapturaDialogOpen(false);
        }}
      />
    </div>
  );
}
