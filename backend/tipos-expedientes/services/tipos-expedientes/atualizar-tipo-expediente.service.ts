// Serviço de negócio para atualizar tipo de expediente

import { atualizarTipoExpediente as atualizarTipoExpedientePersistence } from '../persistence/tipo-expediente-persistence.service';
import type { AtualizarTipoExpedienteParams, TipoExpediente } from '@/backend/types/tipos-expedientes/types';

/**
 * Atualizar tipo de expediente
 * Aplica validações de negócio antes de chamar a camada de persistência
 */
export async function atualizarTipoExpediente(
  id: number,
  params: AtualizarTipoExpedienteParams
): Promise<TipoExpediente> {
  // Validações de negócio
  if (!id || id <= 0) {
    throw new Error('ID inválido');
  }

  if (params.tipo_expediente !== undefined) {
    if (params.tipo_expediente.trim().length === 0) {
      throw new Error('Nome do tipo de expediente não pode ser vazio');
    }

    if (params.tipo_expediente.trim().length > 255) {
      throw new Error('Nome do tipo de expediente não pode exceder 255 caracteres');
    }
  }

  // Chamar camada de persistência
  return await atualizarTipoExpedientePersistence(id, params);
}

