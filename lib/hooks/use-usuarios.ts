'use client';

// Hook para buscar usuários do sistema

import { useState, useEffect, useCallback } from 'react';
import type { UsuariosParams } from '@/lib/types/usuarios';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

interface UseUsuariosResult {
  usuarios: Usuario[];
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

interface UsuariosApiResponse {
  success: boolean;
  data: {
    usuarios: Usuario[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

/**
 * Hook para buscar usuários do sistema com paginação e filtros
 */
export const useUsuarios = (params: UsuariosParams = {}): UseUsuariosResult => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [paginacao, setPaginacao] = useState<UseUsuariosResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Construir query string
      const searchParams = new URLSearchParams();
      
      if (params.pagina !== undefined) {
        searchParams.set('pagina', params.pagina.toString());
      }
      if (params.limite !== undefined) {
        searchParams.set('limite', params.limite.toString());
      }
      if (params.busca) {
        searchParams.set('busca', params.busca);
      }
      if (params.ativo !== undefined) {
        searchParams.set('ativo', params.ativo.toString());
      }
      if (params.oab) {
        searchParams.set('oab', params.oab);
      }
      if (params.ufOab) {
        searchParams.set('ufOab', params.ufOab);
      }

      const response = await fetch(`/api/usuarios?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro desconhecido',
        }));
        throw new Error(
          errorData.error || `Erro ${response.status}: ${response.statusText}`
        );
      }

      const data: UsuariosApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      // Verificar se a estrutura de dados está correta
      if (!data.data) {
        console.error('Estrutura de dados inválida:', data);
        throw new Error('Estrutura de dados inválida na resposta da API');
      }

      setUsuarios(data.data.usuarios || []);
      setPaginacao({
        pagina: data.data.pagina,
        limite: data.data.limite,
        total: data.data.total,
        totalPaginas: data.data.totalPaginas,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar usuários';
      setError(errorMessage);
      setUsuarios([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    buscarUsuarios();
  }, [buscarUsuarios]);

  return {
    usuarios,
    paginacao,
    isLoading,
    error,
    refetch: buscarUsuarios,
  };
};

