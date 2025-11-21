'use client';

// Página de clientes - Lista clientes do sistema

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ButtonGroup } from '@/components/ui/button-group';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { ClienteViewSheet } from './components/cliente-view-sheet';
import { ClienteEditSheet } from './components/cliente-edit-sheet';
import { ClienteCreateSheet } from './components/cliente-create-sheet';
import { Eye, Pencil } from 'lucide-react';
import { useClientes } from '@/app/_lib/hooks/use-clientes';
import type { ColumnDef } from '@tanstack/react-table';
import type { Cliente } from '@/backend/clientes/services/persistence/cliente-persistence.service';
import type { ClientesFilters } from '@/app/_lib/types/clientes';
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarNome,
  formatarTipoPessoa,
} from '@/app/_lib/utils/format-clientes';
import {
  buildClientesFilterOptions,
  buildClientesFilterGroups,
  parseClientesFilters,
} from './components/clientes-toolbar-filters';

/**
 * Define as colunas da tabela de clientes
 */
function criarColunas(onEditSuccess: () => void): ColumnDef<Cliente>[] {
  return [
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Nome/Razão Social" />
        </div>
      ),
      enableSorting: true,
      size: 250,
      meta: { align: 'left' },
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-start text-sm">
          {formatarNome(row.getValue('nome'))}
        </div>
      ),
    },
    {
      accessorKey: 'tipoPessoa',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Tipo" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const tipoPessoa = row.getValue('tipoPessoa') as 'pf' | 'pj';
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant="outline" tone="neutral">
              {formatarTipoPessoa(tipoPessoa)}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'documento',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">CPF/CNPJ</div>
        </div>
      ),
      enableSorting: false,
      size: 150,
      cell: ({ row }) => {
        const cliente = row.original;
        const documento = cliente.tipoPessoa === 'pf' 
          ? formatarCpf(cliente.cpf)
          : formatarCnpj(cliente.cnpj);
        return (
          <div className="min-h-10 flex items-center justify-center text-sm">
            {documento}
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="E-mail" />
        </div>
      ),
      enableSorting: true,
      size: 200,
      meta: { align: 'left' },
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-start text-sm">
          {row.getValue('email') || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'telefonePrimario',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Telefone</div>
        </div>
      ),
      enableSorting: false,
      size: 150,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {formatarTelefone(row.getValue('telefonePrimario'))}
        </div>
      ),
    },
    {
      accessorKey: 'ativo',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => {
        const ativo = row.getValue('ativo') as boolean;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge tone={ativo ? 'success' : 'neutral'} variant={ativo ? 'soft' : 'outline'}>
              {ativo ? 'Ativo' : 'Inativo'}
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
      cell: ({ row }) => {
        const cliente = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <ClienteActions cliente={cliente} onEditSuccess={onEditSuccess} />
          </div>
        );
      },
    },
  ];
}

/**
 * Componente de ações para cada cliente
 */
function ClienteActions({ 
  cliente,
  onEditSuccess,
}: { 
  cliente: Cliente;
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
          <span className="sr-only">Visualizar cliente</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar cliente</span>
        </Button>
      </ButtonGroup>
      <ClienteViewSheet
        open={viewOpen}
        onOpenChange={setViewOpen}
        cliente={cliente}
      />
      <ClienteEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        cliente={cliente}
        onSuccess={onEditSuccess}
      />
    </>
  );
}

export default function ClientesPage() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<ClientesFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  // Parâmetros para buscar clientes
  const params = React.useMemo(() => {
    return {
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      ...filtros,
    };
  }, [pagina, limite, buscaDebounced, filtros]);

  const { clientes, paginacao, isLoading, error, refetch } = useClientes(params);

  // Função para atualizar após edição
  const handleEditSuccess = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const colunas = React.useMemo(() => criarColunas(handleEditSuccess), [handleEditSuccess]);

  // Construir opções e grupos de filtros
  const filterOptions = React.useMemo(() => buildClientesFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildClientesFilterGroups(), []);

  // Handler para mudança de filtros
  const handleFilterIdsChange = React.useCallback((ids: string[]) => {
    setSelectedFilterIds(ids);
    const parsed = parseClientesFilters(ids);
    setFiltros(parsed);
    setPagina(0); // Reset página ao aplicar filtros
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
        searchPlaceholder="Buscar por nome, CPF, CNPJ ou e-mail..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        onNewClick={() => setCreateOpen(true)}
        newButtonTooltip="Novo Cliente"
      />
      
      {/* Tabela */}
      <DataTable
        data={clientes}
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
        emptyMessage="Nenhum cliente encontrado."
      />

      {/* Sheet para criação */}
      <ClienteCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
