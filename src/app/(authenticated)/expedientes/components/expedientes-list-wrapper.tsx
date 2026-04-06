'use client';

/**
 * ExpedientesListWrapper — DataShell + DataTable para a view de lista
 *
 * Segue o padrão de audiencias-list-wrapper.tsx:
 * - Fetch próprio via useExpedientes (server-side pagination)
 * - DataTableToolbar com search, filtros, density, column visibility, export
 * - ViewModePopover recebido como slot do parent
 * - Colunas do columns.tsx com inline editing, popovers, badges semânticos
 */

import * as React from 'react';
import type { Table as TanstackTable } from '@tanstack/react-table';
import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import { columns, type ExpedientesTableMeta } from './columns';
import { useExpedientes } from '../hooks/use-expedientes';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';
import {
  ExpedientesListFilters,
  type StatusFiltro,
} from './expedientes-list-filters';
import type {
  Expediente,
  CodigoTribunal,
  GrauTribunal,
  OrigemExpediente,
} from '../domain';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ExpedientesListWrapperProps {
  /** ViewModePopover vindo do parent — renderizado dentro do DataTableToolbar */
  viewModeSlot?: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExpedientesListWrapper({
  viewModeSlot,
}: ExpedientesListWrapperProps) {
  // ─── Table instance ──────────────────────────────────────────────────────
  const [table, setTable] = React.useState<TanstackTable<Expediente> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // ─── Pagination (0-based no UI, convertido para 1-based no hook) ─────────
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // ─── Search ──────────────────────────────────────────────────────────────
  const [globalFilter, setGlobalFilter] = React.useState('');

  // ─── Filters ─────────────────────────────────────────────────────────────
  const [statusFiltro, setStatusFiltro] = React.useState<StatusFiltro[]>([]);
  const [trtFiltro, setTrtFiltro] = React.useState<CodigoTribunal[]>([]);
  const [grauFiltro, setGrauFiltro] = React.useState<GrauTribunal[]>([]);
  const [origemFiltro, setOrigemFiltro] = React.useState<OrigemExpediente[]>([]);
  const [responsavelFiltro, setResponsavelFiltro] = React.useState<(number | 'null')[]>([]);
  const [tipoExpedienteFiltro, setTipoExpedienteFiltro] = React.useState<number[]>([]);

  // ─── Derivar params de status ────────────────────────────────────────────
  // O hook aceita `baixado: boolean` e `prazoVencido: boolean` (valores únicos).
  // Com multi-select, só enviamos filtro server-side quando exatamente 1 opção selecionada.
  const baixadoParam = React.useMemo(() => {
    const temBaixado = statusFiltro.includes('baixado');
    const temPendente = statusFiltro.includes('pendente');
    if (temBaixado && !temPendente) return true;
    if (temPendente && !temBaixado) return false;
    return undefined;
  }, [statusFiltro]);

  const prazoVencidoParam = statusFiltro.includes('vencido') ? true : undefined;

  // ─── Data fetching (server-side pagination) ──────────────────────────────
  const { expedientes, paginacao, isLoading, error, refetch } = useExpedientes({
    pagina: pageIndex + 1,
    limite: pageSize,
    busca: globalFilter || undefined,
    baixado: baixadoParam,
    prazoVencido: prazoVencidoParam,
    trt: trtFiltro.length === 1 ? trtFiltro[0] : undefined,
    grau: grauFiltro.length === 1 ? grauFiltro[0] : undefined,
    origem: origemFiltro.length === 1 ? origemFiltro[0] : undefined,
    responsavelId: responsavelFiltro.length === 1 ? responsavelFiltro[0] : undefined,
    tipoExpedienteId: tipoExpedienteFiltro.length === 1 ? tipoExpedienteFiltro[0] : undefined,
    incluirSemPrazo: true,
  });

  // ─── Related data (para células de Responsável e TipoExpediente) ─────────
  const { usuarios } = useUsuarios();
  const { tiposExpedientes } = useTiposExpedientes({ limite: 100 });

  // ─── Table meta (acessível nas células via table.options.meta) ────────────
  const tableMeta: ExpedientesTableMeta = React.useMemo(() => ({
    usuarios: usuarios || [],
    tiposExpedientes: (tiposExpedientes || []).map((t) => ({
      id: t.id,
      tipoExpediente: t.tipoExpediente,
    })),
    onSuccessAction: refetch,
  }), [usuarios, tiposExpedientes, refetch]);

  // ─── Pagination helpers ──────────────────────────────────────────────────
  const total = paginacao?.total ?? 0;
  const totalPages = paginacao?.totalPaginas ?? 0;

  // ─── Filter change helper (always resets page to 0) ──────────────────────
  const withPageReset = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (value: T) => { setter(value); setPageIndex(0); };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <DataShell
      header={
        <DataTableToolbar
          table={table ?? undefined}
          density={density}
          onDensityChange={setDensity}
          searchValue={globalFilter}
          onSearchValueChange={(v) => {
            setGlobalFilter(v);
            setPageIndex(0);
          }}
          searchPlaceholder="Buscar por processo, parte, classe..."
          viewModeSlot={viewModeSlot}
          filtersSlot={
            <ExpedientesListFilters
              statusFiltro={statusFiltro}
              onStatusChange={withPageReset(setStatusFiltro)}
              trtFiltro={trtFiltro}
              onTrtChange={withPageReset(setTrtFiltro)}
              grauFiltro={grauFiltro}
              onGrauChange={withPageReset(setGrauFiltro)}
              origemFiltro={origemFiltro}
              onOrigemChange={withPageReset(setOrigemFiltro)}
              responsavelFiltro={responsavelFiltro}
              onResponsavelChange={withPageReset(setResponsavelFiltro)}
              tipoExpedienteFiltro={tipoExpedienteFiltro}
              onTipoExpedienteChange={withPageReset(setTipoExpedienteFiltro)}
              usuarios={usuarios || []}
              tiposExpedientes={tiposExpedientes || []}
            />
          }
        />
      }
      footer={
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
      }
    >
      <DataTable
        columns={columns}
        data={expedientes}
        pagination={{
          pageIndex,
          pageSize,
          total,
          totalPages,
          onPageChange: setPageIndex,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPageIndex(0);
          },
        }}
        isLoading={isLoading}
        error={error}
        density={density}
        onDensityChange={setDensity}
        onTableReady={setTable}
        options={{ meta: tableMeta as unknown as Record<string, unknown> }}
        emptyMessage="Nenhum expediente encontrado."
        striped
      />
    </DataShell>
  );
}
