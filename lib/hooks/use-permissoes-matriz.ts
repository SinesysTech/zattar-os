/**
 * Hook para gerenciar estado da matriz de permissões
 */

import { useState, useEffect, useCallback } from 'react';
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
  const [matriz, setMatriz] = useState<PermissaoMatriz[]>([]);
  const [matrizOriginal, setMatrizOriginal] = useState<PermissaoMatriz[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar matriz quando permissões mudarem
  useEffect(() => {
    const matrizInicial = formatarPermissoesParaMatriz(permissoes);
    setMatriz(matrizInicial);
    setMatrizOriginal(matrizInicial);
  }, [permissoes]);

  // Detectar mudanças
  const hasChanges = detectarMudancas(matrizOriginal, matriz);

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
