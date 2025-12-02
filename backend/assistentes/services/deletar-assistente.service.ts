// Serviço de deleção de assistente
// Verifica se o assistente existe antes de deletar

import { buscarAssistentePorId, deletarAssistente as deletarAssistentePersistence } from './assistente-persistence.service';

/**
 * Resultado da deleção de assistente
 */
export interface DeletacaoResult {
  sucesso: boolean;
  erro?: string;
}

/**
 * Deleta um assistente após verificar se ele existe
 *
 * Passos:
 * 1. Verificar se o assistente existe
 * 2. Se existe, deletar usando o serviço de persistência
 * 3. Retornar confirmação de sucesso
 *
 * @param assistenteId - ID do assistente a ser deletado
 * @returns Resultado com sucesso ou erro
 */
export async function deletarAssistente(assistenteId: number): Promise<DeletacaoResult> {
  try {
    // ========================================================================
    // 1. Verificar se o assistente existe
    // ========================================================================

    const assistente = await buscarAssistentePorId(assistenteId);

    if (!assistente) {
      return {
        sucesso: false,
        erro: 'Assistente não encontrado',
      };
    }

    console.log(`[Deleção] Assistente ${assistenteId} encontrado, prosseguindo com deleção`);

    // ========================================================================
    // 2. Deletar assistente
    // ========================================================================

    const deletado = await deletarAssistentePersistence(assistenteId);

    if (!deletado) {
      throw new Error('Erro ao deletar assistente no banco de dados');
    }

    console.log(`[Deleção] Assistente ${assistenteId} deletado com sucesso`);

    // ========================================================================
    // 3. Retornar resultado
    // ========================================================================

    return {
      sucesso: true,
    };
  } catch (error) {
    console.error('[Deleção] Erro ao deletar assistente:', error);
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido ao deletar assistente',
    };
  }
}