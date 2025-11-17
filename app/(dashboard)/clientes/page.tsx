'use client';

// Página de clientes - Lista clientes do sistema

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ClienteViewSheet } from '@/components/clientes/cliente-view-sheet';
import { ClienteEditSheet } from '@/components/clientes/cliente-edit-sheet';
import { ClienteCreateSheet } from '@/components/clientes/cliente-create-sheet';
import { Eye, Pencil, Plus } from 'lucide-react';
import { useClientes } from '@/lib/hooks/use-clientes';
import type { ColumnDef } from '@tanstack/react-table';
import type { Cliente } from '@/backend/clientes/services/persistence/cliente-persistence.service';
import type { ClientesFilters } from '@/lib/types/clientes';
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarNome,
  formatarTipoPessoa,
} from '@/lib/utils/format-clientes';

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
        <div className="min-h-[2.5rem] flex items-center justify-start text-sm">
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
          <div className="min-h-[2.5rem] flex items-center justify-center">
            <Badge variant="outline">
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
          <div className="min-h-[2.5rem] flex items-center justify-center text-sm">
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
        <div className="min-h-[2.5rem] flex items-center justify-start text-sm">
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
        <div className="min-h-[2.5rem] flex items-center justify-center text-sm">
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
          <div className="min-h-[2.5rem] flex items-center justify-center">
            <Badge variant={ativo ? 'default' : 'secondary'}>
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
          <div className="min-h-[2.5rem] flex items-center justify-center gap-2">
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

/**
 * Componente de filtros avançados
 */
interface ClientesFiltrosAvancadosProps {
  filters: ClientesFilters;
  onFiltersChange: (filters: ClientesFilters) => void;
  onReset: () => void;
}

function ClientesFiltrosAvancados({
  filters,
  onFiltersChange,
  onReset,
}: ClientesFiltrosAvancadosProps) {
  const [open, setOpen] = React.useState(false);

  const handleTipoPessoaChange = (tipo: 'pf' | 'pj' | null) => {
    onFiltersChange({ ...filters, tipoPessoa: tipo || undefined });
  };

  const handleAtivoChange = (ativo: boolean | null) => {
    onFiltersChange({ ...filters, ativo: ativo ?? undefined });
  };

  const hasFilters = filters.tipoPessoa !== undefined || filters.ativo !== undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          Filtros Avançados
          {hasFilters && (
            <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Tipo de Pessoa</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoPessoa"
                  checked={filters.tipoPessoa === 'pf'}
                  onChange={() => handleTipoPessoaChange('pf')}
                  className="h-4 w-4"
                />
                <span className="text-sm">Pessoa Física</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoPessoa"
                  checked={filters.tipoPessoa === 'pj'}
                  onChange={() => handleTipoPessoaChange('pj')}
                  className="h-4 w-4"
                />
                <span className="text-sm">Pessoa Jurídica</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoPessoa"
                  checked={filters.tipoPessoa === undefined}
                  onChange={() => handleTipoPessoaChange(null)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Todos</span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold">Status</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ativo"
                  checked={filters.ativo === true}
                  onChange={() => handleAtivoChange(true)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Ativo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ativo"
                  checked={filters.ativo === false}
                  onChange={() => handleAtivoChange(false)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Inativo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="ativo"
                  checked={filters.ativo === undefined}
                  onChange={() => handleAtivoChange(null)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Todos</span>
              </label>
            </div>
          </div>
          {hasFilters && (
            <>
              <div className="h-px bg-border" />
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  onReset();
                  setOpen(false);
                }}
              >
                Limpar Filtros
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function ClientesPage() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<ClientesFilters>({});
  const [createOpen, setCreateOpen] = React.useState(false);
  
  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  
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
  
  const handleFiltersChange = React.useCallback((newFilters: ClientesFilters) => {
    setFiltros(newFilters);
    setPagina(0); // Resetar para primeira página ao aplicar filtros
  }, []);
  
  const handleFiltersReset = React.useCallback(() => {
    setFiltros({});
    setPagina(0);
  }, []);
  
  return (
    <div className="space-y-4">
      {/* Barra de busca e filtros */}
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nome, CPF, CNPJ ou e-mail..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(0); // Resetar para primeira página ao buscar
            }}
            className="max-w-sm"
          />
          <ClientesFiltrosAvancados
            filters={filtros}
            onFiltersChange={handleFiltersChange}
            onReset={handleFiltersReset}
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>
      
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

