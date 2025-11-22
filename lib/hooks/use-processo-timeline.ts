/**
 * Hook para gerenciar consulta e captura de timeline de processo
 *
 * Este hook encapsula a lógica de:
 * 1. Buscar dados do processo (acervo)
 * 2. Verificar se timeline existe no MongoDB
 * 3. Acionar captura automática se necessário
 * 4. Polling durante a captura
 * 5. Gerenciar estados de loading e erro
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Acervo } from '@/backend/types/acervo/types';
import type { TimelineDocument } from '@/backend/types/mongodb/timeline';

interface ProcessoTimelineData {
  acervo: Acervo;
  timeline: TimelineDocument | null;
}

interface UseProcessoTimelineReturn {
  /** Dados do processo */
  processo: Acervo | null;
  /** Timeline do processo (se existir) */
  timeline: TimelineDocument | null;
  /** Carregando dados iniciais */
  isLoading: boolean;
  /** Capturando timeline no PJE */
  isCapturing: boolean;
  /** Erro ocorrido */
  error: Error | null;
  /** Re-buscar timeline */
  refetch: () => Promise<void>;
}

const POLLING_INTERVAL = 5000; // 5 segundos
const MAX_POLLING_ATTEMPTS = 120; // 10 minutos (120 * 5s)

export function useProcessoTimeline(id: number): UseProcessoTimelineReturn {
  const [processo, setProcesso] = useState<Acervo | null>(null);
  const [timeline, setTimeline] = useState<TimelineDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);

  /**
   * Buscar processo e timeline
   */
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch(`/api/acervo/${id}/timeline`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar dados do processo');
      }

      const data = result.data as ProcessoTimelineData;
      setProcesso(data.acervo);
      setTimeline(data.timeline);

      return data;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(errorObj);
      throw errorObj;
    }
  }, [id]);

  /**
   * Acionar captura de timeline
   */
  const captureTimeline = useCallback(async () => {
    if (!processo) return;

    try {
      setIsCapturing(true);
      setError(null);

      console.log('[useProcessoTimeline] Iniciando captura de timeline', {
        processoId: processo.id,
        numeroProcesso: processo.numero_processo,
      });

      const response = await fetch('/api/captura/trt/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processo_id: processo.id,
          trt: processo.trt,
          grau: processo.grau,
          id_pje: processo.id_pje,
          advogado_id: processo.advogado_id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao iniciar captura da timeline');
      }

      console.log('[useProcessoTimeline] Captura iniciada com sucesso');

      // Resetar contador de polling
      setPollingAttempts(0);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Erro ao capturar timeline');
      setError(errorObj);
      setIsCapturing(false);
      throw errorObj;
    }
  }, [processo]);

  /**
   * Polling para verificar se timeline foi capturada
   */
  const pollTimeline = useCallback(async () => {
    if (!isCapturing) return;

    try {
      const data = await fetchData();

      // Se timeline foi capturada, parar polling
      if (data.timeline) {
        console.log('[useProcessoTimeline] Timeline capturada com sucesso!');
        setIsCapturing(false);
        setPollingAttempts(0);
        return;
      }

      // Incrementar tentativas
      setPollingAttempts((prev) => prev + 1);

      // Verificar limite de tentativas
      if (pollingAttempts >= MAX_POLLING_ATTEMPTS) {
        throw new Error(
          'Timeout: A captura da timeline está demorando mais que o esperado. ' +
          'Por favor, tente novamente mais tarde.'
        );
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Erro no polling');
      setError(errorObj);
      setIsCapturing(false);
      setPollingAttempts(0);
    }
  }, [isCapturing, fetchData, pollingAttempts]);

  /**
   * Re-buscar dados (útil após erro)
   */
  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchData();
    } finally {
      setIsLoading(false);
    }
  }, [fetchData]);

  /**
   * Efeito: Carregar dados iniciais
   */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await fetchData();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchData]);

  /**
   * Efeito: Verificar se precisa capturar timeline
   */
  useEffect(() => {
    if (isLoading || isCapturing || error) return;
    if (!processo) return;
    if (timeline !== null) return; // Timeline já existe

    // Timeline não existe, iniciar captura
    console.log('[useProcessoTimeline] Timeline não encontrada, iniciando captura automática');
    captureTimeline();
  }, [processo, timeline, isLoading, isCapturing, error, captureTimeline]);

  /**
   * Efeito: Polling durante captura
   */
  useEffect(() => {
    if (!isCapturing) return;

    const intervalId = setInterval(() => {
      pollTimeline();
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [isCapturing, pollTimeline]);

  return {
    processo,
    timeline,
    isLoading,
    isCapturing,
    error,
    refetch,
  };
}
