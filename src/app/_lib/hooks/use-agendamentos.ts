'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Agendamento, ListarAgendamentosParams } from '@/backend/types/captura/agendamentos-types';
import type { Paginacao } from '@/backend/types/global';

interface AgendamentosApiResponse {
  success: boolean;
  data?: {
    agendamentos: Agendamento[];
    paginacao: Paginacao;
  };
  error?: string;
}

interface UseAgendamentosResult {
  agendamentos: Agendamento[];
  paginacao: Paginacao | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar agendamentos de captura
 */
export const useAgendamentos = (
  params: ListarAgendamentosParams = {}
): UseAgendamentosResult => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarAgendamentos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (params.pagina) searchParams.set('pagina', params.pagina.toString());
      if (params.limite) searchParams.set('limite', params.limite.toString());
      if (params.advogado_id) searchParams.set('advogado_id', params.advogado_id.toString());
      if (params.tipo_captura) searchParams.set('tipo_captura', params.tipo_captura);
      if (params.ativo !== undefined) searchParams.set('ativo', params.ativo.toString());
      if (params.proxima_execucao_min) searchParams.set('proxima_execucao_min', params.proxima_execucao_min);
      if (params.proxima_execucao_max) searchParams.set('proxima_execucao_max', params.proxima_execucao_max);
      if (params.ordenar_por) searchParams.set('ordenar_por', params.ordenar_por);
      if (params.ordem) searchParams.set('ordem', params.ordem);

      const response = await fetch(`/api/captura/agendamentos?${searchParams.toString()}`);
      const data: AgendamentosApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Erro ${response.status}: ${response.statusText}`);
      }

      setAgendamentos(data.data?.agendamentos || []);
      setPaginacao(data.data?.paginacao || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar agendamentos';
      setError(errorMessage);
      setAgendamentos([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.pagina,
    params.limite,
    params.advogado_id,
    params.tipo_captura,
    params.ativo,
    params.proxima_execucao_min,
    params.proxima_execucao_max,
    params.ordenar_por,
    params.ordem,
  ]);

  useEffect(() => {
    buscarAgendamentos();
  }, [buscarAgendamentos]);

  return {
    agendamentos,
    paginacao,
    isLoading,
    error,
    refetch: buscarAgendamentos,
  };
};

