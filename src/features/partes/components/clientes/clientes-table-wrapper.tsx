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
import { DataTable } from '@/components/shared/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Cliente } from '../../types';
import { ClienteFormDialog } from './cliente-form';
import { getClientesColumns, ClienteComProcessos } from './columns';
import { actionListarClientes } from '@/app/actions/partes';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  initialData: Cliente[];
  initialPagination: PaginationInfo | null;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ClientesTableWrapper({
  initialData,
  initialPagination,
}: ClientesTableWrapperProps) {
  const router = useRouter();
  const [clientes, setClientes] = React.useState<ClienteComProcessos[]>(initialData as ClienteComProcessos[]);
  
  // Pagination State
  const [pageIndex, setPageIndex] = React.useState(initialPagination ? initialPagination.page - 1 : 0);
  const [pageSize, setPageSize] = React.useState(initialPagination ? initialPagination.limit : 50);
  const [total, setTotal] = React.useState(initialPagination ? initialPagination.total : 0);
  const [totalPages, setTotalPages] = React.useState(initialPagination ? initialPagination.totalPages : 0);
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Filter & Search State (mapped to DataTable state if needed, but here we control data fetching)
  const [globalFilter, setGlobalFilter] = React.useState('');
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
        // TODO: Pass column filters to backend if implemented
      });

      if (result.success) {
        const data = result.data as { data: ClienteComProcessos[]; pagination: PaginationInfo };
        setClientes(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, buscaDebounced]);

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

  const columns = React.useMemo(() => getClientesColumns(handleEdit), [handleEdit]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Tooltip>
           <TooltipTrigger asChild>
              <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
              </Button>
           </TooltipTrigger>
           <TooltipContent>Novo Cliente</TooltipContent>
        </Tooltip>
      </div>

      <DataTable
        data={clientes}
        columns={columns}
        pagination={{
            pageIndex,
            pageSize,
            total,
            totalPages,
            onPageChange: setPageIndex,
            onPageSizeChange: setPageSize
        }}
        isLoading={isLoading}
        error={error}
      />

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
    </div>
  );
}
