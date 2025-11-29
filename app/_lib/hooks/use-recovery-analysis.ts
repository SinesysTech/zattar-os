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
  modo?: 'partes' | 'generico';
}

/** Elemento individual retornado pela API */
export interface ElementoApi {
  tipo: string;
  identificador: string;
  nome: string;
  dadosBrutos: Record<string, unknown>;
  statusPersistencia: 'existente' | 'faltando' | 'pendente' | 'erro';
  contexto?: {
    entidadeId?: number;
    entidadeTipo?: string;
    enderecoId?: number;
    numeroProcesso?: string;
    classeJudicial?: string;
    prazoVencido?: boolean;
    dataInicio?: string;
    tipo?: string;
    processo?: string;
  };
  erro?: string;
}

/** Resultado no modo "partes" (legado) */
export interface ElementosResultPartes {
  partes: ElementoApi[];
  enderecos: ElementoApi[];
  representantes: ElementoApi[];
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

/** Resultado no modo "generico" */
export interface ElementosResultGenerico {
  elementos: ElementoApi[];
  totais: {
    total: number;
    existentes: number;
    faltantes: number;
    filtrados: number;
  };
}

interface LogInfo {
  mongoId: string;
  capturaLogId: number;
  tipoCaptura: string;
  status: string;
  trt: string;
  grau: string;
  advogadoId?: number;
  criadoEm: string | Date;
  erro?: string | null;
}

interface UseRecoveryElementosResult {
  log: LogInfo | null;
  payloadDisponivel: boolean;
  /** Elementos no modo "partes" (legado) - compatibilidade */
  elementos: ElementosResultPartes | null;
  /** Elementos no modo "generico" */
  elementosGenericos: ElementosResultGenerico | null;
  suportaRepersistencia: boolean;
  mensagem?: string;
  filtroAplicado: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useRecoveryElementos = (
  params: UseRecoveryElementosParams
): UseRecoveryElementosResult => {
  const [log, setLog] = useState<LogInfo | null>(null);
  const [payloadDisponivel, setPayloadDisponivel] = useState(false);
  const [elementos, setElementos] = useState<ElementosResultPartes | null>(null);
  const [elementosGenericos, setElementosGenericos] = useState<ElementosResultGenerico | null>(null);
  const [suportaRepersistencia, setSuportaRepersistencia] = useState(false);
  const [mensagem, setMensagem] = useState<string | undefined>(undefined);
  const [filtroAplicado, setFiltroAplicado] = useState('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarElementos = useCallback(async () => {
    if (!params.mongoId) {
      setLog(null);
      setPayloadDisponivel(false);
      setElementos(null);
      setElementosGenericos(null);
      setSuportaRepersistencia(false);
      setMensagem(undefined);
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
      // Default to generico mode
      searchParams.set('modo', params.modo || 'generico');

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
      setSuportaRepersistencia(data.data.suportaRepersistencia ?? false);
      setMensagem(data.data.mensagem);
      setFiltroAplicado(data.data.filtroAplicado || 'todos');

      // Modo genérico
      if (params.modo === 'generico' || !params.modo) {
        if (Array.isArray(data.data.elementos)) {
          setElementosGenericos({
            elementos: data.data.elementos,
            totais: data.data.totais,
          });
          // Converter para formato de partes para compatibilidade
          const elems = data.data.elementos as ElementoApi[];
          setElementos({
            partes: elems.filter((e) => e.tipo === 'parte'),
            enderecos: elems.filter((e) => e.tipo === 'endereco'),
            representantes: elems.filter((e) => e.tipo === 'representante'),
            totais: {
              partes: elems.filter((e) => e.tipo === 'parte').length,
              partesExistentes: elems.filter((e) => e.tipo === 'parte' && e.statusPersistencia === 'existente').length,
              partesFaltantes: elems.filter((e) => e.tipo === 'parte' && e.statusPersistencia === 'faltando').length,
              enderecos: elems.filter((e) => e.tipo === 'endereco').length,
              enderecosExistentes: elems.filter((e) => e.tipo === 'endereco' && e.statusPersistencia === 'existente').length,
              enderecosFaltantes: elems.filter((e) => e.tipo === 'endereco' && e.statusPersistencia === 'faltando').length,
              representantes: elems.filter((e) => e.tipo === 'representante').length,
              representantesExistentes: elems.filter((e) => e.tipo === 'representante' && e.statusPersistencia === 'existente').length,
              representantesFaltantes: elems.filter((e) => e.tipo === 'representante' && e.statusPersistencia === 'faltando').length,
            },
          });
        } else {
          setElementosGenericos(null);
          setElementos(null);
        }
      } else {
        // Modo partes (legado)
        setElementos(data.data.elementos);
        setElementosGenericos(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar elementos';
      setError(errorMessage);
      setLog(null);
      setPayloadDisponivel(false);
      setElementos(null);
      setElementosGenericos(null);
      setSuportaRepersistencia(false);
      setMensagem(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [params.mongoId, params.filtro, params.modo]);

  useEffect(() => {
    buscarElementos();
  }, [buscarElementos]);

  return {
    log,
    payloadDisponivel,
    elementos,
    elementosGenericos,
    suportaRepersistencia,
    mensagem,
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

