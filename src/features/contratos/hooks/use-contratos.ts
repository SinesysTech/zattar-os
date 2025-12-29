'use client';

/**
 * CONTRATOS FEATURE - Hooks
 *
 * Hooks customizados para gerenciamento de contratos no frontend.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Contrato } from '../domain';
import type { BuscarContratosParams } from '../types';
import { actionListarContratos } from '../actions';

// =============================================================================
// TYPES
// =============================================================================

interface UseContratosResult {
  /** Lista de contratos carregados */
  contratos: Contrato[];
  /** Informações de paginação */
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  /** Indica se está carregando dados */
  isLoading: boolean;
  /** Mensagem de erro, se houver */
  error: string | null;
  /** Função para recarregar os dados */
  refetch: () => Promise<void>;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook para buscar e gerenciar lista de contratos
 *
 * @param params - Parâmetros de busca (paginação, filtros)
 * @returns Objeto com contratos, paginação, estado de loading, erro e função de refetch
 *
 * @example
 * ```typescript
 * const { contratos, paginacao, isLoading, error, refetch } = useContratos({
 *   pagina: 1,
 *   limite: 10,
 *   status: 'contratado',
 * });
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error} />;
 *
 * return <ContratosList contratos={contratos} />;
 * ```
 */
export const useContratos = (params: BuscarContratosParams = {}): UseContratosResult => {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [paginacao, setPaginacao] = useState<UseContratosResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarContratos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarContratos({
        pagina: params.pagina,
        limite: params.limite,
        busca: params.busca,
        tipoContrato: params.tipoContrato,
        status: params.status,
        clienteId: params.clienteId,
        // parteContrariaId remove: não suportado no filtro atual
        responsavelId: params.responsavelId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar contratos');
      }

      const payload = result.data as { data: Contrato[]; pagination: { page: number; limit: number; total: number; totalPages: number } };

      setContratos(payload.data);
      setPaginacao({
        pagina: payload.pagination.page,
        limite: payload.pagination.limit,
        total: payload.pagination.total,
        totalPaginas: payload.pagination.totalPages,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar contratos';
      setError(errorMessage);
      setContratos([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.pagina, params.limite, params.busca, params.tipoContrato, params.status, params.clienteId, params.parteContrariaId, params.responsavelId]);

  useEffect(() => {
    buscarContratos();
  }, [buscarContratos]);

  return {
    contratos,
    paginacao,
    isLoading,
    error,
    refetch: buscarContratos,
  };
};
