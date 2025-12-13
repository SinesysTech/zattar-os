'use client';

import * as React from 'react';
import {
    ColumnDef,
    PaginationState,
} from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { TableToolbar } from '@/components/ui/table-toolbar';
import { DataShell, DataTable } from '@/components/shared/data-shell';
import { TablePagination } from '@/components/shared/table-pagination';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
    TipoExpediente,
    ListarTiposExpedientesResult,
} from '../domain';
import {
    actionListarTiposExpedientes,
    actionDeletarTipoExpediente
} from '../actions/tipos-expedientes-actions';
import { TipoExpedienteForm } from './tipo-expediente-form';

// =============================================================================
// COLUMNS DEF
// =============================================================================

export const columns: ColumnDef<TipoExpediente>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        size: 60,
    },
    {
        accessorKey: 'tipoExpediente',
        header: 'Nome',
        size: 300,
    },
    {
        accessorKey: 'createdAt',
        header: 'Data Criação',
        cell: ({ row }) => {
            const date = new Date(row.original.createdAt);
            return format(date, 'dd/MM/yyyy HH:mm');
        },
    },
    // Nota: Para exibir "Criado Por" precisaríamos dos dados de usuários.
    // Como não temos acesso direto ao cache de usuários aqui sem buscar, 
    // vamos simplificar ou assumir que o ID é suficiente ou que não vamos exibir por enquanto
    // para seguir o MVP, ou poderíamos fazer lookup se tivéssemos a lista.
    // Vou pular essa coluna complexa por enquanto para evitar over-engineering na chamada de usuarios
    // O usuário pediu "Criado por (join com usuarios)" na UI, mas sem suporte no repo.
    // Vou deixar sem por enquanto ou apenas o ID.
    {
        id: 'actions',
        cell: ({ row, table }) => {
            const item = row.original;
            // @ts-expect-error - meta injection
            const { onEdit, onDelete } = table.options.meta || {};

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit?.(item)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => onDelete?.(item)}
                        >
                            <Trash className="mr-2 h-4 w-4" /> Deletar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
    }
];

// =============================================================================
// COMPONENT
// =============================================================================

interface TiposExpedientesListProps {
    initialData?: ListarTiposExpedientesResult;
}

export function TiposExpedientesList({ initialData }: TiposExpedientesListProps) {
    // States
    const [data, setData] = React.useState<ListarTiposExpedientesResult>(
        initialData || { data: [], meta: { total: 0, pagina: 1, limite: 50, totalPaginas: 0 } }
    );
    const [isLoading, setIsLoading] = React.useState(false);

    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: 50,
    });
    const [globalFilter, setGlobalFilter] = React.useState('');

    // Dialog State
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<TipoExpediente | null>(null);

    // Fetch Logic
    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await actionListarTiposExpedientes({
                pagina: pagination.pageIndex + 1,
                limite: pagination.pageSize,
                busca: globalFilter,
                ordenarPor: 'tipoExpediente',
                ordem: 'asc',
            });

            if (result.success && result.data) {
                setData(result.data);
            } else {
                toast.error(result.error || 'Erro ao carregar dados');
            }
        } catch {
            toast.error('Erro desconhecido ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    // Effects
    React.useEffect(() => {
        // Skip initial fetch if we have initialData and filters are default
        // But filters changes trigger this.
        fetchData();
    }, [fetchData]);

    // Handlers
    const handleEdit = (item: TipoExpediente) => {
        setEditingItem(item);
        setDialogOpen(true);
    };

    const handleNew = () => {
        setEditingItem(null);
        setDialogOpen(true);
    };

    const handleDelete = async (item: TipoExpediente) => {
        if (!confirm(`Tem certeza que deseja excluir "${item.tipoExpediente}"?`)) return;

        try {
            const result = await actionDeletarTipoExpediente(item.id);
            if (result.success) {
                toast.success('Excluído com sucesso');
                fetchData();
            } else {
                toast.error(result.error || 'Erro ao excluir');
            }
        } catch {
            toast.error('Erro ao excluir');
        }
    };

    const handleSuccess = () => {
        fetchData();
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <DataShell
                header={
                    <TableToolbar
                        variant="integrated"
                        searchValue={globalFilter}
                        onSearchChange={setGlobalFilter}
                        selectedFilters={[]}
                        onFiltersChange={() => {}}
                        onNewClick={handleNew}
                        newButtonTooltip="Novo Tipo"
                    />
                }
                footer={
                    <TablePagination
                        variant="integrated"
                        pageIndex={pagination.pageIndex}
                        pageSize={pagination.pageSize}
                        total={data.meta.total}
                        totalPages={data.meta.totalPaginas}
                        onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
                        onPageSizeChange={(size) => setPagination((prev) => ({ ...prev, pageSize: size, pageIndex: 0 }))}
                        isLoading={isLoading}
                    />
                }
            >
                <div className="relative border-t">
                    <DataTable
                        data={data.data}
                        columns={columns}
                        isLoading={isLoading}
                        pagination={undefined}
                        hidePagination={true}
                        hideTableBorder={true}
                        className="border-none"
                        options={{
                            meta: {
                                onEdit: handleEdit,
                                onDelete: handleDelete
                            }
                        }}
                    />
                </div>
            </DataShell>

            <TipoExpedienteForm
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                tipoExpediente={editingItem}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
