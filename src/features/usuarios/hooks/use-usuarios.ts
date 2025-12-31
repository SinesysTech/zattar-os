"use client";

// Hook para buscar usuários do sistema

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { actionListarUsuarios } from "../actions/usuarios-actions";
import type { ListarUsuariosParams, Usuario } from "../domain";

// Verificação SSR - retorna true se estiver rodando no cliente
const isClient = typeof window !== "undefined";

/** Parâmetros de filtro para o hook (sem paginação) */
export interface UseUsuariosParams {
  busca?: string;
  ativo?: boolean;
  oab?: string;
  ufOab?: string;
  cargoId?: number | null;
  isSuperAdmin?: boolean;
}

interface UseUsuariosResult {
  usuarios: Usuario[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar usuários do sistema com filtros (scroll infinito, sem paginação)
 */
export const useUsuarios = (
  params: UseUsuariosParams = {}
): UseUsuariosResult => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extrair valores primitivos para usar no callback
  const busca = params.busca || "";
  const ativo = params.ativo;
  const oab = params.oab || "";
  const ufOab = params.ufOab || "";
  const cargoId = params.cargoId;
  const isSuperAdmin = params.isSuperAdmin;

  // Normalizar parâmetros para comparação estável
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      busca,
      ativo,
      oab,
      ufOab,
      cargoId,
      isSuperAdmin,
    });
  }, [busca, ativo, oab, ufOab, cargoId, isSuperAdmin]);

  // Usar ref para comparar valores anteriores e evitar loops
  const paramsRef = useRef<string>("");

  const buscarUsuarios = useCallback(async () => {
    // Não executar durante SSR/SSG
    if (!isClient) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Buscar todos os usuários sem paginação
      const response = await actionListarUsuarios({
        busca,
        ativo,
        oab,
        ufOab,
        cargoId,
        isSuperAdmin,
      } as ListarUsuariosParams);

      if (!response.success || !response.data) {
        throw new Error(response.error || "Erro ao buscar usuários");
      }

      setUsuarios(response.data.usuarios || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar usuários";
      setError(errorMessage);
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  }, [busca, ativo, oab, ufOab, cargoId, isSuperAdmin]);

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
    isLoading,
    error,
    refetch: buscarUsuarios,
  };
};
