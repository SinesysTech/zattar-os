'use client';

// Hook para buscar tipos de expedientes do sistema

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ListarTiposExpedientesParams, TipoExpediente } from '@/features/tipos-expedientes';

interface UseTiposExpedientesResult {
  tiposExpedientes: TipoExpediente[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface TiposExpedientesApiResponse {
  success: boolean;
  data: {
    data: TipoExpediente[];
    meta: {
      total: number;
      pagina: number;
      limite: number;
      totalPaginas: number;
    };
  };
}

/**
 * Hook para buscar tipos de expedientes do sistema com paginação e filtros
 */
export const useTiposExpedientes = (params: ListarTiposExpedientesParams = {}): UseTiposExpedientesResult => {
  const [tiposExpedientes, setTiposExpedientes] = useState<TipoExpediente[]>([]);
  const [paginacao, setPaginacao] = useState<UseTiposExpedientesResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const ordenarPor = params.ordenarPor;
  const ordem = params.ordem;

  // Normalizar parâmetros para comparação estável
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      ordenarPor,
      ordem,
    });
  }, [pagina, limite, busca, ordenarPor, ordem]);

  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>('');

  const buscarTiposExpedientes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Construir query string
      const searchParams = new URLSearchParams();

      searchParams.set('pagina', pagina.toString());
      searchParams.set('limite', limite.toString());

      if (busca) {
        searchParams.set('busca', busca);
      }
      if (ordenarPor) {
        searchParams.set('ordenar_por', ordenarPor);
      }
      if (ordem) {
        searchParams.set('ordem', ordem);
      }

      const response = await fetch(`/api/tipos-expedientes?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro desconhecido',
        }));
        throw new Error(
          errorData.error || `Erro ${response.status}: ${response.statusText}`
        );
      }

      const data: TiposExpedientesApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      // Verificar se a estrutura de dados está correta
      if (!data.data || !data.data.data) {
        console.error('Estrutura de dados inválida:', data);
        throw new Error('Estrutura de dados inválida na resposta da API');
      }

      setTiposExpedientes(data.data.data || []);
      setPaginacao(data.data.meta || null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar tipos de expedientes';
      setError(errorMessage);
      setTiposExpedientes([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, busca, ordenarPor, ordem]);

  useEffect(() => {
    // Só executar se os parâmetros realmente mudaram
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      buscarTiposExpedientes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return {
    tiposExpedientes,
    paginacao,
    isLoading,
    error,
    refetch: buscarTiposExpedientes,
  };
};
