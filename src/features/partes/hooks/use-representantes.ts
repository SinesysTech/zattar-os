'use client';

/**
 * Hook para buscar representantes
 *
 * NOTA: Apos a refatoracao do modelo, representantes sao sempre advogados
 * (pessoas fisicas) com CPF unico.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Representante } from '@/types/domain/representantes';
import type { RepresentantesApiResponse } from '@/types/representantes';
import type { BuscarRepresentantesParams, PaginationInfo } from '../types';

interface UseRepresentantesResult<T extends Representante = Representante> {
  representantes: T[];
  paginacao: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar representantes
 */
export const useRepresentantes = <T extends Representante = Representante>(
  params: BuscarRepresentantesParams = {}
): UseRepresentantesResult<T> => {
  const [representantes, setRepresentantes] = useState<T[]>([]);
  const [paginacao, setPaginacao] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const oab = params.oab || '';
  const incluirEndereco = params.incluirEndereco ?? false;
  const incluirProcessos = params.incluirProcessos ?? false;

  // Normalizar parametros para comparacao estavel
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      oab,
      incluirEndereco,
      incluirProcessos,
    });
  }, [pagina, limite, busca, oab, incluirEndereco, incluirProcessos]);

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
      if (oab) {
        searchParams.set('oab', oab);
      }
      if (incluirEndereco) {
        searchParams.set('incluir_endereco', 'true');
      }
      if (incluirProcessos) {
        searchParams.set('incluir_processos', 'true');
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

      setRepresentantes(data.data.representantes as T[]);
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
  }, [pagina, limite, busca, oab, incluirEndereco, incluirProcessos]);

  useEffect(() => {
    // So executar se os parametros realmente mudaram
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
