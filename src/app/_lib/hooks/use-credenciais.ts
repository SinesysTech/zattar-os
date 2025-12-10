'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  Credencial,
  CredenciaisResponse,
  CriarCredencialParams,
  AtualizarCredencialParams,
} from '@/core/app/_lib/types/credenciais';

interface UseCredenciaisResult {
  credenciais: Credencial[];
  tribunais: string[];
  graus: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  criarCredencial: (advogadoId: number, credencialParams: Omit<CriarCredencialParams, 'advogado_id'>) => Promise<void>;
  atualizarCredencial: (advogadoId: number, credencialId: number, credencialParams: AtualizarCredencialParams) => Promise<void>;
  toggleStatus: (advogadoId: number, credencialId: number, active: boolean) => Promise<void>;
}

/**
 * Hook para gerenciar credenciais de acesso aos tribunais
 */
export const useCredenciais = (advogadoId?: number, params?: { active?: boolean }): UseCredenciaisResult => {
  const [credenciais, setCredenciais] = useState<Credencial[]>([]);
  const [tribunais, setTribunais] = useState<string[]>([]);
  const [graus, setGraus] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarCredenciais = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Construir query string com filtros
      const queryParams = new URLSearchParams();
      if (advogadoId !== undefined) {
        queryParams.append('advogado_id', advogadoId.toString());
      }
      if (params?.active !== undefined) {
        queryParams.append('active', params.active.toString());
      }

      const url = `/api/captura/credenciais${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: CredenciaisResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setCredenciais(data.data.credenciais);
      setTribunais(data.data.tribunais_disponiveis);
      setGraus(data.data.graus_disponiveis);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar credenciais';
      setError(errorMessage);
      setCredenciais([]);
    } finally {
      setIsLoading(false);
    }
  }, [advogadoId, params?.active]);

  const criarCredencial = useCallback(
    async (advogadoId: number, credencialParams: Omit<CriarCredencialParams, 'advogado_id'>) => {
      try {
        const response = await fetch(`/api/advogados/${advogadoId}/credenciais`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credencialParams),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        // Recarregar lista após criar
        await buscarCredenciais();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar credencial';
        throw new Error(errorMessage);
      }
    },
    [buscarCredenciais]
  );

  const atualizarCredencial = useCallback(
    async (advogadoId: number, credencialId: number, credencialParams: AtualizarCredencialParams) => {
      try {
        const response = await fetch(`/api/advogados/${advogadoId}/credenciais/${credencialId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credencialParams),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        // Recarregar lista após atualizar
        await buscarCredenciais();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar credencial';
        throw new Error(errorMessage);
      }
    },
    [buscarCredenciais]
  );

  const toggleStatus = useCallback(
    async (advogadoId: number, credencialId: number, active: boolean) => {
      await atualizarCredencial(advogadoId, credencialId, { active });
    },
    [atualizarCredencial]
  );

  useEffect(() => {
    buscarCredenciais();
  }, [buscarCredenciais]);

  return {
    credenciais,
    tribunais,
    graus,
    isLoading,
    error,
    refetch: buscarCredenciais,
    criarCredencial,
    atualizarCredencial,
    toggleStatus,
  };
};
