'use client';

/**
 * ClientesTableWrapper - Componente Client que encapsula a tabela de clientes
 *
 * Recebe dados iniciais do Server Component e gerencia:
 * - Estado de busca e filtros
 * - Paginacao client-side com refresh via Server Actions
 * - Dialogs de criacao e edicao
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { DataShell, DataPagination, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import type { Cliente } from '../../types';
import { ClienteFormDialog } from './cliente-form';
import { getClientesColumns, ClienteComProcessos } from './columns';
import { actionDesativarCliente, actionListarClientes } from '../../actions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Table as TanstackTable } from '@tanstack/react-table';

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

interface ClientesTableWrapperProps {
  initialData?: Cliente[];
  initialPagination?: PaginationInfo | null;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ClientesTableWrapper({
  initialData = [],
  initialPagination = null,
}: ClientesTableWrapperProps = {}) {
  const router = useRouter();
  const [clientes, setClientes] = React.useState<ClienteComProcessos[]>(initialData as ClienteComProcessos[]);
  const [table, setTable] = React.useState<TanstackTable<ClienteComProcessos> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');
  
  // Pagination State
  const [pageIndex, setPageIndex] = React.useState(initialPagination ? initialPagination.page - 1 : 0);
  const [pageSize, setPageSize] = React.useState(initialPagination ? initialPagination.limit : 50);
  const [total, setTotal] = React.useState(initialPagination ? initialPagination.total : 0);
  const [totalPages, setTotalPages] = React.useState(initialPagination ? initialPagination.totalPages : 0);
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Filter & Search State (mapped to DataTable state if needed, but here we control data fetching)
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [tipoPessoa, setTipoPessoa] = React.useState<'all' | 'pf' | 'pj'>('all');
  const [situacao, setSituacao] = React.useState<'ativo' | 'inativo' | ''>('ativo');
  // We can map specific column filters here if we want to server-side filter them
  // For now, let's focus on global search and simple pagination as in the original
  
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [clienteParaEditar, setClienteParaEditar] = React.useState<ClienteComProcessos | null>(null);

  const buscaDebounced = useDebounce(globalFilter, 500);

  // Funcao para recarregar dados
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarClientes({
        pagina: pageIndex + 1,
        limite: pageSize,
        busca: buscaDebounced || undefined,
        tipo_pessoa: tipoPessoa === 'all' ? undefined : tipoPessoa,
        ativo: situacao === '' ? undefined : situacao === 'ativo',
        incluir_processos: true,
      });

      if (result.success) {
        const data = result.data as { data: ClienteComProcessos[]; pagination: PaginationInfo };
        setClientes(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(result.error || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, buscaDebounced, tipoPessoa, situacao]);

  // Ref para controlar primeira renderizacao
  const isFirstRender = React.useRef(true);

  // Recarregar quando parametros mudam
  React.useEffect(() => {
    // Evitar execucao na montagem inicial
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    refetch();
  }, [pageIndex, pageSize, buscaDebounced, refetch]);

  const handleEdit = React.useCallback((cliente: ClienteComProcessos) => {
    setClienteParaEditar(cliente);
    setEditOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    async (cliente: ClienteComProcessos) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await actionDesativarCliente(cliente.id);
        if (!result.success) {
          setError(result.error);
          return;
        }
        await refetch();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao desativar cliente');
      } finally {
        setIsLoading(false);
      }
    },
    [refetch, router]
  );

  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
    setClienteParaEditar(null);
    router.refresh();
  }, [refetch, router]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
    router.refresh();
  }, [refetch, router]);

  const columns = React.useMemo(
    () => getClientesColumns(handleEdit, handleDelete),
    [handleEdit, handleDelete]
  );

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
                label: 'Novo Cliente',
                onClick: () => setCreateOpen(true),
              }}
              filtersSlot={
                <>
                  <Select
                    value={situacao}
                    onValueChange={(val) => {
                      const next = val as 'ativo' | 'inativo' | '';
                      setSituacao(next);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-10 w-[150px]">
                      <SelectValue placeholder="Situação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={tipoPessoa}
                    onValueChange={(val) => {
                      const next = val as 'all' | 'pf' | 'pj';
                      setTipoPessoa(next);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-10 w-[170px]">
                      <SelectValue placeholder="Tipo de pessoa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="pf">Pessoa Física</SelectItem>
                      <SelectItem value="pj">Pessoa Jurídica</SelectItem>
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
        <div className="relative border-t">
          <DataTable
            data={clientes}
            columns={columns}
            pagination={{
              pageIndex,
              pageSize,
              total,
              totalPages,
              onPageChange: setPageIndex,
              onPageSizeChange: setPageSize,
            }}
            isLoading={isLoading}
            error={error}
            density={density}
            onTableReady={(t) => setTable(t as TanstackTable<ClienteComProcessos>)}
            hideTableBorder={true}
            emptyMessage="Nenhum cliente encontrado."
          />
        </div>
      </DataShell>

      <ClienteFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        mode="create"
      />

      {clienteParaEditar && (
        <ClienteFormDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setClienteParaEditar(null);
          }}
          cliente={clienteParaEditar}
          onSuccess={handleEditSuccess}
          mode="edit"
        />
      )}
    </>
  );
}
