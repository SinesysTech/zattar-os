'use client';

/**
 * EXPEDIENTES FEATURE - ExpedientesTableWrapper
 *
 * Componente Client que encapsula a tabela de expedientes.
 * Implementação seguindo o padrão DataShell.
 * Referência: src/features/partes/components/clientes/clientes-table-wrapper.tsx
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { format } from 'date-fns';

import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import { useDebounce } from '@/hooks/use-debounce';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { PaginatedResponse } from '@/lib/types';
import type { Expediente, ListarExpedientesParams, ExpedientesFilters } from '../domain';
import { actionListarExpedientes } from '../actions';
import { columns } from './columns';
import { ExpedienteDialog } from './expediente-dialog';

// =============================================================================
// TIPOS
// =============================================================================

interface ExpedientesTableWrapperProps {
  initialData?: PaginatedResponse<Expediente>;
}

type UsuarioOption = {
  id: number;
  nomeExibicao: string;
};

type TipoExpedienteOption = {
  id: number;
  tipoExpediente: string;
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedientesTableWrapper({ initialData }: ExpedientesTableWrapperProps) {
  const router = useRouter();

  // ---------- Estado da Tabela (DataShell pattern) ----------
  const [table, setTable] = React.useState<TanstackTable<Expediente> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // ---------- Estado de Paginação ----------
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(initialData?.pagination.limit || 10);
  const [total, setTotal] = React.useState(initialData?.pagination.total || 0);
  const [totalPages, setTotalPages] = React.useState(initialData?.pagination.totalPages || 0);

  // ---------- Estado de Loading/Error ----------
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ---------- Estado dos Dados ----------
  const [expedientes, setExpedientes] = React.useState<Expediente[]>(initialData?.data || []);

  // ---------- Estado de Filtros ----------
  const [busca, setBusca] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'todos' | 'pendentes' | 'baixados'>('pendentes');
  const [prazoFilter, setPrazoFilter] = React.useState<'todos' | 'vencidos' | 'hoje' | 'amanha' | 'semana'>('todos');
  const [dateRange, setDateRange] = React.useState<{ from?: Date; to?: Date } | undefined>(undefined);

  // ---------- Estado de Dialogs ----------
  const [isNovoDialogOpen, setIsNovoDialogOpen] = React.useState(false);

  // ---------- Dados Auxiliares ----------
  const [usuarios, setUsuarios] = React.useState<UsuarioOption[]>([]);
  const [tiposExpedientes, setTiposExpedientes] = React.useState<TipoExpedienteOption[]>([]);

  // Debounce da busca (500ms)
  const buscaDebounced = useDebounce(busca, 500);

  // ---------- Carregar dados auxiliares ----------
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

  // ---------- Refetch Function ----------
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ListarExpedientesParams = {
        pagina: pageIndex + 1, // API usa 1-based
        limite: pageSize,
        busca: buscaDebounced || undefined,
      };

      const filters: ExpedientesFilters = {};
      if (statusFilter === 'pendentes') filters.baixado = false;
      if (statusFilter === 'baixados') filters.baixado = true;

      // Prazo filter logic (se implementado na API)
      // if (prazoFilter === 'vencidos') filters.prazoVencido = true;
      // etc.

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

      const responseData = result.data as PaginatedResponse<Expediente>;
      setExpedientes(responseData.data);
      setTotal(responseData.pagination.total);
      setTotalPages(responseData.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, buscaDebounced, statusFilter, prazoFilter, dateRange]);

  // ---------- Skip First Render ----------
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refetch();
  }, [pageIndex, pageSize, buscaDebounced, statusFilter, prazoFilter, dateRange, refetch]);

  // ---------- Handlers ----------
  const handleSucessoOperacao = React.useCallback(() => {
    refetch();
    router.refresh();
  }, [refetch, router]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setIsNovoDialogOpen(false);
    router.refresh();
  }, [refetch, router]);

  // ---------- Render ----------
  return (
    <>
      <DataShell
        actionButton={{
          label: 'Novo Expediente',
          onClick: () => setIsNovoDialogOpen(true),
        }}
        header={
          table ? (
            <DataTableToolbar
              table={table}
              density={density}
              onDensityChange={setDensity}
              searchValue={busca}
              onSearchValueChange={(value) => {
                setBusca(value);
                setPageIndex(0);
              }}
              searchPlaceholder="Buscar expedientes..."
              filtersSlot={
                <>
                  <Select
                    value={statusFilter}
                    onValueChange={(v: 'todos' | 'pendentes' | 'baixados') => {
                      setStatusFilter(v);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-10 w-[130px]">
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
                    onValueChange={(v: 'todos' | 'vencidos' | 'hoje' | 'amanha' | 'semana') => {
                      setPrazoFilter(v);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-10 w-[150px]">
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

                  <DateRangePicker
                    value={dateRange}
                    onChange={(range) => {
                      setDateRange(range);
                      setPageIndex(0);
                    }}
                    placeholder="Período"
                    className="h-10 w-[240px]"
                  />
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
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPageIndex(0);
              }}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <div className="relative border-t">
          <DataTable
            data={expedientes}
            columns={columns}
            isLoading={isLoading}
            error={error}
            density={density}
            onTableReady={(t) => setTable(t as TanstackTable<Expediente>)}
            hideTableBorder={true}
            emptyMessage="Nenhum expediente encontrado."
            options={{
              meta: {
                usuarios,
                tiposExpedientes,
                onSuccess: handleSucessoOperacao,
              },
            }}
          />
        </div>
      </DataShell>

      <ExpedienteDialog
        open={isNovoDialogOpen}
        onOpenChange={setIsNovoDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}

