'use client';

/**
 * ObrigacoesTableWrapper - Client Component para tabela de obrigações
 *
 * Recebe dados iniciais do Server Component e gerencia:
 * - Estado de busca e filtros
 * - Paginação com refresh via Server Actions
 * - Integração com ResumoCards e AlertasObrigacoes
 */

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataShell, DataPagination, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { toast } from 'sonner';
import type { Table as TanstackTable } from '@tanstack/react-table';

import {
  useObrigacoes,
  useResumoObrigacoes,
  type ObrigacaoComDetalhes,
  type ResumoObrigacoes,
  type TipoObrigacao,
  type StatusObrigacao,
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
  initialData: ObrigacaoComDetalhes[];
  initialPagination: PaginationInfo | null;
  initialResumo: ResumoObrigacoes | null;
  initialAlertas: AlertasData | null;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ObrigacoesTableWrapper({
  initialData,
  initialPagination,
  initialResumo,
  initialAlertas,
}: ObrigacoesTableWrapperProps) {
  // -------------------------------------------------------------------------
  // 1. DATA STATE
  // -------------------------------------------------------------------------
  const [table, setTable] = React.useState<TanstackTable<ObrigacaoComDetalhes> | null>(null);
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
  const [pageIndex, setPageIndex] = React.useState(
    initialPagination ? initialPagination.pagina - 1 : 0
  );
  const [pageSize, setPageSize] = React.useState(
    initialPagination ? initialPagination.limite : 50
  );

  // Debounce da busca
  const buscaDebounced = useDebounce(globalFilter, 500);

  // -------------------------------------------------------------------------
  // 4. HOOK DE DADOS (SWR)
  // -------------------------------------------------------------------------
  const params = React.useMemo(() => ({
    pagina: pageIndex + 1,
    limite: pageSize,
    busca: buscaDebounced || undefined,
    tipos: tipoFilter !== 'all' ? [tipoFilter as TipoObrigacao] : undefined,
    status: statusFilter !== 'all' ? [statusFilter as StatusObrigacao] : undefined,
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
  const { alertas, isLoading: isLoadingAlertas } = useResumoObrigacoes({
    incluirAlertas: true,
  });

  // Usar dados do hook ou fallback para initialData na primeira renderização
  const data = obrigacoes.length > 0 || !initialData.length ? obrigacoes : initialData;
  const currentResumo = resumo || initialResumo;
  const currentAlertas = alertas || initialAlertas;
  const currentPaginacao = paginacao || initialPagination;

  // -------------------------------------------------------------------------
  // 5. HANDLERS DE AÇÕES
  // -------------------------------------------------------------------------
  const handleVerDetalhes = React.useCallback((obrigacao: ObrigacaoComDetalhes) => {
    // Gerar ID da obrigação para a rota
    const obrigacaoId =
      obrigacao.tipoEntidade === 'parcela' && obrigacao.parcela?.id
        ? `${obrigacao.tipoEntidade}_${obrigacao.parcela.id}`
        : obrigacao.id;

    // Navegar para a página de detalhes
    window.location.href = `/financeiro/obrigacoes/${obrigacaoId}`;
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
    // Determinar rota baseada no tipo
    const rota =
      obrigacao.tipo === 'conta_pagar' || obrigacao.tipo === 'acordo_pagamento'
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
    // Para inconsistentes, manter filtros e deixar a busca específica
    // O hook de obrigações pode ter parâmetro apenasInconsistentes
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
      <ResumoCards resumo={currentResumo} isLoading={isLoading && !currentResumo} />

      {/* Alertas */}
      <AlertasObrigacoes
        alertas={currentAlertas}
        isLoading={isLoadingAlertas && !currentAlertas}
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
          currentPaginacao && currentPaginacao.totalPaginas > 0 ? (
            <DataPagination
              pageIndex={currentPaginacao.pagina - 1}
              pageSize={currentPaginacao.limite}
              total={currentPaginacao.total}
              totalPages={currentPaginacao.totalPaginas}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <div className="relative border-t">
          <DataTable
            data={data}
            columns={colunas}
            density={density}
            pagination={
              currentPaginacao
                ? {
                    pageIndex: currentPaginacao.pagina - 1,
                    pageSize: currentPaginacao.limite,
                    total: currentPaginacao.total,
                    totalPages: currentPaginacao.totalPaginas,
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
            onTableReady={(t) => setTable(t as TanstackTable<ObrigacaoComDetalhes>)}
          />
        </div>
      </DataShell>
    </div>
  );
}
