'use client';

// Hook para buscar clientes

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ClientesApiResponse, BuscarClientesParams } from '@/app/_lib/types/clientes';
import type { Cliente } from '@/backend/types/partes/clientes-types';

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
  
  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const tipoPessoa = params.tipoPessoa || '';
  const ativo = params.ativo;
  const incluirEndereco = params.incluirEndereco ?? false;
  const incluirProcessos = params.incluirProcessos ?? false;

  // Normalizar parâmetros para comparação estável
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      tipoPessoa,
      ativo,
      incluirEndereco,
      incluirProcessos,
    });
  }, [pagina, limite, busca, tipoPessoa, ativo, incluirEndereco, incluirProcessos]);
  
  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>('');

  const buscarClientes = useCallback(async () => {
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
      if (tipoPessoa) {
        searchParams.set('tipoPessoa', tipoPessoa);
      }
      if (ativo !== undefined) {
        searchParams.set('ativo', ativo.toString());
      }
      if (incluirEndereco) {
        searchParams.set('incluir_endereco', 'true');
      }
      if (incluirProcessos) {
        searchParams.set('incluir_processos', 'true');
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
  }, [pagina, limite, busca, tipoPessoa, ativo, incluirEndereco, incluirProcessos]);

  useEffect(() => {
    // Só executar se os parâmetros realmente mudaram
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      buscarClientes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return {
    clientes,
    paginacao,
    isLoading,
    error,
    refetch: buscarClientes,
  };
};

