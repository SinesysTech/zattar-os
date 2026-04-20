'use client';

/**
 * PericiasListWrapper — View de lista (thin).
 * ============================================================================
 * Renderiza apenas DataTable + paginação. Toolbar (search, filtros, botão
 * "Nova Perícia", view switcher) vive no PericiasClient pai. Este componente
 * é um view puro que consome props controlled.
 *
 * Estado local mínimo: pagination, density, rowSelection (UI-only).
 * ============================================================================
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { format } from 'date-fns';

import {
  DataShell,
  DataTable,
  DataPagination,
} from '@/components/shared/data-shell';

import type {
  Pericia,
  UsuarioOption,
  EspecialidadePericiaOption,
  PeritoOption,
} from '../domain';
import { SituacaoPericiaCodigo } from '../domain';
import { usePericias } from '../hooks/use-pericias';
import { columns } from './columns';
import type {
  SituacaoFilterType,
  ResponsavelFilterType,
  LaudoFilterType,
} from './pericias-filter-bar';

// =============================================================================
// TIPOS
// =============================================================================

export interface PericiasListWrapperProps {
  busca: string;
  situacaoFilter: SituacaoFilterType;
  responsavelFilter: ResponsavelFilterType;
  laudoFilter: LaudoFilterType;
  tribunalFilter: string;
  grauFilter: string;
  especialidadeFilter: string;
  peritoFilter: string;
  dateRange?: { from?: Date; to?: Date };
  usuarios: UsuarioOption[];
  especialidades: EspecialidadePericiaOption[];
  peritos: PeritoOption[];
  /** Incrementado externamente para forçar refetch (ex: após criar perícia). */
  refetchKey: number;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function PericiasListWrapper({
  busca,
  situacaoFilter,
  responsavelFilter,
  laudoFilter,
  tribunalFilter,
  grauFilter,
  especialidadeFilter,
  peritoFilter,
  dateRange,
  usuarios,
  refetchKey,
}: PericiasListWrapperProps) {
  const router = useRouter();

  // ---------- Estado local da tabela ----------
  const [density, setDensity] = React.useState<
    'compact' | 'standard' | 'relaxed'
  >('standard');
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});
  const [, setTable] = React.useState<TanstackTable<Pericia> | null>(null);

  // ---------- Paginação ----------
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // Reset page when filters/busca change
  React.useEffect(() => {
    setPageIndex(0);
  }, [
    busca,
    situacaoFilter,
    responsavelFilter,
    laudoFilter,
    tribunalFilter,
    grauFilter,
    especialidadeFilter,
    peritoFilter,
    dateRange,
  ]);

  // ---------- Hook params (derivados das props controlled) ----------
  const hookParams = React.useMemo(() => {
    const params: Record<string, unknown> = {
      pagina: pageIndex + 1,
      limite: pageSize,
      busca: busca || undefined,
    };

    if (situacaoFilter !== 'todos') {
      params.situacaoCodigo = situacaoFilter;
    } else {
      params.situacoesExcluidas = [
        SituacaoPericiaCodigo.FINALIZADA,
        SituacaoPericiaCodigo.CANCELADA,
      ];
    }

    if (responsavelFilter === 'sem_responsavel') {
      params.semResponsavel = true;
    } else if (typeof responsavelFilter === 'number') {
      params.responsavelId = responsavelFilter;
    }

    if (laudoFilter === 'sim') params.laudoJuntado = true;
    if (laudoFilter === 'nao') params.laudoJuntado = false;

    if (dateRange?.from)
      params.prazoEntregaInicio = format(dateRange.from, 'yyyy-MM-dd');
    if (dateRange?.to)
      params.prazoEntregaFim = format(dateRange.to, 'yyyy-MM-dd');

    if (tribunalFilter) params.trt = tribunalFilter;
    if (grauFilter) params.grau = grauFilter;
    if (especialidadeFilter)
      params.especialidadeId = parseInt(especialidadeFilter, 10);
    if (peritoFilter) params.peritoId = parseInt(peritoFilter, 10);

    return params;
  }, [
    pageIndex,
    pageSize,
    busca,
    situacaoFilter,
    responsavelFilter,
    laudoFilter,
    tribunalFilter,
    grauFilter,
    especialidadeFilter,
    peritoFilter,
    dateRange,
  ]);

  const { pericias, paginacao, isLoading, error, refetch } =
    usePericias(hookParams);

  // Refetch external (ex: após criar perícia no dialog do client pai)
  React.useEffect(() => {
    if (refetchKey > 0) {
      refetch();
    }
  }, [refetchKey, refetch]);

  const total = paginacao?.total ?? 0;
  const totalPages = paginacao?.totalPaginas ?? 0;

  const handleSucessoOperacao = React.useCallback(() => {
    setRowSelection({});
    refetch();
    router.refresh();
  }, [refetch, router]);

  return (
    <DataShell
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
      <DataTable
        data={pericias}
        columns={columns}
        isLoading={isLoading}
        error={error}
        density={density}
        onDensityChange={setDensity}
        onTableReady={(t) => setTable(t as TanstackTable<Pericia>)}
        emptyMessage="Nenhuma perícia encontrada."
        rowSelection={{
          state: rowSelection,
          onRowSelectionChange: setRowSelection,
          getRowId: (row) => row.id.toString(),
        }}
        options={{
          meta: {
            usuarios,
            onSuccess: handleSucessoOperacao,
          },
        }}
      />
    </DataShell>
  );
}
