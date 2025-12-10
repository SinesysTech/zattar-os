'use client';

// Hook para buscar terceiros

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Terceiro } from '@/core/app/_lib/types';

export interface TerceirosApiResponse {
  success: boolean;
  data: {
    terceiros: Terceiro[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

export interface BuscarTerceirosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  tipo_pessoa?: 'pf' | 'pj';
  tipo_parte?: string;
  polo?: string;
  situacao?: 'A' | 'I';
  incluirEndereco?: boolean;
  incluirProcessos?: boolean;
}

interface UseTerceirosResult {
  terceiros: Terceiro[];
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
 * Hook para buscar terceiros
 */
export const useTerceiros = (params: BuscarTerceirosParams = {}): UseTerceirosResult => {
  const [terceiros, setTerceiros] = useState<Terceiro[]>([]);
  const [paginacao, setPaginacao] = useState<UseTerceirosResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const tipo_pessoa = params.tipo_pessoa || '';
  const tipo_parte = params.tipo_parte || '';
  const polo = params.polo || '';
  const situacao = params.situacao || '';
  const incluirEndereco = params.incluirEndereco ?? false;
  const incluirProcessos = params.incluirProcessos ?? false;

  // Normalizar parâmetros para comparação estável
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      tipo_pessoa,
      tipo_parte,
      polo,
      situacao,
      incluirEndereco,
      incluirProcessos,
    });
  }, [pagina, limite, busca, tipo_pessoa, tipo_parte, polo, situacao, incluirEndereco, incluirProcessos]);

  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>('');

  const buscarTerceiros = useCallback(async () => {
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
      if (tipo_parte) {
        searchParams.set('tipo_parte', tipo_parte);
      }
      if (polo) {
        searchParams.set('polo', polo);
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

      const response = await fetch(`/api/terceiros?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: TerceirosApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setTerceiros(data.data.terceiros);
      setPaginacao({
        pagina: data.data.pagina,
        limite: data.data.limite,
        total: data.data.total,
        totalPaginas: data.data.totalPaginas,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar terceiros';
      setError(errorMessage);
      setTerceiros([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, busca, tipo_pessoa, tipo_parte, polo, situacao, incluirEndereco, incluirProcessos]);

  useEffect(() => {
    // Só executar se os parâmetros realmente mudaram
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      buscarTerceiros();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return {
    terceiros,
    paginacao,
    isLoading,
    error,
    refetch: buscarTerceiros,
  };
};
