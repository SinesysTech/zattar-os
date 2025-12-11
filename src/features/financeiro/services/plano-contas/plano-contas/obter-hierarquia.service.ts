/**
 * Serviço de negócio para obtenção da hierarquia do Plano de Contas
 */

import { listarPlanoContasHierarquico as listarHierarquicoPersistence } from '../persistence/plano-contas-persistence.service';
import type { PlanoContaHierarquico } from '@/backend/types/financeiro/plano-contas.types';

// Re-exporta funções utilitárias do módulo compartilhado
export {
  achatarHierarquia,
  encontrarContaNaHierarquia,
  obterCaminhoCompleto,
} from '@/types/domain/financeiro';

/**
 * Obter estrutura hierárquica completa do plano de contas
 * Retorna todas as contas ativas em formato de árvore
 */
export const obterHierarquiaPlanoContas = async (): Promise<PlanoContaHierarquico[]> => {
  return listarHierarquicoPersistence();
};
