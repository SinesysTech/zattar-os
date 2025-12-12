"use client";

import { useState, useCallback, useEffect } from "react";
import {
  actionListarPermissoes,
  actionSalvarPermissoes,
} from "../actions/permissoes-actions";
import type { Permissao, PermissaoMatriz } from "../domain";
import {
  formatarPermissoesParaMatriz,
  detectarMudancas,
  formatarMatrizParaPermissoes,
} from "../permissions-utils";

export const useUsuarioPermissoes = (id: number) => {
  const [permissoesData, setPermissoesData] = useState<{
    usuario_id: number;
    is_super_admin: boolean;
    permissoes: Permissao[];
  } | null>(null);

  const [matriz, setMatriz] = useState<PermissaoMatriz[]>([]);
  const [matrizOriginal, setMatrizOriginal] = useState<PermissaoMatriz[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissoes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await actionListarPermissoes(id);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Erro ao carregar permissões");
      }

      const data = response.data;
      setPermissoesData(data);

      const novaMatriz = formatarPermissoesParaMatriz(data.permissoes);
      setMatriz(novaMatriz);
      // Deep copy for original state
      setMatrizOriginal(JSON.parse(JSON.stringify(novaMatriz)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchPermissoes();
  }, [id, fetchPermissoes]);

  const togglePermissao = useCallback((recurso: string, operacao: string) => {
    setMatriz((prev) => {
      const newMatriz = prev.map((item) => {
        if (item.recurso === recurso) {
          return {
            ...item,
            operacoes: {
              ...item.operacoes,
              [operacao]: !item.operacoes[operacao],
            },
          };
        }
        return item;
      });
      return newMatriz;
    });
  }, []);

  const savePermissoes = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const permissoes = formatarMatrizParaPermissoes(matriz);
      const result = await actionSalvarPermissoes(id, permissoes);

      if (!result.success) {
        throw new Error(result.error || "Erro ao salvar permissões");
      }

      await fetchPermissoes(); // reload to sync
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [id, matriz, fetchPermissoes]);

  const resetar = useCallback(() => {
    setMatriz(JSON.parse(JSON.stringify(matrizOriginal)));
  }, [matrizOriginal]);

  return {
    permissoesData,
    matriz,
    isLoading,
    isSaving,
    error,
    fetchPermissoes,
    togglePermissao,
    save: savePermissoes,
    resetar,
    hasChanges: detectarMudancas(matrizOriginal, matriz),
  };
};
