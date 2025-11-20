'use client';

// Página de histórico de capturas

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { buildCapturasFilterOptions, buildCapturasFilterGroups, parseCapturasFilters } from './components/capturas-toolbar-filters';
import { useCapturasLog } from '@/lib/hooks/use-capturas-log';
import { useAdvogados } from '@/lib/hooks/use-advogados';
import type { ColumnDef } from '@tanstack/react-table';
import type { CapturaLog, TipoCaptura, StatusCaptura } from '@/backend/types/captura/capturas-log-types';
import type { CapturasFilters } from './components/capturas-toolbar-filters';

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
  const variants: Record<StatusCaptura, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Pendente', variant: 'outline' },
    in_progress: { label: 'Em Progresso', variant: 'secondary' },
    completed: { label: 'Concluída', variant: 'default' },
    failed: { label: 'Falhou', variant: 'destructive' },
  };

  const { label, variant } = variants[status] || { label: status, variant: 'outline' };

  return <Badge variant={variant}>{label}</Badge>;
};

/**
 * Colunas da tabela de histórico
 */
function criarColunas(): ColumnDef<CapturaLog>[] {
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
                  <Badge key={id} variant="outline" className="text-xs">
                    #{id}
                  </Badge>
                ))}
                {credencialIds.length > 3 && (
                  <Badge variant="outline" className="text-xs">
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
  ];
}

export default function HistoricoCapturasPage() {
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

  const colunas = React.useMemo(() => criarColunas(), []);

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
      <div>
        <h1 className="text-2xl font-bold">Histórico de Capturas</h1>
        <p className="text-sm text-muted-foreground">
          Visualize todas as capturas realizadas no sistema
        </p>
      </div>

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
    </div>
  );
}

