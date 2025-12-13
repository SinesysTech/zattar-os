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

import { DataShell } from '@/components/shared/data-shell';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { DataTable } from '@/components/shared/data-shell';
import { TablePagination } from '@/components/shared/table-pagination';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { PaginatedResponse } from '@/lib/types';
import type { Expediente, ListarExpedientesParams, ExpedientesFilters } from '../domain';
import { actionListarExpedientes } from '../actions';
import { columns } from './columns';
import { ExpedienteDialog } from './expediente-dialog';

interface ExpedientesListProps {
  initialData?: PaginatedResponse<Expediente>; // Optional initial data from server
}

type UsuarioOption = {
  id: number;
  nomeExibicao: string;
};

type TipoExpedienteOption = {
  id: number;
  tipoExpediente: string;
};

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
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date } | undefined>(undefined);

  // Aux Data State
  const [usuarios, setUsuarios] = React.useState<UsuarioOption[]>([]);
  const [tiposExpedientes, setTiposExpedientes] = React.useState<TipoExpedienteOption[]>([]);

  // Data fetching state
  const [data, setData] = React.useState<PaginatedResponse<Expediente> | undefined>(initialData);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load auxiliary data
  React.useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [usersRes, tiposRes]: [unknown, unknown] = await Promise.all([
          fetch('/api/usuarios?ativo=true&limite=100').then((r) => r.json()),
          fetch('/api/tipos-expedientes?limite=100').then((r) => r.json()),
        ]);

        const usersPayload = usersRes as { success?: boolean; data?: { usuarios?: UsuarioOption[] } };
        const tiposPayload = tiposRes as { success?: boolean; data?: { data?: TipoExpedienteOption[] } };

        const usuariosArr = usersPayload.data?.usuarios;
        if (usersPayload.success && Array.isArray(usuariosArr)) {
          setUsuarios(usuariosArr);
        }

        const tiposArr = tiposPayload.data?.data;
        if (tiposPayload.success && Array.isArray(tiposArr)) {
          setTiposExpedientes(tiposArr);
        }
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
        pagina: pagination.pageIndex + 1,
        limite: pagination.pageSize,
        busca: globalFilter || undefined,
      };

      const filters: ExpedientesFilters = {};
      if (statusFilter === 'pendentes') filters.baixado = false;
      if (statusFilter === 'baixados') filters.baixado = true;

      // Note: Prazo filtering logic would be added here

      if (dateRange?.from) filters.dataPrazoLegalInicio = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange?.to) filters.dataPrazoLegalFim = format(dateRange.to, 'yyyy-MM-dd');

      const mergedParams: ListarExpedientesParams = {
        ...params,
        ...filters,
      };

      const result = await actionListarExpedientes(mergedParams);

      if (!result.success) {
        throw new Error(result.message || 'Erro ao listar expedientes');
      }

      setData(result.data as PaginatedResponse<Expediente>);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, globalFilter, statusFilter, dateRange]);

  // Trigger fetch on dependencies change
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const defaultData = React.useMemo<PaginatedResponse<Expediente>>(
    () => ({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasMore: false },
    }),
    []
  );
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
      <DataShell
        header={
          <TableToolbar
            variant="integrated"
            searchValue={globalFilter}
            onSearchChange={setGlobalFilter}
            selectedFilters={[]}
            onFiltersChange={() => {}}
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

                <Select
                  value={prazoFilter}
                  onValueChange={(v: 'todos' | 'vencidos' | 'hoje' | 'amanha' | 'semana') => setPrazoFilter(v)}
                >
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
                  onChange={setDateRange}
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
            total={tableData.pagination.total}
            totalPages={tableData.pagination.totalPages}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, pageIndex: page }))}
            onPageSizeChange={(size) => setPagination((prev) => ({ ...prev, pageSize: size, pageIndex: 0 }))}
            isLoading={isLoading}
          />
        }
      >
        <div className="relative border-t">
          <DataTable
            data={tableData.data}
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
            options={{
              meta: {
                usuarios,
                tiposExpedientes,
                onSuccess: handleSucessoOperacao
              }
            }}
          />
        </div>
      </DataShell>

      <ExpedienteDialog
        open={isNovoDialogOpen}
        onOpenChange={setIsNovoDialogOpen}
        onSuccess={handleSucessoOperacao}
      />
    </div>
  );
}
