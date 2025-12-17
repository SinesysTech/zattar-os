'use client';

/**
 * ObrigacoesTableWrapper - Client Component para tabela de obrigações
 *
 * Gerencia:
 * - Estado de busca e filtros
 * - Paginação com refresh via hooks
 * - Integração com ResumoCards e AlertasObrigacoes
 */

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataShell, DataPagination, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { toast } from 'sonner';
import type { Table as TanstackTable, ColumnDef } from '@tanstack/react-table';

import {
  useObrigacoes,
  useResumoObrigacoes,
  type ObrigacaoComDetalhes,
  type ResumoObrigacoes,
} from '@/features/financeiro';
import { actionSincronizarAcordo } from '@/features/obrigacoes';

import { getObrigacoesColumns } from './obrigacoes-columns';
import { ObrigacoesListFilters } from './obrigacoes-list-filters';
import { ResumoCards } from './resumo-cards';
import { AlertasObrigacoes } from './alertas-obrigacoes';

// =============================================================================
// TIPOS
// =============================================================================

interface AlertasData {
  vencidas: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
  vencendoHoje: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
  vencendoEm7Dias: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
  inconsistentes: { quantidade: number; items: ObrigacaoComDetalhes[] };
}

interface PaginationInfo {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

interface ObrigacoesTableWrapperProps {
  // Props reservadas para SSR futuro
  initialData?: ObrigacaoComDetalhes[];
  initialPagination?: PaginationInfo | null;
  initialResumo?: ResumoObrigacoes | null;
  initialAlertas?: AlertasData | null;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ObrigacoesTableWrapper(_props: ObrigacoesTableWrapperProps) {
  // -------------------------------------------------------------------------
  // 1. DATA STATE
  // -------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [table, setTable] = React.useState<TanstackTable<any> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // -------------------------------------------------------------------------
  // 2. FILTER STATE
  // -------------------------------------------------------------------------
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [tipoFilter, setTipoFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('pendente');

  // -------------------------------------------------------------------------
  // 3. PAGINATION STATE
  // -------------------------------------------------------------------------
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // Debounce da busca
  const buscaDebounced = useDebounce(globalFilter, 500);

  // -------------------------------------------------------------------------
  // 4. HOOK DE DADOS (SWR)
  // -------------------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params = React.useMemo((): any => ({
    pagina: pageIndex + 1,
    limite: pageSize,
    busca: buscaDebounced || undefined,
    // Filtros como arrays (formato esperado pela API)
    tipos: tipoFilter !== 'all' ? [tipoFilter] : undefined,
    status: statusFilter !== 'all' ? [statusFilter] : undefined,
  }), [pageIndex, pageSize, buscaDebounced, tipoFilter, statusFilter]);

  const {
    obrigacoes,
    paginacao,
    resumo,
    isLoading,
    error,
    refetch,
  } = useObrigacoes(params);

  // Hook de alertas
  const { alertas: alertasRaw, isLoading: isLoadingAlertas } = useResumoObrigacoes();

  // Adaptar alertas para o formato esperado pelo componente
  const alertas: AlertasData | null = React.useMemo(() => {
    if (!alertasRaw || !Array.isArray(alertasRaw)) return null;
    // Se alertas for um array (AlertaObrigacao[]), converter para AlertasData
    // Por enquanto, retornar null pois o formato é diferente
    return null;
  }, [alertasRaw]);

  // Adaptar resumo para o formato esperado pelo componente
  const resumoFormatado: ResumoObrigacoes | null = React.useMemo(() => {
    if (!resumo) return null;
    // O hook retorna um formato diferente, adaptar se necessário
    return resumo as unknown as ResumoObrigacoes;
  }, [resumo]);

  // Calcular totalPaginas se não existir
  const totalPaginas = paginacao ? Math.ceil(paginacao.total / paginacao.limite) : 0;

  // -------------------------------------------------------------------------
  // 5. HANDLERS DE AÇÕES
  // -------------------------------------------------------------------------
  const handleVerDetalhes = React.useCallback((obrigacao: ObrigacaoComDetalhes) => {
    window.location.href = `/financeiro/obrigacoes/${obrigacao.id}`;
  }, []);

