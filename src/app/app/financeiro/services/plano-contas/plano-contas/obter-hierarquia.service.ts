/**
 * Serviço de negócio para obtenção da hierarquia do Plano de Contas
 */

import { listarPlanoContasHierarquico as listarHierarquicoPersistence } from '../persistence/plano-contas-persistence.service';
import type { PlanoContaHierarquico } from '../../../domain/plano-contas';
import { achatarHierarquia } from '../../../domain/plano-contas';

// Re-exporta função utilitária do domain
export { achatarHierarquia };

/**
 * Obter estrutura hierárquica completa do plano de contas
 * Retorna todas as contas ativas em formato de árvore
 */
export const obterHierarquiaPlanoContas = async (): Promise<PlanoContaHierarquico[]> => {
  return listarHierarquicoPersistence();
};
