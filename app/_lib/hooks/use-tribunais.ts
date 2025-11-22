'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  TribunalConfig,
  TribunaisResponse,
  CriarTribunalParams,
  AtualizarTribunalParams,
} from '@/app/_lib/types/tribunais';

interface UseTribunaisResult {
  tribunais: TribunalConfig[];
  tribunaisCodigos: string[];
  tiposAcesso: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  criarTribunal: (params: CriarTribunalParams) => Promise<void>;
  atualizarTribunal: (id: string, params: AtualizarTribunalParams) => Promise<void>;
}

/**
 * Hook para gerenciar configurações de tribunais
 */
export const useTribunais = (): UseTribunaisResult => {
  const [tribunais, setTribunais] = useState<TribunalConfig[]>([]);
  const [tribunaisCodigos, setTribunaisCodigos] = useState<string[]>([]);
  const [tiposAcesso, setTiposAcesso] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarTribunais = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/captura/tribunais');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: TribunaisResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setTribunais(data.data.tribunais);
      setTribunaisCodigos(data.data.tribunais_codigos);
      setTiposAcesso(data.data.tipos_acesso);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar tribunais';
      setError(errorMessage);
      setTribunais([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const criarTribunal = useCallback(
    async (params: CriarTribunalParams) => {
      try {
        const response = await fetch('/api/captura/tribunais', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        // Recarregar lista após criar
        await buscarTribunais();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar tribunal';
        throw new Error(errorMessage);
      }
    },
    [buscarTribunais]
  );

  const atualizarTribunal = useCallback(
    async (id: string, params: AtualizarTribunalParams) => {
      try {
        const response = await fetch(`/api/captura/tribunais/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        // Recarregar lista após atualizar
        await buscarTribunais();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tribunal';
        throw new Error(errorMessage);
      }
    },
    [buscarTribunais]
  );

  useEffect(() => {
    buscarTribunais();
  }, [buscarTribunais]);

  return {
    tribunais,
    tribunaisCodigos,
    tiposAcesso,
    isLoading,
    error,
    refetch: buscarTribunais,
    criarTribunal,
    atualizarTribunal,
  };
};
