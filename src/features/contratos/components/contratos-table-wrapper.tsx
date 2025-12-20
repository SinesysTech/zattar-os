'use client';

/**
 * CONTRATOS FEATURE - ContratosTableWrapper
 *
 * Componente Client que encapsula a tabela de contratos.
 * Recebe dados iniciais do Server Component e gerencia:
 * - Estado de busca e filtros
 * - Paginação client-side com refresh via Server Actions
 * - Sheets de criação, edição e visualização
 *
 * Implementação seguindo o padrão DataShell.
 * Referência: src/features/partes/components/clientes/clientes-table-wrapper.tsx
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Table as TanstackTable } from '@tanstack/react-table';

import { getContratosColumns } from './columns';
import { ContratoForm } from './contrato-form';
import { ContratoViewSheet } from './contrato-view-sheet';
import type { Contrato, ListarContratosParams } from '../domain';
import type { PaginationInfo, ClienteInfo } from '../types';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
} from '../domain';
import { actionListarContratos } from '../actions';

// =============================================================================
// TIPOS
// =============================================================================

interface ContratosTableWrapperProps {
  initialData: Contrato[];
  initialPagination: PaginationInfo | null;
  clientesOptions: ClienteInfo[];
  partesContrariasOptions: ClienteInfo[];
  usuariosOptions?: ClienteInfo[];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ContratosTableWrapper({
  initialData,
  initialPagination,
  clientesOptions,
  partesContrariasOptions,
  usuariosOptions = [],
}: ContratosTableWrapperProps) {
  const router = useRouter();

  // ---------- Estado dos Dados ----------
  const [contratos, setContratos] = React.useState<Contrato[]>(initialData);
  const [table, setTable] = React.useState<TanstackTable<Contrato> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // ---------- Estado de Paginação ----------
  const [pageIndex, setPageIndex] = React.useState(
    initialPagination ? initialPagination.page - 1 : 0
  );
  const [pageSize, setPageSize] = React.useState(
    initialPagination ? initialPagination.limit : 50
  );
  const [total, setTotal] = React.useState(
    initialPagination ? initialPagination.total : 0
  );
  const [totalPages, setTotalPages] = React.useState(
    initialPagination ? initialPagination.totalPages : 0
  );

  // ---------- Estado de Loading/Error ----------
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ---------- Estado de Filtros ----------
  const [busca, setBusca] = React.useState('');
  const [tipoContrato, setTipoContrato] = React.useState<string>('');
  const [tipoCobranca, setTipoCobranca] = React.useState<string>('');
  const [status, setStatus] = React.useState<string>('');

  // ---------- Estado de Dialogs/Sheets ----------
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [contratoSelecionado, setContratoSelecionado] = React.useState<Contrato | null>(null);

  // Debounce da busca (500ms)
  const buscaDebounced = useDebounce(busca, 500);

  // ---------- Maps para lookup O(1) ----------
  const clientesMap = React.useMemo(() => {
    return new Map(clientesOptions.map(c => [c.id, c]));
  }, [clientesOptions]);

  const partesContrariasMap = React.useMemo(() => {
    return new Map(partesContrariasOptions.map(p => [p.id, p]));
  }, [partesContrariasOptions]);

  // ---------- Refetch Function ----------
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ListarContratosParams = {
        pagina: pageIndex + 1,  // API usa 1-based
        limite: pageSize,
        busca: buscaDebounced || undefined,
        tipoContrato: tipoContrato || undefined,
        tipoCobranca: tipoCobranca || undefined,
        status: status || undefined,
      };

      const result = await actionListarContratos(params);

      if (result.success) {
        const data = result.data as { data: Contrato[]; pagination: PaginationInfo };
        setContratos(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contratos');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, buscaDebounced, tipoContrato, tipoCobranca, status]);

  // ---------- Skip First Render ----------
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refetch();
  }, [pageIndex, pageSize, buscaDebounced, tipoContrato, tipoCobranca, status, refetch]);

  // ---------- Handlers ----------
  const handleEdit = React.useCallback((contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setEditOpen(true);
  }, []);

  const handleView = React.useCallback((contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setViewOpen(true);
  }, []);

  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
    setContratoSelecionado(null);
    router.refresh();
  }, [refetch, router]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
    router.refresh();
  }, [refetch, router]);

  // Obter nomes para o sheet de visualização
  const getClienteNome = React.useCallback((clienteId: number) => {
    return clientesMap.get(clienteId)?.nome || `Cliente #${clienteId}`;
  }, [clientesMap]);

  const getParteContrariaNome = React.useCallback((parteContrariaId: number | null) => {
    if (!parteContrariaId) return undefined;
    return partesContrariasMap.get(parteContrariaId)?.nome;
  }, [partesContrariasMap]);

  // ---------- Columns (Memoized) ----------
  const columns = React.useMemo(
    () => getContratosColumns(clientesMap, handleEdit, handleView),
    [clientesMap, handleEdit, handleView]
  );

  // ---------- Render ----------
  return (
    <>
      <DataShell
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
              searchPlaceholder="Buscar nas observações..."
              actionButton={{
                label: 'Novo Contrato',
                onClick: () => setCreateOpen(true),
              }}
              filtersSlot={
                <>
                  <Select
                    value={tipoContrato}
                    onValueChange={(val) => {
                      setTipoContrato(val === 'all' ? '' : val);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-10 w-[180px]">
                      <SelectValue placeholder="Tipo de Contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {Object.entries(TIPO_CONTRATO_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={tipoCobranca}
                    onValueChange={(val) => {
                      setTipoCobranca(val === 'all' ? '' : val);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-10 w-[150px]">
                      <SelectValue placeholder="Cobrança" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {Object.entries(TIPO_COBRANCA_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={status}
                    onValueChange={(val) => {
                      setStatus(val === 'all' ? '' : val);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-10 w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(STATUS_CONTRATO_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
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
            data={contratos}
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
            onTableReady={(t) => setTable(t as TanstackTable<Contrato>)}
            hideTableBorder={true}
            emptyMessage="Nenhum contrato encontrado."
          />
        </div>
      </DataShell>

      {/* Sheet de criação */}
      <ContratoForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        clientesOptions={clientesOptions}
        partesContrariasOptions={partesContrariasOptions}
        usuariosOptions={usuariosOptions}
        onSuccess={handleCreateSuccess}
      />

      {/* Sheet de edição */}
      {contratoSelecionado && (
        <ContratoForm
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setContratoSelecionado(null);
          }}
          mode="edit"
          contrato={contratoSelecionado}
          clientesOptions={clientesOptions}
          partesContrariasOptions={partesContrariasOptions}
          usuariosOptions={usuariosOptions}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Sheet de visualização */}
      {contratoSelecionado && viewOpen && (
        <ContratoViewSheet
          open={viewOpen}
          onOpenChange={(open) => {
            setViewOpen(open);
            if (!open) setContratoSelecionado(null);
          }}
          contrato={contratoSelecionado}
          clienteNome={getClienteNome(contratoSelecionado.clienteId)}
          parteContrariaNome={getParteContrariaNome(contratoSelecionado.parteContrariaId)}
        />
      )}
    </>
  );
}
