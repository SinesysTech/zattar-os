// Serviço de negócio para deletar tipo de expediente

import { deletarTipoExpediente as deletarTipoExpedientePersistence } from '../persistence/tipo-expediente-persistence.service';

/**
 * Deletar tipo de expediente
 * Aplica validações de negócio antes de chamar a camada de persistência
 */
export async function deletarTipoExpediente(id: number): Promise<void> {
  // Validações de negócio
  if (!id || id <= 0) {
    throw new Error('ID inválido');
  }

  // Chamar camada de persistência (que já verifica se está em uso)
  return await deletarTipoExpedientePersistence(id);
}

