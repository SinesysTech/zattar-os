'use client';

/**
 * Hook para buscar representantes
 * 
 * NOTA: Após a refatoração do modelo, representantes são sempre advogados
 * (pessoas físicas) com CPF único.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  RepresentantesApiResponse,
  BuscarRepresentantesParams,
} from '@/app/_lib/types/representantes';
import type { Representante } from '@/backend/types/representantes/representantes-types';

interface UseRepresentantesResult {
  representantes: Representante[];
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
 * Hook para buscar representantes
 */
export const useRepresentantes = (
  params: BuscarRepresentantesParams = {}
): UseRepresentantesResult => {
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [paginacao, setPaginacao] = useState<UseRepresentantesResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const numeroOab = params.numero_oab || '';
  const situacaoOab = params.situacao_oab || '';
  const incluirEndereco = params.incluirEndereco ?? false;

  // Normalizar parâmetros para comparação estável
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      numeroOab,
      situacaoOab,
      incluirEndereco,
    });
  }, [pagina, limite, busca, numeroOab, situacaoOab, incluirEndereco]);

  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>('');

  const buscarRepresentantes = useCallback(async () => {
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
      if (numeroOab) {
        searchParams.set('numero_oab', numeroOab);
      }
      if (situacaoOab) {
        searchParams.set('situacao_oab', situacaoOab);
      }
      if (incluirEndereco) {
        searchParams.set('incluir_endereco', 'true');
      }

      const response = await fetch(`/api/representantes?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: RepresentantesApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setRepresentantes(data.data.representantes);
      setPaginacao({
        pagina: data.data.pagina,
        limite: data.data.limite,
        total: data.data.total,
        totalPaginas: data.data.totalPaginas,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar representantes';
      setError(errorMessage);
      setRepresentantes([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, busca, numeroOab, situacaoOab, incluirEndereco]);

  useEffect(() => {
    // Só executar se os parâmetros realmente mudaram
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      buscarRepresentantes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return {
    representantes,
    paginacao,
    isLoading,
    error,
    refetch: buscarRepresentantes,
  };
};
