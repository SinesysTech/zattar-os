'use client';

/**
 * Hook para buscar partes contrarias
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ParteContraria } from '@/core/partes';
import type {
  BuscarPartesContrariasParams,
  PartesContrariasApiResponse,
  PaginationInfo,
} from '../types';

interface UsePartesContrariasResult {
  partesContrarias: ParteContraria[];
  paginacao: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar partes contrarias
 */
export const usePartesContrarias = (
  params: BuscarPartesContrariasParams = {}
): UsePartesContrariasResult => {
  const [partesContrarias, setPartesContrarias] = useState<ParteContraria[]>([]);
  const [paginacao, setPaginacao] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const tipo_pessoa = params.tipo_pessoa || '';
  const situacao = params.situacao || '';
  const incluirEndereco = params.incluirEndereco ?? false;
  const incluirProcessos = params.incluirProcessos ?? false;

  // Normalizar parametros para comparacao estavel
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      tipo_pessoa,
      situacao,
      incluirEndereco,
      incluirProcessos,
    });
  }, [pagina, limite, busca, tipo_pessoa, situacao, incluirEndereco, incluirProcessos]);

  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>('');

  const buscarPartesContrarias = useCallback(async () => {
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
      if (tipo_pessoa) {
        searchParams.set('tipo_pessoa', tipo_pessoa);
      }
      if (situacao) {
        searchParams.set('situacao', situacao);
      }
      if (incluirEndereco) {
        searchParams.set('incluir_endereco', 'true');
      }
      if (incluirProcessos) {
        searchParams.set('incluir_processos', 'true');
      }

      const response = await fetch(`/api/partes-contrarias?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: PartesContrariasApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setPartesContrarias(data.data.partesContrarias);
      setPaginacao({
        pagina: data.data.pagina,
        limite: data.data.limite,
        total: data.data.total,
        totalPaginas: data.data.totalPaginas,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar partes contrarias';
      setError(errorMessage);
      setPartesContrarias([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, busca, tipo_pessoa, situacao, incluirEndereco, incluirProcessos]);

  useEffect(() => {
    // So executar se os parametros realmente mudaram
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      buscarPartesContrarias();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return {
    partesContrarias,
    paginacao,
    isLoading,
    error,
    refetch: buscarPartesContrarias,
  };
};