  const handleSincronizar = React.useCallback(
    async (obrigacao: ObrigacaoComDetalhes) => {
      if (!obrigacao.acordoId) {
        toast.error('Obrigação não possui acordo vinculado');
        return;
      }

      try {
        const resultado = await actionSincronizarAcordo(obrigacao.acordoId, false);
        if (!resultado.success) {
          throw new Error(resultado.error);
        }
        toast.success('Sincronização realizada com sucesso');
        refetch();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao sincronizar';
        toast.error(message);
      }
    },
    [refetch]
  );

  const handleVerLancamento = React.useCallback((obrigacao: ObrigacaoComDetalhes) => {
    if (!obrigacao.lancamentoId) {
      toast.error('Lançamento financeiro não encontrado');
      return;
    }
    const tipo = obrigacao.tipo as string;
    const rota =
      tipo === 'conta_pagar' || tipo === 'acordo_pagamento'
        ? `/financeiro/contas-pagar/${obrigacao.lancamentoId}`
        : `/financeiro/contas-receber/${obrigacao.lancamentoId}`;

    window.location.href = rota;
  }, []);

  // -------------------------------------------------------------------------
  // 6. HANDLERS DE ALERTAS (filtros rápidos)
  // -------------------------------------------------------------------------
  const handleFiltrarVencidas = React.useCallback(() => {
    setStatusFilter('vencida');
    setTipoFilter('all');
    setPageIndex(0);
  }, []);

  const handleFiltrarHoje = React.useCallback(() => {
    setStatusFilter('pendente');
    setTipoFilter('all');
    setPageIndex(0);
  }, []);

  const handleFiltrarInconsistentes = React.useCallback(() => {
    setStatusFilter('all');
    setTipoFilter('all');
    setPageIndex(0);
  }, []);

  // -------------------------------------------------------------------------
  // 7. COLUNAS
  // -------------------------------------------------------------------------
  const colunas = React.useMemo(
    () => getObrigacoesColumns(handleVerDetalhes, handleSincronizar, handleVerLancamento),
    [handleVerDetalhes, handleSincronizar, handleVerLancamento]
  );

  // -------------------------------------------------------------------------
  // 8. RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Cards de Resumo */}
      <ResumoCards resumo={resumoFormatado} isLoading={isLoading && !resumoFormatado} />

      {/* Alertas */}
      <AlertasObrigacoes
        alertas={alertas}
        isLoading={isLoadingAlertas && !alertas}
        onFiltrarVencidas={handleFiltrarVencidas}
        onFiltrarHoje={handleFiltrarHoje}
        onFiltrarInconsistentes={handleFiltrarInconsistentes}
      />

      {/* Tabela com DataShell */}
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              density={density}
              onDensityChange={setDensity}
              searchValue={globalFilter}
              onSearchValueChange={(value) => {
                setGlobalFilter(value);
                setPageIndex(0);
              }}
              searchPlaceholder="Buscar por descrição, cliente ou processo..."
              filtersSlot={
                <ObrigacoesListFilters
                  tipoFilter={tipoFilter}
                  onTipoChange={(val) => {
                    setTipoFilter(val);
                    setPageIndex(0);
                  }}
                  statusFilter={statusFilter}
                  onStatusChange={(val) => {
                    setStatusFilter(val);
                    setPageIndex(0);
                  }}
                />
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          paginacao && totalPaginas > 0 ? (
            <DataPagination
              pageIndex={paginacao.pagina - 1}
              pageSize={paginacao.limite}
              total={paginacao.total}
              totalPages={totalPaginas}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <div className="relative border-t">
          <DataTable
            data={obrigacoes as unknown as ObrigacaoComDetalhes[]}
            columns={colunas as ColumnDef<ObrigacaoComDetalhes>[]}
            density={density}
            pagination={
              paginacao
                ? {
                    pageIndex: paginacao.pagina - 1,
                    pageSize: paginacao.limite,
                    total: paginacao.total,
                    totalPages: totalPaginas,
                    onPageChange: setPageIndex,
                    onPageSizeChange: setPageSize,
                  }
                : undefined
            }
            isLoading={isLoading}
            error={error}
            emptyMessage="Nenhuma obrigação encontrada."
            hideTableBorder={true}
            hidePagination={true}
            onTableReady={(t) => setTable(t)}
          />
        </div>
      </DataShell>
    </div>
  );
}
