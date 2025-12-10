'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  ListarLogsRecoveryResult,
  LogRecoverySumario,
} from '@/backend/captura/services/recovery/types';

interface RecoveryLogsApiResponse {
  success: boolean;
  data: ListarLogsRecoveryResult;
  estatisticas?: {
    contadores: { success: number; error: number; total: number };
    porTrt: Array<{ trt: string; total: number; success: number; error: number }>;
    gaps: {
      totalLogs: number;
      logsComGaps: number;
      resumoGaps: { enderecos: number; partes: number; representantes: number };
    };
  };
}

interface UseRecoveryLogsParams {
  capturaLogId?: number;
  tipoCaptura?: string;
  status?: 'success' | 'error';
  trt?: string;
  grau?: string;
  advogadoId?: number;
  dataInicio?: string;
  dataFim?: string;
  pagina?: number;
  limite?: number;
  incluirEstatisticas?: boolean;
}

interface UseRecoveryLogsResult {
  logs: LogRecoverySumario[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  estatisticas: RecoveryLogsApiResponse['estatisticas'] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar logs de recovery do MongoDB
 */
export const useRecoveryLogs = (
  params: UseRecoveryLogsParams = {}
): UseRecoveryLogsResult => {
  const [logs, setLogs] = useState<LogRecoverySumario[]>([]);
  const [paginacao, setPaginacao] = useState<UseRecoveryLogsResult['paginacao']>(null);
  const [estatisticas, setEstatisticas] = useState<RecoveryLogsApiResponse['estatisticas'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();

      if (params.capturaLogId !== undefined) {
        searchParams.set('captura_log_id', params.capturaLogId.toString());
      }
      if (params.tipoCaptura) {
        searchParams.set('tipo_captura', params.tipoCaptura);
      }
      if (params.status) {
        searchParams.set('status', params.status);
      }
      if (params.trt) {
        searchParams.set('trt', params.trt);
      }
      if (params.grau) {
        searchParams.set('grau', params.grau);
      }
      if (params.advogadoId !== undefined) {
        searchParams.set('advogado_id', params.advogadoId.toString());
      }
      if (params.dataInicio) {
        searchParams.set('data_inicio', params.dataInicio);
      }
      if (params.dataFim) {
        searchParams.set('data_fim', params.dataFim);
      }
      if (params.pagina !== undefined) {
        searchParams.set('pagina', params.pagina.toString());
      }
      if (params.limite !== undefined) {
        searchParams.set('limite', params.limite.toString());
      }
      if (params.incluirEstatisticas) {
        searchParams.set('incluir_estatisticas', 'true');
      }

      const response = await fetch(`/api/captura/recovery?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Erro desconhecido' } }));
        throw new Error(errorData.error?.message || `Erro ${response.status}`);
      }

      const data: RecoveryLogsApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setLogs(data.data.logs);
      setPaginacao({
        pagina: data.data.pagina,
        limite: data.data.limite,
        total: data.data.total,
        totalPaginas: data.data.totalPaginas,
      });
      setEstatisticas(data.estatisticas || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar logs de recovery';
      setError(errorMessage);
      setLogs([]);
      setPaginacao(null);
      setEstatisticas(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.capturaLogId,
    params.tipoCaptura,
    params.status,
    params.trt,
    params.grau,
    params.advogadoId,
    params.dataInicio,
    params.dataFim,
    params.pagina,
    params.limite,
    params.incluirEstatisticas,
  ]);

  useEffect(() => {
    buscarLogs();
  }, [buscarLogs]);

  return {
    logs,
    paginacao,
    estatisticas,
    isLoading,
    error,
    refetch: buscarLogs,
  };
};

