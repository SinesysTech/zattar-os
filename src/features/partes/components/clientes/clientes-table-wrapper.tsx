'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Columns, Plus, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { Cliente } from '../../types';
import { ClienteFormDialog } from './cliente-form';
import { getClientesColumns, ClienteComProcessos } from './columns';
import { actionDesativarCliente, actionListarClientes } from '../../actions';
import { ChatwootSyncButton } from '@/features/chatwoot/components';
import { FilterPopover } from '../shared';

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

  // Pagination
  const [pageIndex, setPageIndex] = React.useState(initialPagination ? initialPagination.page - 1 : 0);
  const [pageSize, _setPageSize] = React.useState(initialPagination ? initialPagination.limit : 50);
  const [total, setTotal] = React.useState(initialPagination ? initialPagination.total : 0);
  const [totalPages, setTotalPages] = React.useState(initialPagination ? initialPagination.totalPages : 0);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Search & Filters
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [tipoPessoa, setTipoPessoa] = React.useState<'all' | 'pf' | 'pj'>('all');
  const [situacao, setSituacao] = React.useState<'ativo' | 'inativo' | ''>('ativo');

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [clienteParaEditar, setClienteParaEditar] = React.useState<ClienteComProcessos | null>(null);

  const buscaDebounced = useDebounce(globalFilter, 500);

  // Data fetching
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
        incluir_endereco: true,
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

  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialPagination) return;
    }
    refetch();
  }, [pageIndex, pageSize, buscaDebounced, refetch, initialPagination]);

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

  const table = useReactTable({
    data: clientes,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnVisibility },
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <>
      <div className="w-full">
        <div className="flex items-center gap-4 py-4">
          <div className="flex gap-2 flex-1">
            <div className="relative max-w-sm">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Buscar clientes..."
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  setPageIndex(0);
                }}
                className="w-full pl-9 bg-white"
              />
            </div>
            <FilterPopover
              label="Situação"
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
              ]}
              value={situacao}
              onValueChange={(val) => {
                setSituacao(val as typeof situacao);
                setPageIndex(0);
              }}
              defaultValue=""
            />
            <FilterPopover
              label="Tipo Pessoa"
              options={[
                { value: 'pf', label: 'Pessoa Física' },
                { value: 'pj', label: 'Pessoa Jurídica' },
              ]}
              value={tipoPessoa}
              onValueChange={(val) => {
                setTipoPessoa(val as typeof tipoPessoa);
                setPageIndex(0);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <ChatwootSyncButton
              tipoEntidade="cliente"
              apenasAtivos={situacao === 'ativo'}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 bg-white">
                  <Columns className="h-4 w-4" />
                  <span className="hidden md:inline">Colunas</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setCreateOpen(true)} className="h-10">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((_, j) => (
                      <TableCell key={`skeleton-${i}-${j}`}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 0 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-muted-foreground text-sm">
              {total} registro(s)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Página {pageIndex + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                disabled={pageIndex === 0 || isLoading}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(Math.min(totalPages - 1, pageIndex + 1))}
                disabled={pageIndex >= totalPages - 1 || isLoading}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>

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
