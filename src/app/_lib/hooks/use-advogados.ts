'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Advogado, ListarAdvogadosParams } from '@/backend/types/advogados/types';

interface AdvogadosApiResponse {
  success: boolean;
  data: {
    advogados: Advogado[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

interface UseAdvogadosResult {
  advogados: Advogado[];
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

/**
 * Hook para buscar advogados
 */
export const useAdvogados = (params: ListarAdvogadosParams = {}): UseAdvogadosResult => {
  const [advogados, setAdvogados] = useState<Advogado[]>([]);
  const [paginacao, setPaginacao] = useState<UseAdvogadosResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarAdvogados = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Construir query string
      const searchParams = new URLSearchParams();

      if (params.pagina !== undefined) {
        searchParams.set('pagina', params.pagina.toString());
      }
      if (params.limite !== undefined) {
        searchParams.set('limite', params.limite.toString());
      }
      if (params.busca) {
        searchParams.set('busca', params.busca);
      }
      if (params.oab) {
        searchParams.set('oab', params.oab);
      }
      if (params.uf_oab) {
        searchParams.set('uf_oab', params.uf_oab);
      }
      if (params.com_credenciais === true) {
        searchParams.set('com_credenciais', 'true');
      }

      const response = await fetch(`/api/advogados?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: AdvogadosApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setAdvogados(data.data.advogados);
      setPaginacao({
        pagina: data.data.pagina,
        limite: data.data.limite,
        total: data.data.total,
        totalPaginas: data.data.totalPaginas,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar advogados';
      setError(errorMessage);
      setAdvogados([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.pagina,
    params.limite,
    params.busca,
    params.oab,
    params.uf_oab,
    params.com_credenciais,
  ]);

  useEffect(() => {
    buscarAdvogados();
  }, [buscarAdvogados]);

  return {
    advogados,
    paginacao,
    isLoading,
    error,
    refetch: buscarAdvogados,
  };
};

