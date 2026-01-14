'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Permissao } from '../domain';

export interface MinhasPermissoesData {
  usuarioId: number;
  isSuperAdmin: boolean;
  permissoes: Permissao[];
}

/**
 * Hook para buscar permissões do usuário logado
 * Retorna permissões do usuário autenticado, opcionalmente filtradas por recurso
 * 
 * Usa a API route /api/permissoes/minhas para evitar problemas com RLS
 */
export function useMinhasPermissoes(recurso?: string) {
  const [data, setData] = useState<MinhasPermissoesData | null>(null);
  // Always start with isLoading=true to avoid hydration mismatch
  // (server and client must render the same initial state)
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissoes = useCallback(async () => {
    // Skip fetch during SSR
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Construir URL da API com query param opcional
      const url = new URL('/api/permissoes/minhas', window.location.origin);
      if (recurso) {
        url.searchParams.set('recurso', recurso);
      }

      // Buscar permissões via API route
      const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include', // Incluir cookies de autenticação
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao buscar permissões' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar permissões');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar permissões');
    } finally {
      setIsLoading(false);
    }
  }, [recurso]);

  useEffect(() => {
    fetchPermissoes();
  }, [fetchPermissoes]);

  // Função para verificar se o usuário tem uma permissão específica
  const temPermissao = useCallback((recurso: string, operacao: string): boolean => {
    if (!data) return false;
    if (data.isSuperAdmin) return true;
    
    return data.permissoes.some(
      (p) => p.recurso === recurso && p.operacao === operacao && p.permitido
    );
  }, [data]);

  return {
    data,
    isLoading,
    error,
    temPermissao,
    refetch: fetchPermissoes,
  };
}

