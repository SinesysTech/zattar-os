"use client";

// Hook para buscar usuários do sistema

import { useState, useEffect, useCallback, useRef } from "react";
import { actionListarUsuarios } from "../actions/usuarios-actions";
import type { ListarUsuariosParams, Usuario } from "../domain";
import { useDeepCompareMemo } from "@/hooks/use-render-count";

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
  const isFirstRender = useRef(true);

  // Usar comparação profunda para estabilizar params
  // Evita re-fetches quando params tem mesmos valores mas referência diferente
  const stableParams = useDeepCompareMemo(
    () => ({
      busca: params.busca || "",
      ativo: params.ativo,
      oab: params.oab || "",
      ufOab: params.ufOab || "",
      cargoId: params.cargoId,
      isSuperAdmin: params.isSuperAdmin,
    }),
    [params]
  );

  const buscarUsuarios = useCallback(async () => {
    // Não executar durante SSR/SSG
    if (!isClient) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Buscar todos os usuários sem paginação
      const response = await actionListarUsuarios(stableParams as ListarUsuariosParams);

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
  }, [stableParams]);

  useEffect(() => {
    // Executar na primeira render
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }

    buscarUsuarios();
  }, [buscarUsuarios]);

  return {
    usuarios,
    isLoading,
    error,
    refetch: buscarUsuarios,
  };
};
