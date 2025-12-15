'use client';

/**
 * Hook para buscar audiências
 */

import { useState, useEffect, useCallback } from 'react';
import type { Audiencia } from '@/features/audiencias';
import type {
  BuscarAudienciasParams,
  UseAudienciasResult,
  UseAudienciasOptions,
} from '../types';
import { actionListarAudiencias } from '../actions';

/**
 * Hook para buscar audiências com filtros e paginação
 */
export const useAudiencias = (
  params: BuscarAudienciasParams = {},
  options: UseAudienciasOptions = {}
): UseAudienciasResult => {
  const { enabled = true } = options;
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [paginacao, setPaginacao] = useState<UseAudienciasResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarAudiencias = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Construir query string
      const result = await actionListarAudiencias({
        pagina: params.pagina,
        limite: params.limite,
        busca: params.busca,
        trt: params.trt,
        grau: params.grau,
        responsavelId: params.responsavel_id,
        status: params.status,
        modalidade: params.modalidade,
        tipoAudienciaId: undefined,
        dataInicioInicio: params.data_inicio_inicio,
        dataInicioFim: params.data_inicio_fim,
        dataFimInicio: params.data_fim_inicio,
        dataFimFim: params.data_fim_fim,
        ordenarPor: params.ordenar_por,
        ordem: params.ordem,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar audiências');
      }

      const payload = result.data;
      setAudiencias(payload.data);
      setPaginacao({
        pagina: payload.pagination.page,
        limite: payload.pagination.limit,
        total: payload.pagination.total,
        totalPaginas: payload.pagination.totalPages,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar audiências';
      setError(errorMessage);
      setAudiencias([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [params, enabled]);

  useEffect(() => {
    buscarAudiencias();
  }, [buscarAudiencias]);

  return {
    audiencias,
    paginacao,
    isLoading,
    error,
    refetch: buscarAudiencias,
  };
};
