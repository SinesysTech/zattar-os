'use client';

/**
 * ExpedientesListWrapper — Glass rows with server-side pagination
 *
 * Simplified: no table mode, no inline filters. Filters come from parent
 * via ExpedientesFilterBar in expedientes-content.tsx.
 */

import * as React from 'react';
import { DataPagination } from '@/components/shared/data-shell';
import { useExpedientes } from '../hooks/use-expedientes';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';
import { ExpedientesGlassList } from './expedientes-glass-list';
import type { Expediente } from '../domain';
import type { ExpedientesFilterBarFilters } from './expedientes-filter-bar';

// ─── Component ───────────────────────────────────────────────────────────────

export interface ExpedientesListWrapperProps {
  search?: string;
  activeTab?: 'todos' | 'pendentes' | 'baixados';
  refreshCounter?: number;
  onViewDetail?: (expediente: Expediente) => void;
  onBaixar?: (expediente: Expediente) => void;
  filters?: ExpedientesFilterBarFilters;
}

export function ExpedientesListWrapper({
  search = '',
  activeTab = 'pendentes',
  refreshCounter = 0,
  onViewDetail,
  onBaixar,
  filters,
}: ExpedientesListWrapperProps) {
  // ─── Pagination (0-based no UI, convertido para 1-based no hook) ─────────
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // ─── Derivar params de status a partir da activeTab ──────────────────────
  const baixadoParam = React.useMemo(() => {
    if (activeTab === 'pendentes') return false;
    if (activeTab === 'baixados') return true;
    return undefined; // todos
  }, [activeTab]);

  // Reset pagination when search or tab changes
  React.useEffect(() => {
    setPageIndex(0);
  }, [search, activeTab]);

  // ─── Data fetching (server-side pagination) ──────────────────────────────
  const { expedientes, paginacao, isLoading, refetch } = useExpedientes({
    pagina: pageIndex + 1,
    limite: pageSize,
    busca: search || undefined,
    baixado: baixadoParam,
    trt: filters?.trt || undefined,
    grau: filters?.grau || undefined,
    origem: filters?.origem || undefined,
    responsavelId: filters?.responsavel
      ? (filters.responsavel === 'null' ? 'null' : Number(filters.responsavel))
      : undefined,
    tipoExpedienteId: filters?.tipo ? Number(filters.tipo) : undefined,
    incluirSemPrazo: true,
  });

  React.useEffect(() => {
    if (refreshCounter > 0) {
      refetch();
    }
  }, [refreshCounter, refetch]);

  // ─── Related data (para células de Responsável e TipoExpediente) ─────────
  const { usuarios } = useUsuarios();
  const { tiposExpedientes } = useTiposExpedientes({ limite: 100 });

  // ─── Pagination helpers ──────────────────────────────────────────────────
  const total = paginacao?.total ?? 0;
  const totalPages = paginacao?.totalPaginas ?? 0;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      <ExpedientesGlassList
        expedientes={expedientes}
        isLoading={isLoading}
        onViewDetail={onViewDetail ?? (() => {})}
        onBaixar={onBaixar}
        usuariosData={usuarios}
        tiposExpedientesData={tiposExpedientes}
      />
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
    </div>
  );
}
