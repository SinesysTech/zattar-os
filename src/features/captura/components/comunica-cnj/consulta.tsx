'use client';

import { useState, useRef, useCallback } from 'react';
import { ComunicaCNJSearchForm } from './search-form';
import { ComunicaCNJResultsTable } from './results-table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Search, Zap } from 'lucide-react';
import { actionConsultarComunicacoes } from '../../actions/comunica-cnj-actions';
import type { ComunicacaoItem, RateLimitStatus } from '../../comunica-cnj/domain';

interface SearchResult {
  comunicacoes: ComunicacaoItem[];
  paginacao: {
    pagina: number;
    itensPorPagina: number;
    total: number;
    totalPaginas: number;
  };
  rateLimit: RateLimitStatus;
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-foreground">{value}</div>
      {detail ? <div className="mt-1 text-xs text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

/**
 * Componente de consulta na API do Diário Oficial (CNJ)
 * Contém o formulário de busca e a tabela de resultados
 */
export function ComunicaCNJConsulta() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const lastFiltersRef = useRef<Record<string, unknown>>({});

  const executeSearch = useCallback(async (filters: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await actionConsultarComunicacoes(filters);

      if (!response.success || !response.data) {
        setError(response.error || 'Erro ao consultar comunicações');
        return;
      }

      setResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar comunicações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (filters: Record<string, unknown>) => {
    lastFiltersRef.current = filters;
    await executeSearch({ ...filters, pagina: 1 });
  }, [executeSearch]);

  const handlePageChange = useCallback(async (pageIndex: number) => {
    const pagina = pageIndex + 1; // DataTable usa 0-based, API usa 1-based
    await executeSearch({ ...lastFiltersRef.current, pagina });
  }, [executeSearch]);

  const currentPage = result?.paginacao.pagina ?? 1;
  const totalPages = result?.paginacao.totalPaginas ?? 0;
  const visibleItems = result?.comunicacoes.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Formulário de busca */}
      <ComunicaCNJSearchForm onSearch={handleSearch} isLoading={isLoading} />

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Rate limit + contagem de resultados */}
      {result && (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <SummaryCard
            label="Resultados"
            value={result.paginacao.total.toLocaleString('pt-BR')}
            detail="Comunicações localizadas na consulta atual"
          />
          <SummaryCard
            label="Página"
            value={`${currentPage}/${totalPages}`}
            detail={`${visibleItems} itens exibidos nesta página`}
          />
          {result.rateLimit ? (
            <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                Limite da API
              </div>
              <div className="mt-1 text-xl font-semibold text-foreground">
                {result.rateLimit.remaining}/{result.rateLimit.limit}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Requisições restantes na janela atual
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Resultados */}
      {result && (
        <ComunicaCNJResultsTable
          comunicacoes={result.comunicacoes}
          isLoading={isLoading}
          pagination={result.paginacao.totalPaginas > 1 ? {
            pageIndex: result.paginacao.pagina - 1,
            pageSize: result.paginacao.itensPorPagina,
            total: result.paginacao.total,
            totalPages: result.paginacao.totalPaginas,
            onPageChange: handlePageChange,
            onPageSizeChange: () => {},
          } : undefined}
        />
      )}

      {/* Estado inicial */}
      {!result && !error && !isLoading && (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center text-muted-foreground">
          <Search className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p className="text-base font-medium text-foreground">Use os filtros acima para buscar comunicações no Diário Oficial</p>
          <p className="mt-2 text-sm">
            Informe ao menos um filtro para consultar a base oficial do CNJ com segurança e evitar buscas amplas demais.
          </p>
        </div>
      )}
    </div>
  );
}
