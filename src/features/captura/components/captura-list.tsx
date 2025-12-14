'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { DataPagination, DataShell, DataTable } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { buildCapturasFilterOptions, buildCapturasFilterGroups, parseCapturasFilters } from './captura-filters';
import { useCapturasLog } from '@/features/captura/hooks/use-capturas-log';
import { useAdvogados } from '@/features/advogados';
import { useCredenciais } from '@/features/advogados';
import { deletarCapturaLog } from '@/features/captura/services/api-client';
import type { ColumnDef } from '@tanstack/react-table';
import type { CapturaLog, TipoCaptura, StatusCaptura } from '@/features/captura/types';
import type { CapturasFilters } from './captura-filters';
import type { CodigoTRT } from '@/types/credenciais';
import { Eye, Trash2 } from 'lucide-react';
import { getSemanticBadgeVariant, CAPTURA_STATUS_LABELS } from '@/lib/design-system';
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
    partes: 'Partes',
    combinada: 'Combinada', // Added 'combinada' to handle backend type if present
  };
  return tipos[tipo] || tipo;
};

/**
 * Retorna badge de status com cor apropriada usando o sistema semântico.
 *
 * @ai-context Este componente usa getSemanticBadgeVariant() do design system.
 */
const StatusBadge = ({ status }: { status: StatusCaptura }) => {
  const variant = getSemanticBadgeVariant('captura_status', status);
  const label = CAPTURA_STATUS_LABELS[status] || status;

  return <Badge variant={variant}>{label}</Badge>;
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
        <div className="flex items-center justify-center overflow-hidden">
          <DataTableColumnHeader column={column} title="Advogado" />
        </div>
      ),
      enableSorting: true,
      size: 220,
      minSize: 200,
      cell: ({ row }) => {
        const advogadoId = row.getValue('advogado_id') as number | null;
        const nomeAdvogado = advogadoId ? advogadosMap.get(advogadoId) : null;
        return (
          <div className="text-sm text-center">
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

        return (
          <div className="text-sm">
            {tribunaisUnicos.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-center">
                {tribunaisUnicos.slice(0, 3).map((tribunal) => (
                  <Badge
                    key={tribunal}
                    variant={getSemanticBadgeVariant('tribunal', tribunal)}
                    className="text-xs"
                  >
                    {tribunal}
                  </Badge>
                ))}
                {tribunaisUnicos.length > 3 && (
                  <Badge variant="neutral" className="text-xs">
                    +{tribunaisUnicos.length - 3}
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

interface CapturaListProps {
  onNewClick?: () => void;
  newButtonTooltip?: string;
}

export function CapturaList({ onNewClick, newButtonTooltip = 'Nova Captura' }: CapturaListProps = {}) {
  const router = useRouter();
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<CapturasFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  // Buscar advogados para filtro e mapeamento
  const { advogados } = useAdvogados({ limite: 1000 });

  // Buscar credenciais para mapeamento
  const { credenciais } = useCredenciais({});

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
    <DataShell
      header={
        <TableToolbar
          variant="integrated"
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
      }
      footer={
        paginacao ? (
          <DataPagination
            pageIndex={paginacao.pagina - 1}
            pageSize={paginacao.limite}
            total={paginacao.total}
            totalPages={paginacao.totalPaginas}
            onPageChange={setPagina}
            onPageSizeChange={setLimite}
            isLoading={isLoading}
          />
        ) : null
      }
    >
      <div className="relative border-t">
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
          hideTableBorder={true}
          hidePagination={true}
        />
      </div>
    </DataShell>
  );
}
