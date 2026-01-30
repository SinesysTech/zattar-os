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
import type { Table as TanstackTable, SortingState } from '@tanstack/react-table';

import { getContratosColumns } from './columns';
import { ContratoForm } from './contrato-form';
import { SegmentosFilter } from './segmentos-filter';
import { ContratoDeleteDialog } from './contrato-delete-dialog';
import { GerarPecaDialog } from '@/features/pecas-juridicas';
import type {
  Contrato,
  ListarContratosParams,
  TipoContrato,
  TipoCobranca,
  StatusContrato,
  ContratoSortBy,
  Ordem,
} from '../domain';
import type { PaginationInfo, ClienteInfo } from '../types';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
} from '../domain';
import {
  actionListarContratos,
  actionListarSegmentos,
  actionResolverNomesEntidadesContrato,
  type Segmento,
} from '../actions';

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
  // ---------- Estado dos Dados ----------
  const [contratos, setContratos] = React.useState<Contrato[]>(initialData);
  const [table, setTable] = React.useState<TanstackTable<Contrato> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Opções dinâmicas (para evitar fallback "Cliente #ID" quando mudar de página/refetch)
  const [clientesOptionsState, setClientesOptionsState] = React.useState<ClienteInfo[]>(clientesOptions);
  const [partesContrariasOptionsState, setPartesContrariasOptionsState] =
    React.useState<ClienteInfo[]>(partesContrariasOptions);
  const [usuariosOptionsState, setUsuariosOptionsState] = React.useState<ClienteInfo[]>(usuariosOptions);

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
  const [segmentoId, setSegmentoId] = React.useState<string>('');
  const [tipoContrato, setTipoContrato] = React.useState<string>('');
  const [tipoCobranca, setTipoCobranca] = React.useState<string>('');
  const [status, setStatus] = React.useState<string>('');
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const [segmentos, setSegmentos] = React.useState<Segmento[]>([]);

  // ---------- Estado de Dialogs/Sheets ----------
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [gerarPecaOpen, setGerarPecaOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [contratoSelecionado, setContratoSelecionado] = React.useState<Contrato | null>(null);

  // Debounce da busca (500ms)
  const buscaDebounced = useDebounce(busca, 500);

  // ---------- Maps para lookup O(1) ----------
  const clientesMap = React.useMemo(() => {
    return new Map(clientesOptionsState.map((c) => [c.id, c]));
  }, [clientesOptionsState]);

  const partesContrariasMap = React.useMemo(() => {
    return new Map(partesContrariasOptionsState.map((p) => [p.id, p]));
  }, [partesContrariasOptionsState]);

  const usuariosMap = React.useMemo(() => {
    return new Map(usuariosOptionsState.map((u) => [u.id, u]));
  }, [usuariosOptionsState]);

  const segmentosMap = React.useMemo(() => {
    return new Map(segmentos.map((s) => [s.id, { nome: s.nome }]));
  }, [segmentos]);

  React.useEffect(() => {
    async function fetchSegmentos() {
      try {
        const result = await actionListarSegmentos();
        if (result.success) {
          setSegmentos((result.data || []).filter((s) => s.ativo));
        }
      } catch {
        // noop
      }
    }

    fetchSegmentos();
  }, []);

  // Completar nomes faltantes conforme contratos mudam (paginação/refetch)
  React.useEffect(() => {
    const run = async () => {
      const currentClientes = new Set(clientesOptionsState.map((c) => c.id));
      const currentPartes = new Set(partesContrariasOptionsState.map((p) => p.id));
      const currentUsuarios = new Set(usuariosOptionsState.map((u) => u.id));

      const missingClienteIds = Array.from(
        new Set(contratos.map((c) => c.clienteId).filter((id) => !currentClientes.has(id)))
      );

      const missingParteContrariaIds = Array.from(
        new Set(
          contratos
            .flatMap((c) => c.partes ?? [])
            .filter((p) => p.tipoEntidade === 'parte_contraria')
            .map((p) => p.entidadeId)
            .filter((id) => !currentPartes.has(id))
        )
      );

      const missingUsuarioIds = Array.from(
        new Set(
          contratos
            .map((c) => c.responsavelId)
            .filter((id): id is number => typeof id === 'number' && id > 0)
            .filter((id) => !currentUsuarios.has(id))
        )
      );

      if (!missingClienteIds.length && !missingParteContrariaIds.length && !missingUsuarioIds.length) return;

      const result = await actionResolverNomesEntidadesContrato({
        clienteIds: missingClienteIds,
        partesContrariasIds: missingParteContrariaIds,
        usuariosIds: missingUsuarioIds,
      });

      if (!result.success) return;

      const appendUnique = (prev: ClienteInfo[], incoming: ClienteInfo[]) => {
        const map = new Map(prev.map((x) => [x.id, x]));
        for (const item of incoming) map.set(item.id, item);
        return Array.from(map.values());
      };

      if (result.data.clientes?.length) {
        setClientesOptionsState((prev) => appendUnique(prev, result.data.clientes));
      }
      if (result.data.partesContrarias?.length) {
        setPartesContrariasOptionsState((prev) => appendUnique(prev, result.data.partesContrarias));
      }
      if (result.data.usuarios?.length) {
        setUsuariosOptionsState((prev) => appendUnique(prev, result.data.usuarios));
      }
    };

    // best-effort, sem travar render
    void run();
  }, [contratos, clientesOptionsState, partesContrariasOptionsState, usuariosOptionsState]);

  // ---------- Helpers ----------
  const getSortParams = React.useCallback((sortingState: SortingState): { ordenarPor?: ContratoSortBy; ordem?: Ordem } => {
    if (sortingState.length === 0) return {};

    const { id, desc } = sortingState[0];
    const ordem = desc ? 'desc' : 'asc';

    switch (id) {
      case 'cadastradoEm':
        return { ordenarPor: 'cadastrado_em', ordem };
      case 'createdAt':
        return { ordenarPor: 'created_at', ordem };
      case 'updatedAt':
        return { ordenarPor: 'updated_at', ordem };
      case 'id':
        return { ordenarPor: 'id', ordem };
      default:
        return {};
    }
  }, []);

  // ---------- Refetch Function ----------
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ListarContratosParams = {
        pagina: pageIndex + 1,  // API usa 1-based
        limite: pageSize,
        busca: buscaDebounced || undefined,
        segmentoId: segmentoId ? Number(segmentoId) : undefined,
        tipoContrato: (tipoContrato || undefined) as TipoContrato | undefined,
        tipoCobranca: (tipoCobranca || undefined) as TipoCobranca | undefined,
        status: (status || undefined) as StatusContrato | undefined,
        ...getSortParams(sorting),
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
  }, [pageIndex, pageSize, buscaDebounced, segmentoId, tipoContrato, tipoCobranca, status, sorting, getSortParams]);

  // ---------- Skip First Render ----------
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refetch();
  }, [pageIndex, pageSize, buscaDebounced, segmentoId, tipoContrato, tipoCobranca, status, sorting, refetch]);

  // ---------- Handlers ----------
  const handleEdit = React.useCallback((contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setEditOpen(true);
  }, []);

  const handleGerarPeca = React.useCallback((contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setGerarPecaOpen(true);
  }, []);

  const handleDelete = React.useCallback((contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setDeleteOpen(true);
  }, []);

  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
    setContratoSelecionado(null);
  }, [refetch]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
  }, [refetch]);

  // ---------- Columns (Memoized) ----------
  const columns = React.useMemo(
    () => getContratosColumns(clientesMap, partesContrariasMap, usuariosMap, segmentosMap, handleEdit, handleGerarPeca, handleDelete),
    [clientesMap, partesContrariasMap, usuariosMap, segmentosMap, handleEdit, handleGerarPeca, handleDelete]
  );

  // ---------- Ocultar coluna ID por padrão ----------
  React.useEffect(() => {
    if (table) {
      table.setColumnVisibility((prev) => ({
        ...prev,
        id: false,
        createdAt: false,
        updatedAt: false,
        observacoes: false,
      }));
    }
  }, [table]);

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
                  <SegmentosFilter
                    value={segmentoId}
                    onValueChange={(val) => {
                      setSegmentoId(val);
                      setPageIndex(0);
                    }}
                  />

                  <Select
                    value={tipoContrato}
                    onValueChange={(val) => {
                      setTipoContrato(val === 'all' ? '' : val);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="w-45">
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
                    <SelectTrigger className="w-37.5">
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
                    <SelectTrigger className="w-40">
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
            sorting={sorting}
            onSortingChange={(next) => {
              setSorting(next);
              // Ao mudar ordenação, voltar para a primeira página (server-side sorting)
              setPageIndex(0);
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

      {/* Dialog de geração de peça */}
      {contratoSelecionado && gerarPecaOpen && (
        <GerarPecaDialog
          contratoId={contratoSelecionado.id}
          open={gerarPecaOpen}
          onOpenChange={(open) => {
            setGerarPecaOpen(open);
            if (!open) setContratoSelecionado(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Dialog de exclusão */}
      {contratoSelecionado && deleteOpen && (
        <ContratoDeleteDialog
          contratoId={contratoSelecionado.id}
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) setContratoSelecionado(null);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </>
  );
}
