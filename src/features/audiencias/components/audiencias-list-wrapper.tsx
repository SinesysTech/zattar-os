'use client';

/**
 * AudienciasListWrapper - Componente Client que encapsula a tabela de audiências
 *
 * Recebe dados iniciais do Server Component e gerencia:
 * - Estado de busca e filtros
 * - Paginação server-side com refresh via Server Actions
 * - Dialogs de criação e visualização
 */

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  DataShell,
  DataPagination,
  DataTable,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import type { Table as TanstackTable } from '@tanstack/react-table';

import { actionListarAudiencias } from '../actions';
import {
  type Audiencia,
  type CodigoTribunal,
  type TipoAudiencia,
  StatusAudiencia,
  ModalidadeAudiencia,
  GrauTribunal,
} from '../domain';
import { useTiposAudiencias } from '../hooks/use-tipos-audiencias';
import { useUsuarios } from '@/features/usuarios';

import { getAudienciasColumns, type AudienciaComResponsavel } from './audiencias-list-columns';
import { AudienciasListFilters } from './audiencias-list-filters';
import { NovaAudienciaDialog } from './nova-audiencia-dialog';
import { AudienciaDetailSheet } from './audiencia-detail-sheet';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { AudienciaForm } from './audiencia-form';

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

interface AudienciasListWrapperProps {
  initialData?: Audiencia[];
  initialPagination?: PaginationInfo | null;
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
  /** Dados de usuários pré-carregados (evita fetch duplicado) */
  usuariosData?: { id: number; nomeExibicao?: string; nomeCompleto?: string }[];
  /** Dados de tipos de audiência pré-carregados (evita fetch duplicado) */
  tiposAudienciaData?: TipoAudiencia[];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasListWrapper({
  initialData = [],
  initialPagination = null,
  viewModeSlot,
  usuariosData,
  tiposAudienciaData,
}: AudienciasListWrapperProps) {
  // Data state
  const [audiencias, setAudiencias] = React.useState<AudienciaComResponsavel[]>(
    initialData as AudienciaComResponsavel[]
  );
  const [table, setTable] = React.useState<TanstackTable<AudienciaComResponsavel> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Pagination State
  const [pageIndex, setPageIndex] = React.useState(
    initialPagination ? initialPagination.page - 1 : 0
  );
  const [pageSize, setPageSize] = React.useState(
    initialPagination ? initialPagination.limit : 50
  );
  const [total, setTotal] = React.useState(initialPagination ? initialPagination.total : 0);
  const [totalPages, setTotalPages] = React.useState(
    initialPagination ? initialPagination.totalPages : 0
  );

  // Loading/Error state
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Search/Filters State
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [statusFiltro, setStatusFiltro] = React.useState<StatusAudiencia | 'todas'>('todas');
  const [modalidadeFiltro, setModalidadeFiltro] = React.useState<ModalidadeAudiencia | 'todas'>('todas');
  const [trtFiltro, setTrtFiltro] = React.useState<CodigoTribunal | 'todas'>('todas');
  const [grauFiltro, setGrauFiltro] = React.useState<GrauTribunal | 'todas'>('todas');
  const [responsavelFiltro, setResponsavelFiltro] = React.useState<number | 'null' | 'todos'>('todos');
  const [tipoAudienciaFiltro, setTipoAudienciaFiltro] = React.useState<number | 'todos'>('todos');

  // Dialogs state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedAudiencia, setSelectedAudiencia] = React.useState<AudienciaComResponsavel | null>(null);

  // Debounce search (500ms)
  const buscaDebounced = useDebounce(globalFilter, 500);

  // Auxiliary data (usar props se disponíveis, senão buscar)
  const { tiposAudiencia: tiposFetched } = useTiposAudiencias({ enabled: !tiposAudienciaData });
  const { usuarios: usuariosFetched } = useUsuarios({ enabled: !usuariosData });

  // Usar dados das props se disponíveis, senão usar dados buscados
  const tiposAudiencia = tiposAudienciaData ?? tiposFetched;
  const usuarios = usuariosData ?? usuariosFetched;

  // Map usuarios to audiencias for responsavel name
  const usuariosMap = React.useMemo(() => {
    const map = new Map<number, { nome: string }>();
    usuarios.forEach((u) => {
      map.set(u.id, { nome: u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}` });
    });
    return map;
  }, [usuarios]);

  // Enrich audiencias with responsavel name
  const audienciasEnriquecidas = React.useMemo(() => {
    return audiencias.map((a) => ({
      ...a,
      responsavelNome: a.responsavelId ? usuariosMap.get(a.responsavelId)?.nome : null,
    }));
  }, [audiencias, usuariosMap]);

  // Refetch function
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarAudiencias({
        pagina: pageIndex + 1,
        limite: pageSize,
        busca: buscaDebounced || undefined,
        status: statusFiltro === 'todas' ? undefined : statusFiltro,
        modalidade: modalidadeFiltro === 'todas' ? undefined : modalidadeFiltro,
        trt: trtFiltro === 'todas' ? undefined : trtFiltro,
        grau: grauFiltro === 'todas' ? undefined : grauFiltro,
        responsavelId: responsavelFiltro === 'todos' ? undefined : responsavelFiltro,
        tipoAudienciaId: tipoAudienciaFiltro === 'todos' ? undefined : tipoAudienciaFiltro,
      });

      if (result.success) {
        setAudiencias(result.data.data as AudienciaComResponsavel[]);
        setTotal(result.data.pagination.total);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar audiências');
    } finally {
      setIsLoading(false);
    }
  }, [
    pageIndex,
    pageSize,
    buscaDebounced,
    statusFiltro,
    modalidadeFiltro,
    trtFiltro,
    grauFiltro,
    responsavelFiltro,
    tipoAudienciaFiltro,
  ]);

  // Ref to control first render
  const isFirstRender = React.useRef(true);
  const hasInitialData = initialPagination !== null || initialData.length > 0;

  // Refetch when params change (NÃO incluir refetch como dependência para evitar loop)
  React.useEffect(() => {
    // Skip first render se tem dados iniciais
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Se não tem dados iniciais, buscar imediatamente
      if (!hasInitialData) {
        refetch();
      }
      return;
    }

    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pageIndex,
    pageSize,
    buscaDebounced,
    statusFiltro,
    modalidadeFiltro,
    trtFiltro,
    grauFiltro,
    responsavelFiltro,
    tipoAudienciaFiltro,
  ]);

  // Handlers
  const handleView = React.useCallback((audiencia: AudienciaComResponsavel) => {
    setSelectedAudiencia(audiencia);
    setDetailOpen(true);
  }, []);

  const handleEdit = React.useCallback((audiencia: AudienciaComResponsavel) => {
    setSelectedAudiencia(audiencia);
    setEditOpen(true);
  }, []);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
  }, [refetch]);

  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
  }, [refetch]);

  // Columns (memoized)
  const columns = React.useMemo(
    () => getAudienciasColumns(handleView, handleEdit),
    [handleView, handleEdit]
  );

  return (
    <>
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              title="Audiências"
              density={density}
              onDensityChange={setDensity}
              searchValue={globalFilter}
              onSearchValueChange={(value) => {
                setGlobalFilter(value);
                setPageIndex(0); // Reset page on search
              }}
              searchPlaceholder="Buscar audiências..."
              actionButton={{
                label: 'Nova Audiência',
                onClick: () => setCreateOpen(true),
              }}
              viewModeSlot={viewModeSlot}
              filtersSlot={
                <AudienciasListFilters
                  statusFiltro={statusFiltro}
                  onStatusChange={(v) => {
                    setStatusFiltro(v);
                    setPageIndex(0);
                  }}
                  modalidadeFiltro={modalidadeFiltro}
                  onModalidadeChange={(v) => {
                    setModalidadeFiltro(v);
                    setPageIndex(0);
                  }}
                  trtFiltro={trtFiltro}
                  onTrtChange={(v) => {
                    setTrtFiltro(v);
                    setPageIndex(0);
                  }}
                  grauFiltro={grauFiltro}
                  onGrauChange={(v) => {
                    setGrauFiltro(v);
                    setPageIndex(0);
                  }}
                  responsavelFiltro={responsavelFiltro}
                  onResponsavelChange={(v) => {
                    setResponsavelFiltro(v);
                    setPageIndex(0);
                  }}
                  tipoAudienciaFiltro={tipoAudienciaFiltro}
                  onTipoAudienciaChange={(v) => {
                    setTipoAudienciaFiltro(v);
                    setPageIndex(0);
                  }}
                  usuarios={usuarios}
                  tiposAudiencia={tiposAudiencia}
                />
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
        <DataTable
          data={audienciasEnriquecidas}
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
          onTableReady={(t) => setTable(t as TanstackTable<AudienciaComResponsavel>)}
          emptyMessage="Nenhuma audiência encontrada."
        />
      </DataShell>

      <NovaAudienciaDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedAudiencia && (
        <>
          <AudienciaDetailSheet
            open={detailOpen}
            onOpenChange={setDetailOpen}
            audiencia={selectedAudiencia}
          />

          <DialogFormShell
            open={editOpen}
            onOpenChange={setEditOpen}
            title="Editar Audiência"
            maxWidth="2xl"
            hideFooter
          >
            <AudienciaForm
              initialData={selectedAudiencia}
              onSuccess={handleEditSuccess}
              onClose={() => setEditOpen(false)}
            />
          </DialogFormShell>
        </>
      )}


    </>
  );
}
