'use client';

// Hook para buscar assistentes do sistema

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { AssistentesParams, Assistente } from '@/app/_lib/types/assistentes';

interface UseAssistentesResult {
  assistentes: Assistente[];
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

interface AssistentesApiResponse {
  success: boolean;
  data?: {
    assistentes: Assistente[];
    paginacao: {
      total: number;
      pagina: number;
      limite: number;
      totalPaginas: number;
    };
  };
  error?: string;
}

/**
 * Hook para buscar assistentes do sistema com paginação e filtros
 */
export const useAssistentes = (params: AssistentesParams = {}): UseAssistentesResult => {
  const [assistentes, setAssistentes] = useState<Assistente[]>([]);
  const [paginacao, setPaginacao] = useState<UseAssistentesResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const ativo = params.ativo;
  
  // Normalizar parâmetros para comparação estável
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      ativo,
    });
  }, [pagina, limite, busca, ativo]);
  
  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>('');

  const buscarAssistentes = useCallback(async () => {
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
      if (ativo !== undefined) {
        searchParams.set('ativo', ativo.toString());
      }

      const response = await fetch(`/api/assistentes?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro desconhecido',
        }));
        throw new Error(
          errorData.error || `Erro ${response.status}: ${response.statusText}`
        );
      }

      const data: AssistentesApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Resposta da API indicou falha');
      }

      // Verificar se a estrutura de dados está correta
      if (!data.data) {
        console.error('Estrutura de dados inválida:', data);
        throw new Error('Estrutura de dados inválida na resposta da API');
      }

      setAssistentes(data.data.assistentes || []);
      setPaginacao(data.data.paginacao);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar assistentes';
      setError(errorMessage);
      setAssistentes([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, busca, ativo]);

  useEffect(() => {
    // Só executar se os parâmetros realmente mudaram
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      buscarAssistentes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return {
    assistentes,
    paginacao,
    isLoading,
    error,
    refetch: buscarAssistentes,
  };
};