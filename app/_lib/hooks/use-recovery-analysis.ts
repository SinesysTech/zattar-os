'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  AnaliseCaptura,
  ReprocessarResult,
  TipoEntidadeRecuperavel,
} from '@/backend/captura/services/recovery/types';

interface RecoveryAnalysisApiResponse {
  success: boolean;
  data: {
    log: {
      mongoId: string;
      capturaLogId: number;
      tipoCaptura: string;
      status: string;
      trt: string;
      grau: string;
      advogadoId: number;
      criadoEm: string;
      erro?: string | null;
      requisicao?: Record<string, unknown>;
      resultadoProcessado?: Record<string, unknown>;
    };
    payloadDisponivel: boolean;
    analise?: {
      processo: AnaliseCaptura['processo'];
      totais: AnaliseCaptura['totais'];
      gaps: AnaliseCaptura['gaps'];
      payloadDisponivel: boolean;
      erroOriginal?: string | null;
    };
    payloadBruto?: unknown;
  };
}

interface UseRecoveryAnalysisParams {
  mongoId: string | null;
  analisarGaps?: boolean;
  incluirPayload?: boolean;
}

interface UseRecoveryAnalysisResult {
  log: RecoveryAnalysisApiResponse['data']['log'] | null;
  analise: RecoveryAnalysisApiResponse['data']['analise'] | null;
  payloadDisponivel: boolean;
  payloadBruto: unknown | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar análise de recovery de um log específico
 */
export const useRecoveryAnalysis = (
  params: UseRecoveryAnalysisParams
): UseRecoveryAnalysisResult => {
  const [log, setLog] = useState<RecoveryAnalysisApiResponse['data']['log'] | null>(null);
  const [analise, setAnalise] = useState<RecoveryAnalysisApiResponse['data']['analise'] | null>(null);
  const [payloadDisponivel, setPayloadDisponivel] = useState(false);
  const [payloadBruto, setPayloadBruto] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarAnalise = useCallback(async () => {
    if (!params.mongoId) {
      setLog(null);
      setAnalise(null);
      setPayloadDisponivel(false);
      setPayloadBruto(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();

      if (params.analisarGaps !== false) {
        searchParams.set('analisar_gaps', 'true');
      }
      if (params.incluirPayload) {
        searchParams.set('incluir_payload', 'true');
      }

      const response = await fetch(
        `/api/captura/recovery/${params.mongoId}?${searchParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Erro desconhecido' } }));
        throw new Error(errorData.error?.message || `Erro ${response.status}`);
      }

      const data: RecoveryAnalysisApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setLog(data.data.log);
      setAnalise(data.data.analise || null);
      setPayloadDisponivel(data.data.payloadDisponivel);
      setPayloadBruto(data.data.payloadBruto || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar análise de recovery';
      setError(errorMessage);
      setLog(null);
      setAnalise(null);
      setPayloadDisponivel(false);
      setPayloadBruto(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.mongoId, params.analisarGaps, params.incluirPayload]);

  useEffect(() => {
    buscarAnalise();
  }, [buscarAnalise]);

  return {
    log,
    analise,
    payloadDisponivel,
    payloadBruto,
    isLoading,
    error,
    refetch: buscarAnalise,
  };
};

// ============================================================================
// Hook para re-processamento
// ============================================================================

interface UseReprocessParams {
  onSuccess?: (result: ReprocessarResult) => void;
  onError?: (error: string) => void;
}

interface UseReprocessResult {
  reprocessar: (params: {
    mongoIds?: string[];
    capturaLogId?: number;
    tiposElementos?: TipoEntidadeRecuperavel[];
    filtros?: {
      apenasGaps?: boolean;
      forcarAtualizacao?: boolean;
    };
  }) => Promise<ReprocessarResult | null>;
  isProcessing: boolean;
  resultado: ReprocessarResult | null;
  error: string | null;
  reset: () => void;
}

/**
 * Hook para buscar todos os elementos de um log MongoDB
 */
export interface UseRecoveryElementosParams {
  mongoId: string | null;
  filtro?: 'todos' | 'faltantes' | 'existentes';
}

export interface ElementosResult {
  partes: Array<{
    tipo: string;
    identificador: string;
    nome: string;
    dadosBrutos: Record<string, unknown>;
    statusPersistencia: 'existente' | 'faltando' | 'pendente' | 'erro';
    contexto?: {
      entidadeId?: number;
      entidadeTipo?: string;
      enderecoId?: number;
    };
    erro?: string;
  }>;
  enderecos: Array<{
    tipo: string;
    identificador: string;
    nome: string;
    dadosBrutos: Record<string, unknown>;
    statusPersistencia: 'existente' | 'faltando' | 'pendente' | 'erro';
    contexto?: {
      entidadeId?: number;
      entidadeTipo?: string;
      enderecoId?: number;
    };
    erro?: string;
  }>;
  representantes: Array<{
    tipo: string;
    identificador: string;
    nome: string;
    dadosBrutos: Record<string, unknown>;
    statusPersistencia: 'existente' | 'faltando' | 'pendente' | 'erro';
    contexto?: {
      entidadeId?: number;
      entidadeTipo?: string;
    };
    erro?: string;
  }>;
  totais: {
    partes: number;
    partesExistentes: number;
    partesFaltantes: number;
    enderecos: number;
    enderecosExistentes: number;
    enderecosFaltantes: number;
    representantes: number;
    representantesExistentes: number;
    representantesFaltantes: number;
  };
}

interface UseRecoveryElementosResult {
  log: {
    mongoId: string;
    capturaLogId: number;
    tipoCaptura: string;
    status: string;
    trt: string;
    grau: string;
    advogadoId?: number;
    criadoEm: string | Date;
    erro?: string | null;
  } | null;
  payloadDisponivel: boolean;
  elementos: ElementosResult | null;
  filtroAplicado: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useRecoveryElementos = (
  params: UseRecoveryElementosParams
): UseRecoveryElementosResult => {
  const [log, setLog] = useState<UseRecoveryElementosResult['log']>(null);
  const [payloadDisponivel, setPayloadDisponivel] = useState(false);
  const [elementos, setElementos] = useState<ElementosResult | null>(null);
  const [filtroAplicado, setFiltroAplicado] = useState('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarElementos = useCallback(async () => {
    if (!params.mongoId) {
      setLog(null);
      setPayloadDisponivel(false);
      setElementos(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (params.filtro) {
        searchParams.set('filtro', params.filtro);
      }

      const response = await fetch(
        `/api/captura/recovery/${params.mongoId}/elementos?${searchParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Erro desconhecido' } }));
        throw new Error(errorData.error?.message || `Erro ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setLog(data.data.log);
      setPayloadDisponivel(data.data.payloadDisponivel);
      setElementos(data.data.elementos);
      setFiltroAplicado(data.data.filtroAplicado || 'todos');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar elementos';
      setError(errorMessage);
      setLog(null);
      setPayloadDisponivel(false);
      setElementos(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.mongoId, params.filtro]);

  useEffect(() => {
    buscarElementos();
  }, [buscarElementos]);

  return {
    log,
    payloadDisponivel,
    elementos,
    filtroAplicado,
    isLoading,
    error,
    refetch: buscarElementos,
  };
};

/**
 * Hook para re-processar elementos de recovery
 */
export const useReprocess = (params: UseReprocessParams = {}): UseReprocessResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultado, setResultado] = useState<ReprocessarResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reprocessar = useCallback(
    async (reprocessParams: {
      mongoIds?: string[];
      capturaLogId?: number;
      tiposElementos?: TipoEntidadeRecuperavel[];
      filtros?: {
        apenasGaps?: boolean;
        forcarAtualizacao?: boolean;
      };
    }): Promise<ReprocessarResult | null> => {
      setIsProcessing(true);
      setError(null);
      setResultado(null);

      try {
        const response = await fetch('/api/captura/recovery/reprocess', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reprocessParams),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: 'Erro desconhecido' } }));
          throw new Error(errorData.error?.message || `Erro ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error('Resposta da API indicou falha');
        }

        const result = data.data as ReprocessarResult;
        setResultado(result);
        params.onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao re-processar elementos';
        setError(errorMessage);
        params.onError?.(errorMessage);
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [params]
  );

  const reset = useCallback(() => {
    setResultado(null);
    setError(null);
  }, []);

  return {
    reprocessar,
    isProcessing,
    resultado,
    error,
    reset,
  };
};

