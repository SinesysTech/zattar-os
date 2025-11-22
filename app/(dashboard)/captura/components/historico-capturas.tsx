'use client';

// Componente de histórico de capturas (para usar dentro de abas)

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { buildCapturasFilterOptions, buildCapturasFilterGroups, parseCapturasFilters } from '../historico/components/capturas-toolbar-filters';
import { useCapturasLog } from '@/app/_lib/hooks/use-capturas-log';
import { useAdvogados } from '@/app/_lib/hooks/use-advogados';
import { deletarCapturaLog } from '@/app/_lib/api/captura';
import type { ColumnDef } from '@tanstack/react-table';
import type { CapturaLog, TipoCaptura, StatusCaptura } from '@/backend/types/captura/capturas-log-types';
import type { CapturasFilters } from '../historico/components/capturas-toolbar-filters';
import { Eye, Trash2 } from 'lucide-react';
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
  };
  return tipos[tipo] || tipo;
};

/**
 * Retorna badge de status com cor apropriada
 */
const StatusBadge = ({ status }: { status: StatusCaptura }) => {
  type StatusTone = 'warning' | 'info' | 'success' | 'danger' | 'neutral';

  const variants: Record<StatusCaptura, { label: string; tone: StatusTone; variant: 'soft' | 'solid' | 'outline' }> = {
    pending: { label: 'Pendente', tone: 'warning', variant: 'soft' },
    in_progress: { label: 'Em Progresso', tone: 'info', variant: 'soft' },
    completed: { label: 'Concluída', tone: 'success', variant: 'soft' },
    failed: { label: 'Falhou', tone: 'danger', variant: 'solid' },
  };

  const { label, variant, tone } = variants[status] || { label: status, tone: 'neutral', variant: 'outline' as const };

  return <Badge tone={tone} variant={variant}>{label}</Badge>;
};

/**
 * Colunas da tabela de histórico
 */
function criarColunas(
  router: ReturnType<typeof useRouter>,
  onDelete: (captura: CapturaLog) => void
): ColumnDef<CapturaLog>[] {
  return [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="ID" />
        </div>
      ),
      enableSorting: true,
      size: 80,
      cell: ({ row }) => (
        <div className="text-center text-sm font-mono">{row.getValue('id')}</div>
      ),
    },
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
        <DataTableColumnHeader column={column} title="Advogado ID" />
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const advogadoId = row.getValue('advogado_id') as number | null;
        return (
          <div className="text-sm text-center">
            {advogadoId ? `#${advogadoId}` : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'credencial_ids',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Credenciais" />
      ),
      enableSorting: false,
      size: 150,
      cell: ({ row }) => {
        const credencialIds = row.getValue('credencial_ids') as number[];
        return (
          <div className="text-sm">
            {credencialIds.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {credencialIds.slice(0, 3).map((id) => (
                  <Badge key={id} variant="outline" tone="neutral" className="text-xs">
                    #{id}
                  </Badge>
                ))}
                {credencialIds.length > 3 && (
                  <Badge variant="outline" tone="neutral" className="text-xs">
                    +{credencialIds.length - 3}
                  </Badge>
                )}
              </div>
            ) : (
              '-'
            )}
          </div>
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
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

interface HistoricoCapturaProps {
  onNewClick?: () => void;
  newButtonTooltip?: string;
}

export function HistoricoCapturas({ onNewClick, newButtonTooltip = 'Nova Captura' }: HistoricoCapturaProps = {}) {
  const router = useRouter();
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<CapturasFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  // Buscar advogados para filtro
  const { advogados } = useAdvogados({ limite: 100 });

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

  const handleDelete = React.useCallback(
    async (captura: CapturaLog) => {
      try {
        await deletarCapturaLog(captura.id);
        refetch();
      } catch (error) {
        console.error('Erro ao deletar captura:', error);
      }
    },
    [refetch]
  );

  const colunas = React.useMemo(() => criarColunas(router, handleDelete), [router, handleDelete]);

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
        onNewClick={onNewClick}
        newButtonTooltip={newButtonTooltip}
      />

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
    </div>
  );
}
