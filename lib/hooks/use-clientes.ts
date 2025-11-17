'use client';

// Hook para buscar clientes

import { useState, useEffect, useCallback } from 'react';
import type { ClientesApiResponse, BuscarClientesParams } from '@/lib/types/clientes';
import type { Cliente } from '@/backend/clientes/services/persistence/cliente-persistence.service';

interface UseClientesResult {
  clientes: Cliente[];
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
 * Hook para buscar clientes
 */
export const useClientes = (params: BuscarClientesParams = {}): UseClientesResult => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [paginacao, setPaginacao] = useState<UseClientesResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarClientes = useCallback(async () => {
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
      if (params.tipoPessoa) {
        searchParams.set('tipoPessoa', params.tipoPessoa);
      }
      if (params.ativo !== undefined) {
        searchParams.set('ativo', params.ativo.toString());
      }

      const response = await fetch(`/api/clientes?${searchParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: ClientesApiResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setClientes(data.data.clientes);
      setPaginacao({
        pagina: data.data.pagina,
        limite: data.data.limite,
        total: data.data.total,
        totalPaginas: data.data.totalPaginas,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar clientes';
      setError(errorMessage);
      setClientes([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    buscarClientes();
  }, [buscarClientes]);

  return {
    clientes,
    paginacao,
    isLoading,
    error,
    refetch: buscarClientes,
  };
};

