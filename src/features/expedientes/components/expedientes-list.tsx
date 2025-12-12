'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  PaginationState,
  SortingState,
} from '@tanstack/react-table';
import {
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

import { DataSurface } from '@/components/shared/data-surface';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { DataTable } from '@/components/ui/data-table';
import { TablePagination } from '@/components/shared/table-pagination';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ListarExpedientesParams, ExpedientesApiResponse, ExpedientesFilters } from '../domain';
import { actionListarExpedientes } from '../actions';
import { columns } from './columns';
import { ExpedienteDialog } from './expediente-dialog';

interface ExpedientesListProps {
  initialData?: ExpedientesApiResponse; // Optional initial data from server
}

export function ExpedientesList({ initialData }: ExpedientesListProps) {
  const router = useRouter();

  // Dialog State
  const [isNovoDialogOpen, setIsNovoDialogOpen] = React.useState(false);

  // Table State
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  // Custom Filters State
  const [statusFilter, setStatusFilter] = React.useState<'todos' | 'pendentes' | 'baixados'>('pendentes');
  const [prazoFilter, setPrazoFilter] = React.useState<'todos' | 'vencidos' | 'hoje' | 'amanha' | 'semana'>('todos');
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date } | undefined>(undefined);

  // Aux Data State
  const [usuarios, setUsuarios] = React.useState<any[]>([]);
  const [tiposExpedientes, setTiposExpedientes] = React.useState<any[]>([]);

  // Data fetching state
  const [data, setData] = React.useState<ExpedientesApiResponse | undefined>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load auxiliary data
  React.useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [usersRes, tiposRes] = await Promise.all([
          fetch('/api/usuarios?ativo=true&limite=100').then(r => r.json()),
          fetch('/api/tipos-expedientes?limite=100').then(r => r.json())
        ]);
        if (usersRes.success) setUsuarios(usersRes.data.usuarios);
        if (tiposRes.success) setTiposExpedientes(tiposRes.data.data);
      } catch (err) {
        console.error('Erro ao carregar dados auxiliares:', err);
      }
    };
    fetchAuxData();
  }, []);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: ListarExpedientesParams = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: globalFilter || undefined,
      };

      const filters: ExpedientesFilters = {};
      if (statusFilter === 'pendentes') filters.pendentes = true;
      if (statusFilter === 'baixados') filters.baixados = true;

      // Note: Prazo filtering logic would be added here

      if (dateRange?.from) filters.dataInicio = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange?.to) filters.dataFim = format(dateRange.to, 'yyyy-MM-dd');

      const result = await actionListarExpedientes(params, filters);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao listar expedientes');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, globalFilter, statusFilter, prazoFilter, dateRange]);

  // Trigger fetch on dependencies change
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const defaultData = React.useMemo(() => ({ expedientes: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }), []);
  const tableData = data || defaultData;

  const handleRefresh = () => {
    fetchData();
  };

  const handleSucessoOperacao = () => {
    fetchData();
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <DataSurface
        header={
          <TableToolbar
            variant="integrated"
            searchValue={globalFilter}
            onSearchChange={setGlobalFilter}
            onNewClick={() => setIsNovoDialogOpen(true)}
            newButtonTooltip="Novo Expediente"
            extraButtons={
              <div className="flex items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(v: 'todos' | 'pendentes' | 'baixados') => setStatusFilter(v)}
                >
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendentes">Pendentes</SelectItem>
                    <SelectItem value="baixados">Baixados</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={prazoFilter} onValueChange={(v: any) => setPrazoFilter(v)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Prazo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Prazos</SelectItem>
                    <SelectItem value="vencidos">Vencidos</SelectItem>
                    <SelectItem value="hoje">Vence Hoje</SelectItem>
                    <SelectItem value="amanha">Vence Amanhã</SelectItem>
                    <SelectItem value="semana">Esta Semana</SelectItem>
                  </SelectContent>
                </Select>

                <div className="h-9 w-px bg-border mx-1" />

                <DateRangePicker
                  value={dateRange}
                  onValueChange={setDateRange}
                  placeholder="Período"
                  className="w-[240px] h-9"
                />

                <Separator orientation="vertical" className="h-6 mx-1" />

                <Button variant="ghost" size="icon" onClick={handleRefresh} title="Atualizar">
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            }
          />
        }
        footer={
          <TablePagination
            variant="integrated"
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            total={tableData.meta.total}
            totalPages={tableData.meta.totalPages || Math.ceil(tableData.meta.total / pagination.pageSize)}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
            onPageSizeChange={(size) => setPagination((prev) => ({ ...prev, pageSize: size, pageIndex: 0 }))}
            isLoading={isLoading}
          />
        }
      >
        <DataTable
          data={tableData.expedientes}
          columns={columns}
          isLoading={isLoading}
          error={error}
          pagination={undefined}
          sorting={{
            columnId: sorting[0]?.id || null,
            direction: sorting[0]?.desc ? 'desc' : 'asc',
            onSortingChange: (id, dir) => {
              if (!id) setSorting([]);
              else setSorting([{ id, desc: dir === 'desc' }]);
            }
          }}
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange: setRowSelection
          }}
          hidePagination={true}
          hideTableBorder={true}
          className="border-none"
          // @ts-expect-error - TanStack Table options type mismatch
          options={{
            meta: {
              usuarios,
              tiposExpedientes,
              onSuccess: handleSucessoOperacao
            }
          }}
        />
      </DataSurface>

      <ExpedienteDialog
        open={isNovoDialogOpen}
        onOpenChange={setIsNovoDialogOpen}
        onSuccess={handleSucessoOperacao}
      />
    </div>
  );
}
