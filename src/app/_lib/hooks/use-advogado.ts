'use client';

import { useState, useCallback } from 'react';
import type { Advogado } from '@/core/app/_lib/types/credenciais';

interface UseAdvogadoResult {
  advogado: Advogado | null;
  isLoading: boolean;
  error: string | null;
  buscarAdvogado: (id: number) => Promise<void>;
  atualizarAdvogado: (id: number, params: Partial<Omit<Advogado, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
}

interface AdvogadoApiResponse {
  success: boolean;
  data: Advogado;
}

interface ListarAdvogadosResult {
  advogados: Advogado[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

interface ListarAdvogadosApiResponse {
  success: boolean;
  data: ListarAdvogadosResult;
}

/**
 * Hook para gerenciar operações com advogados
 */
export const useAdvogado = (): UseAdvogadoResult => {
  const [advogado, setAdvogado] = useState<Advogado | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarAdvogado = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/advogados/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: AdvogadoApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setAdvogado(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar advogado';
      setError(errorMessage);
      setAdvogado(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const atualizarAdvogado = useCallback(
    async (id: number, params: Partial<Omit<Advogado, 'id' | 'created_at' | 'updated_at'>>) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/advogados/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        const data: AdvogadoApiResponse = await response.json();

        if (!data.success) {
          throw new Error('Resposta da API indicou falha');
        }

        setAdvogado(data.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar advogado';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    advogado,
    isLoading,
    error,
    buscarAdvogado,
    atualizarAdvogado,
  };
};

/**
 * Hook para listar advogados (para selects/autocomplete)
 */
export const useListarAdvogados = () => {
  const [advogados, setAdvogados] = useState<Advogado[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarAdvogados = useCallback(async (busca?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (busca) {
        searchParams.set('busca', busca);
      }
      searchParams.set('limite', '100'); // Buscar até 100 advogados

      const response = await fetch(`/api/advogados?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: ListarAdvogadosApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setAdvogados(data.data.advogados);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar advogados';
      setError(errorMessage);
      setAdvogados([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    advogados,
    isLoading,
    error,
    buscarAdvogados,
  };
};
