/**
 * Hook para gerenciar estado da matriz de permissões
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { PermissaoMatriz, Permissao } from '@/lib/types/usuarios';
import {
  formatarPermissoesParaMatriz,
  formatarMatrizParaPermissoes,
  detectarMudancas,
} from '@/lib/utils/permissoes-utils';

interface UsePermissoesMatrizProps {
  usuarioId: number;
  permissoes: Permissao[];
  isSuperAdmin: boolean;
  onMutate: () => void;
}

/**
 * Hook para gerenciar matriz de permissões
 */
export function usePermissoesMatriz({
  usuarioId,
  permissoes,
  isSuperAdmin,
  onMutate,
}: UsePermissoesMatrizProps) {
  // Serializar permissões para usar como chave de comparação
  const permissoesKey = useMemo(() => JSON.stringify(permissoes), [permissoes]);

  const [matriz, setMatriz] = useState<PermissaoMatriz[]>([]);
  const [matrizOriginal, setMatrizOriginal] = useState<PermissaoMatriz[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastPermissoesKey, setLastPermissoesKey] = useState<string>('');

  // Atualizar matriz quando permissões mudarem (comparando por key)
  useEffect(() => {
    if (permissoesKey !== lastPermissoesKey) {
      const novaMatriz = formatarPermissoesParaMatriz(permissoes);
      setMatriz(novaMatriz);
      setMatrizOriginal(novaMatriz);
      setLastPermissoesKey(permissoesKey);
    }
  }, [permissoesKey, lastPermissoesKey, permissoes]);

  // Detectar mudanças
  const hasChanges = useMemo(
    () => detectarMudancas(matrizOriginal, matriz),
    [matrizOriginal, matriz]
  );

  /**
   * Toggle uma permissão específica
   */
  const togglePermissao = useCallback((recurso: string, operacao: string) => {
    setMatriz((prevMatriz) =>
      prevMatriz.map((item) =>
        item.recurso === recurso
          ? {
              ...item,
              operacoes: {
                ...item.operacoes,
                [operacao]: !item.operacoes[operacao],
              },
            }
          : item
      )
    );
  }, []);

  /**
   * Salvar permissões
   */
  const salvarPermissoes = useCallback(async () => {
    setIsSaving(true);

    try {
      // Transformar matriz de volta para array de permissões
      const permissoesParaSalvar = formatarMatrizParaPermissoes(matriz);

      const response = await fetch(`/api/permissoes/usuarios/${usuarioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permissoesParaSalvar),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar permissões');
      }

      // Atualizar matriz original para refletir novo estado
      setMatrizOriginal(matriz);

      // Revalidar dados
      onMutate();

      toast.success('Permissões atualizadas com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao salvar permissões. Tente novamente.'
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [matriz, usuarioId, onMutate]);

  /**
   * Resetar mudanças
   */
  const resetarMudancas = useCallback(() => {
    setMatriz(matrizOriginal);
  }, [matrizOriginal]);

  return {
    matriz,
    togglePermissao,
    salvarPermissoes,
    resetarMudancas,
    hasChanges,
    isSaving,
    isSuperAdmin,
  };
}
