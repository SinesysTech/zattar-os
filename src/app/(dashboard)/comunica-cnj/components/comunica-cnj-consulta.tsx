'use client';

import { useState } from 'react';
import { ComunicaCNJSearchForm } from './comunica-cnj-search-form';
import { ComunicaCNJResultsTable } from './comunica-cnj-results-table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import type { ComunicacaoItem, RateLimitStatus } from '@/core/comunica-cnj';

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
 * Componente de consulta na API do CNJ
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
      // Montar query string
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/comunica-cnj/consulta?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(`Rate limit atingido. Aguarde ${data.retryAfter || 60} segundos.`);
        } else {
          setError(data.error || 'Erro ao consultar comunicações');
        }
        return;
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar comunicações');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de busca */}
      <ComunicaCNJSearchForm onSearch={handleSearch} isLoading={isLoading} />

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Rate limit info */}
      {result?.rateLimit && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Rate Limit: {result.rateLimit.remaining}/{result.rateLimit.limit} requisições restantes
            {result.rateLimit.resetAt && (
              <span className="ml-2 text-muted-foreground">
                (reset em {new Date(result.rateLimit.resetAt).toLocaleTimeString('pt-BR')})
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Resultados */}
      {result && (
        <ComunicaCNJResultsTable
          comunicacoes={result.comunicacoes}
          paginacao={result.paginacao}
          isLoading={isLoading}
        />
      )}

      {/* Estado inicial */}
      {!result && !error && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Use os filtros acima para buscar comunicações no CNJ</p>
          <p className="text-sm mt-2">
            Pelo menos um filtro deve ser preenchido para realizar a busca
          </p>
        </div>
      )}
    </div>
  );
}

// Importação do ícone Search
import { Search } from 'lucide-react';
