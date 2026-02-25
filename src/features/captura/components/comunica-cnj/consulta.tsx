'use client';

import { useState } from 'react';
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

/**
 * Componente de consulta na API do Diário Oficial (CNJ)
 * Contém o formulário de busca e a tabela de resultados
 */
export function ComunicaCNJConsulta() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);

  const handleSearch = async (filters: Record<string, unknown>) => {
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
  };

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
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {result.comunicacoes.length} comunicações encontradas
            {result.paginacao.total > result.paginacao.itensPorPagina && (
              <span> (página {result.paginacao.pagina} de {result.paginacao.totalPaginas})</span>
            )}
          </span>
          {result.rateLimit && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              {result.rateLimit.remaining}/{result.rateLimit.limit} requisições
            </span>
          )}
        </div>
      )}

      {/* Resultados */}
      {result && (
        <ComunicaCNJResultsTable
          comunicacoes={result.comunicacoes}
          isLoading={isLoading}
        />
      )}

      {/* Estado inicial */}
      {!result && !error && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Use os filtros acima para buscar comunicações no Diário Oficial</p>
          <p className="text-sm mt-2">
            Pelo menos um filtro deve ser preenchido para realizar a busca
          </p>
        </div>
      )}
    </div>
  );
}
