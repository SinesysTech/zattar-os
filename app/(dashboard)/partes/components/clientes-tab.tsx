'use client';

/**
 * Tab de Clientes
 * Lista e gerencia clientes do escritório
 */

import * as React from 'react';
import Link from 'next/link';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ButtonGroup } from '@/components/ui/button-group';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Eye, Pencil } from 'lucide-react';
import { useClientes } from '@/app/_lib/hooks/use-clientes';
import type { ColumnDef } from '@tanstack/react-table';
import type { Cliente } from '@/app/_lib/types';
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
  type ClientesFilters,
} from './clientes-toolbar-filters';

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
      accessorKey: 'tipo_pessoa',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Tipo" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const tipoPessoa = row.getValue('tipo_pessoa') as 'pf' | 'pj';
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
        const documento = cliente.tipo_pessoa === 'pf'
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
      id: 'email',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">E-mail</div>
        </div>
      ),
      enableSorting: false,
      size: 200,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const cliente = row.original;
        const emails = cliente.emails;
        return (
          <div className="min-h-10 flex items-center justify-start text-sm">
            {emails && emails.length > 0 ? emails[0] : '-'}
          </div>
        );
      },
    },
    {
      id: 'telefone',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Telefone</div>
        </div>
      ),
      enableSorting: false,
      size: 150,
      cell: ({ row }) => {
        const cliente = row.original;
        const telefone = cliente.ddd_residencial && cliente.numero_residencial
          ? `${cliente.ddd_residencial}${cliente.numero_residencial}`
          : null;
        return (
          <div className="min-h-10 flex items-center justify-center text-sm">
            {telefone ? formatarTelefone(telefone) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'situacao_pje',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => {
        const situacao = row.getValue('situacao_pje') as string | null;
        const ativo = situacao === 'A';
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
  return (
    <ButtonGroup>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        asChild
      >
        <Link href={`/partes/clientes/${cliente.id}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar cliente</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Editar cliente</span>
      </Button>
    </ButtonGroup>
  );
}

export function ClientesTab() {
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

  const filterOptions = React.useMemo(() => buildClientesFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildClientesFilterGroups(), []);

  // Handler para mudança de filtros
  const handleFilterIdsChange = React.useCallback((ids: string[]) => {
    setSelectedFilterIds(ids);
    const newFilters = parseClientesFilters(ids);
    setFiltros(newFilters);
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

      {/* TODO: Implementar ClienteCreateSheet */}
      {/* <ClienteCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleEditSuccess}
      /> */}
    </div>
  );
}
