'use client';

// Hook para buscar usuários do sistema

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { UsuariosParams } from '@/core/app/_lib/types/usuarios';
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
  
  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const ativo = params.ativo;
  const oab = params.oab || '';
  const ufOab = params.ufOab || '';
  
  // Normalizar parâmetros para comparação estável
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      ativo,
      oab,
      ufOab,
    });
  }, [pagina, limite, busca, ativo, oab, ufOab]);
  
  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>('');

  const buscarUsuarios = useCallback(async () => {
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
      if (oab) {
        searchParams.set('oab', oab);
      }
      if (ufOab) {
        searchParams.set('ufOab', ufOab);
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
  }, [pagina, limite, busca, ativo, oab, ufOab]);

  useEffect(() => {
    // Só executar se os parâmetros realmente mudaram
    if (paramsRef.current !== paramsKey) {
      paramsRef.current = paramsKey;
      buscarUsuarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  return {
    usuarios,
    paginacao,
    isLoading,
    error,
    refetch: buscarUsuarios,
  };
};

