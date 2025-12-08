'use client';

// Página de contratos - Lista contratos do sistema

import * as React from 'react';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ui/responsive-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { ContratoViewSheet } from './components/contrato-view-sheet';
import { ContratoEditSheet } from './components/contrato-edit-sheet';
import { ContratoCreateSheet } from './components/contrato-create-sheet';
import { Eye, Pencil } from 'lucide-react';
import { useContratos } from '@/app/_lib/hooks/use-contratos';
import { buildContratosFilterOptions, buildContratosFilterGroups, parseContratosFilters } from './components/contratos-toolbar-filters';
import type { Contrato } from '@/backend/contratos/services/persistence/contrato-persistence.service';
import type { ContratosFilters } from '@/app/_lib/types/contratos';
import {
  formatarAreaDireito,
  formatarTipoContrato,
  formatarTipoCobranca,
  formatarStatusContrato,
  formatarData,
  getStatusBadgeStyle,
  getTipoContratoBadgeStyle,
} from '@/app/_lib/utils/format-contratos';

/**
 * Componente de ações para cada contrato
 */
function ContratoActions({
  contrato,
  onEditSuccess,
}: {
  contrato: Contrato;
  onEditSuccess: () => void;
}) {
  const [viewOpen, setViewOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <>
      <ButtonGroup>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewOpen(true)}
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar contrato</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar contrato</span>
        </Button>
      </ButtonGroup>
      <ContratoViewSheet
        open={viewOpen}
        onOpenChange={setViewOpen}
        contrato={contrato}
      />
      <ContratoEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        contrato={contrato}
        onSuccess={onEditSuccess}
      />
    </>
  );
}

/**
 * Define as colunas da tabela de contratos
 */
function criarColunas(onEditSuccess: () => void): ResponsiveTableColumn<Contrato>[] {
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
      priority: 1,
      sticky: true,
      cardLabel: 'ID',
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm font-medium">
          #{row.getValue('id')}
        </div>
      ),
    },
    {
      accessorKey: 'dataContratacao',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Data" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      priority: 2,
      cardLabel: 'Data',
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {formatarData(row.getValue('dataContratacao'))}
        </div>
      ),
    },
    {
      accessorKey: 'areaDireito',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Área de Direito" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      priority: 4,
      cardLabel: 'Área de Direito',
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center">
          <Badge variant="outline">
            {formatarAreaDireito(row.getValue('areaDireito'))}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'tipoContrato',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Tipo" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      priority: 5,
      cardLabel: 'Tipo',
      cell: ({ row }) => {
        const tipo = row.getValue('tipoContrato') as Contrato['tipoContrato'];
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge {...getTipoContratoBadgeStyle(tipo)}>
              {formatarTipoContrato(tipo)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'tipoCobranca',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Cobrança" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      priority: 6,
      cardLabel: 'Cobrança',
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {formatarTipoCobranca(row.getValue('tipoCobranca'))}
        </div>
      ),
    },
    {
      accessorKey: 'clienteId',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Cliente" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      priority: 7,
      cardLabel: 'Cliente',
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          ID: {row.getValue('clienteId')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 140,
      priority: 3,
      cardLabel: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as Contrato['status'];
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge {...getStatusBadgeStyle(status)}>
              {formatarStatusContrato(status)}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Ações</div>
        </div>
      ),
      enableSorting: false,
      size: 120,
      priority: 8,
      cardLabel: 'Ações',
      cell: ({ row }) => {
        const contrato = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <ContratoActions contrato={contrato} onEditSuccess={onEditSuccess} />
          </div>
        );
      },
    },
  ];
}

export default function ContratosPage() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<ContratosFilters>({});
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  // Gerar opções e grupos de filtro
  const filterOptions = React.useMemo(() => buildContratosFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildContratosFilterGroups(), []);

  // Parâmetros para buscar contratos
  const params = React.useMemo(() => {
    return {
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      ...filtros,
    };
  }, [pagina, limite, buscaDebounced, filtros]);

  const { contratos, paginacao, isLoading, error, refetch } = useContratos(params);

  // Função para atualizar após edição ou criação
  const handleEditSuccess = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const colunas = React.useMemo(() => criarColunas(handleEditSuccess), [handleEditSuccess]);

  const handleFilterIdsChange = React.useCallback((newSelectedFilterIds: string[]) => {
    setSelectedFilterIds(newSelectedFilterIds);
    const newFilters = parseContratosFilters(newSelectedFilterIds);
    setFiltros(newFilters);
    setPagina(0); // Resetar para primeira página ao aplicar filtros
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
        searchPlaceholder="Buscar por observações..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        onNewClick={() => setCreateOpen(true)}
        newButtonTooltip="Novo Contrato"
        filterButtonsMode="panel"
        filterPanelTitle="Filtros de Contratos"
        filterPanelDescription="Filtre contratos por área, tipo, status e mais"
      />

      {/* Tabela */}
      <ResponsiveTable
        data={contratos || []}
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
        mobileLayout="cards"
        stickyFirstColumn={true}
        emptyMessage="Nenhum contrato encontrado."
        rowActions={[
          {
            label: 'Visualizar',
            icon: <Eye className="h-4 w-4" />,
            onClick: (row) => {
              // This will be handled by the ContratoActions component in the card
            },
          },
          {
            label: 'Editar',
            icon: <Pencil className="h-4 w-4" />,
            onClick: (row) => {
              // This will be handled by the ContratoActions component in the card
            },
          },
        ]}
      />

      {/* Sheet para criação */}
      <ContratoCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
