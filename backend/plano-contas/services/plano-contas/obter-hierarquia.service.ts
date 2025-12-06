/**
 * Serviço de negócio para obtenção da hierarquia do Plano de Contas
 */

import { listarPlanoContasHierarquico as listarHierarquicoPersistence } from '../persistence/plano-contas-persistence.service';
import type { PlanoContaHierarquico } from '@/backend/types/financeiro/plano-contas.types';

/**
 * Obter estrutura hierárquica completa do plano de contas
 * Retorna todas as contas ativas em formato de árvore
 */
export const obterHierarquiaPlanoContas = async (): Promise<PlanoContaHierarquico[]> => {
  return listarHierarquicoPersistence();
};

/**
 * Achatar hierarquia em lista com indentação
 * Útil para seletores com visualização hierárquica
 */
export const achatarHierarquia = (
  hierarquia: PlanoContaHierarquico[],
  nivel: number = 0
): Array<PlanoContaHierarquico & { nivelIndentacao: number }> => {
  const resultado: Array<PlanoContaHierarquico & { nivelIndentacao: number }> = [];

  for (const conta of hierarquia) {
    resultado.push({ ...conta, nivelIndentacao: nivel });

    if (conta.filhos && conta.filhos.length > 0) {
      resultado.push(...achatarHierarquia(conta.filhos, nivel + 1));
    }
  }

  return resultado;
};

/**
 * Encontrar conta na hierarquia por ID
 */
export const encontrarContaNaHierarquia = (
  hierarquia: PlanoContaHierarquico[],
  id: number
): PlanoContaHierarquico | null => {
  for (const conta of hierarquia) {
    if (conta.id === id) {
      return conta;
    }

    if (conta.filhos && conta.filhos.length > 0) {
      const encontrada = encontrarContaNaHierarquia(conta.filhos, id);
      if (encontrada) {
        return encontrada;
      }
    }
  }

  return null;
};

/**
 * Obter caminho completo de uma conta (breadcrumb)
 */
export const obterCaminhoCompleto = (
  hierarquia: PlanoContaHierarquico[],
  id: number,
  caminho: PlanoContaHierarquico[] = []
): PlanoContaHierarquico[] | null => {
  for (const conta of hierarquia) {
    const novoCaminho = [...caminho, conta];

    if (conta.id === id) {
      return novoCaminho;
    }

    if (conta.filhos && conta.filhos.length > 0) {
      const resultado = obterCaminhoCompleto(conta.filhos, id, novoCaminho);
      if (resultado) {
        return resultado;
      }
    }
  }

  return null;
};
