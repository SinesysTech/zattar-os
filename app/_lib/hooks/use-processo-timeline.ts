/**
 * Hook para gerenciar visualização e captura de timeline de processo
 *
 * Encapsula a lógica de:
 * - Verificação de timeline existente
 * - Captura automática se necessário
 * - Polling durante captura
 * - Tratamento de erros
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Acervo } from '@/backend/types/acervo/types';
import type {
  TimelineDocument,
  TimelineAPIResponse,
  CapturaTimelineAPIResponse,
} from '@/lib/types/timeline';

interface UseProcessoTimelineReturn {
  processo: Acervo | null;
  timeline: TimelineDocument | null;
  isLoading: boolean;
  isCapturing: boolean;
  error: Error | null;
  captureProgress: string; // Mensagem de progresso contextual
  refetch: () => Promise<void>;
}

const MAX_POLLING_ATTEMPTS = 60; // 60 tentativas * 5s = 5 minutos
const POLLING_INTERVAL = 5000; // 5 segundos

/**
 * Hook para buscar e gerenciar timeline de um processo
 * @param acervoId - ID do processo no acervo
 */
export function useProcessoTimeline(acervoId: number): UseProcessoTimelineReturn {
  const [processo, setProcesso] = useState<Acervo | null>(null);
  const [timeline, setTimeline] = useState<TimelineDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [captureProgress, setCaptureProgress] = useState('');

  const pollingAttempts = useRef(0);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const captureStartTime = useRef<number>(0);

  /**
   * Atualiza mensagem de progresso baseada no tempo decorrido
   */
  const updateCaptureProgress = useCallback(() => {
    const elapsed = Date.now() - captureStartTime.current;
    const seconds = Math.floor(elapsed / 1000);

    if (seconds < 10) {
      setCaptureProgress('Iniciando captura da timeline...');
    } else if (seconds < 60) {
      setCaptureProgress(
        'Capturando movimentos e documentos do PJE... (isso pode levar alguns minutos)'
      );
    } else if (seconds < 120) {
      setCaptureProgress('Baixando documentos e enviando para Google Drive...');
    } else {
      setCaptureProgress('Processando documentos... Quase pronto!');
    }
  }, []);

  /**
   * Limpa polling interval
   */
  const clearPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    pollingAttempts.current = 0;
  }, []);

  /**
   * Busca dados do processo
   */
  const fetchProcesso = useCallback(async (): Promise<Acervo | null> => {
    try {
      const response = await fetch(`/api/acervo/${acervoId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Processo não encontrado');
        }
        throw new Error('Erro ao carregar processo');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao carregar processo');
      }

      return data.data as Acervo;
    } catch (err) {
      console.error('Erro ao buscar processo:', err);
      throw err;
    }
  }, [acervoId]);

  /**
   * Busca timeline do processo
   */
  const fetchTimeline = useCallback(async (): Promise<TimelineDocument | null> => {
    try {
      const response = await fetch(`/api/acervo/${acervoId}/timeline`);

      if (!response.ok) {
        throw new Error('Erro ao carregar timeline');
      }

      const data: TimelineAPIResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erro ao carregar timeline');
      }

      return data.data.timeline;
    } catch (err) {
      console.error('Erro ao buscar timeline:', err);
      throw err;
    }
  }, [acervoId]);

  /**
   * Inicia captura de timeline no PJE
   */
  const captureTimeline = useCallback(
    async (processoData: Acervo): Promise<void> => {
      if (!processoData.advogado_id) {
        throw new Error(
          'Não é possível capturar timeline: advogado não configurado para este processo'
        );
      }

      try {
        setIsCapturing(true);
        captureStartTime.current = Date.now();
        updateCaptureProgress();

        // Atualizar mensagem de progresso periodicamente
        const progressInterval = setInterval(updateCaptureProgress, 5000);

        const response = await fetch('/api/captura/trt/timeline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trtCodigo: processoData.trt,
            grau: processoData.grau,
            processoId: processoData.id_pje.toString(),
            advogadoId: processoData.advogado_id,
            baixarDocumentos: true,
            filtroDocumentos: {
              apenasAssinados: true,
              apenasNaoSigilosos: true,
            },
          }),
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              'Erro de autenticação no PJE. Verifique as credenciais do advogado.'
            );
          }
          throw new Error('Erro ao capturar timeline');
        }

        const data: CapturaTimelineAPIResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Erro ao capturar timeline');
        }

        // Inicia polling para aguardar salvar no MongoDB
        startPolling();
      } catch (err) {
        console.error('Erro ao capturar timeline:', err);
        setIsCapturing(false);
        throw err;
      }
    },
    [updateCaptureProgress]
  );

  /**
   * Inicia polling para verificar se timeline foi salva
   */
  const startPolling = useCallback(() => {
    pollingAttempts.current = 0;
    setCaptureProgress('Salvando timeline no banco de dados...');

    // Aguarda 10 segundos iniciais antes de começar polling
    setTimeout(() => {
      pollingInterval.current = setInterval(async () => {
        pollingAttempts.current += 1;

        try {
          const timelineData = await fetchTimeline();

          if (timelineData !== null) {
            // Timeline foi salva com sucesso
            setTimeline(timelineData);
            setIsCapturing(false);
            clearPolling();
            setCaptureProgress('');
          } else if (pollingAttempts.current >= MAX_POLLING_ATTEMPTS) {
            // Timeout: máximo de tentativas atingido
            clearPolling();
            setIsCapturing(false);
            throw new Error(
              'Timeout na captura. A operação pode estar em andamento. Recarregue a página em alguns minutos.'
            );
          }
        } catch (err) {
          clearPolling();
          setIsCapturing(false);
          setError(err as Error);
        }
      }, POLLING_INTERVAL);
    }, 10000); // 10 segundos de delay inicial
  }, [fetchTimeline, clearPolling]);

  /**
   * Re-busca dados (retry)
   */
  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const processoData = await fetchProcesso();
      setProcesso(processoData);

      if (processoData) {
        const timelineData = await fetchTimeline();
        setTimeline(timelineData);

        // Se timeline não existe e não está capturando, inicia captura
        if (timelineData === null && !isCapturing) {
          await captureTimeline(processoData);
        }
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchProcesso, fetchTimeline, captureTimeline, isCapturing]);

  /**
   * Efeito principal: carrega dados iniciais
   */
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Busca dados do processo
        const processoData = await fetchProcesso();
        if (!mounted) return;
        setProcesso(processoData);

        if (!processoData) {
          return;
        }

        // 2. Busca timeline existente
        const timelineData = await fetchTimeline();
        if (!mounted) return;
        setTimeline(timelineData);

        // 3. Se timeline não existe, inicia captura automaticamente
        if (timelineData === null && !isCapturing) {
          await captureTimeline(processoData);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
      clearPolling();
    };
  }, [acervoId]); // Apenas acervoId como dependência

  return {
    processo,
    timeline,
    isLoading,
    isCapturing,
    error,
    captureProgress,
    refetch,
  };
}
