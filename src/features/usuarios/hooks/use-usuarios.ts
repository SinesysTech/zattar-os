'use client';

// Hook para buscar usuários do sistema

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { actionListarUsuarios } from '../actions/usuarios-actions';
import { ListarUsuariosParams, Usuario } from '../types';

// Verificação SSR - retorna true se estiver rodando no cliente
const isClient = typeof window !== 'undefined';

interface PaginacaoResult {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

interface UseUsuariosResult {
  usuarios: Usuario[];
  paginacao: PaginacaoResult | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar usuários do sistema com paginação e filtros
 */
export const useUsuarios = (params: ListarUsuariosParams = {}): UseUsuariosResult => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [paginacao, setPaginacao] = useState<PaginacaoResult | null>(null);
  const [isLoading, setIsLoading] = useState(isClient);
  const [error, setError] = useState<string | null>(null);
  
  // Extrair valores primitivos para usar no callback
  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const busca = params.busca || '';
  const ativo = params.ativo;
  const oab = params.oab || '';
  const ufOab = params.ufOab || '';
  const cargoId = params.cargoId;
  const isSuperAdmin = params.isSuperAdmin;

  // Normalizar parâmetros para comparação estável
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      pagina,
      limite,
      busca,
      ativo,
      oab,
      ufOab,
      cargoId,
      isSuperAdmin
    });
  }, [pagina, limite, busca, ativo, oab, ufOab, cargoId, isSuperAdmin]);
  
  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>('');

  const buscarUsuarios = useCallback(async () => {
    // Não executar durante SSR/SSG
    if (!isClient) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await actionListarUsuarios({
        pagina,
        limite,
        busca,
        ativo,
        oab,
        ufOab,
        cargoId,
        isSuperAdmin
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao buscar usuários');
      }

      const { usuarios, total, totalPaginas } = response.data;

      setUsuarios(usuarios || []);
      setPaginacao({
        pagina: response.data.pagina,
        limite: response.data.limite,
        total,
        totalPaginas,
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
  }, [pagina, limite, busca, ativo, oab, ufOab, cargoId, isSuperAdmin]);

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
