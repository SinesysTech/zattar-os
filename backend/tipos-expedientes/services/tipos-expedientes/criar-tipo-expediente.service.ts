// Serviço de negócio para criar tipo de expediente

import { criarTipoExpediente as criarTipoExpedientePersistence } from '../persistence/tipo-expediente-persistence.service';
import type { CriarTipoExpedienteParams, TipoExpediente } from '@/backend/types/tipos-expedientes/types';

/**
 * Criar um novo tipo de expediente
 * Aplica validações de negócio antes de chamar a camada de persistência
 */
export async function criarTipoExpediente(params: CriarTipoExpedienteParams): Promise<TipoExpediente> {
  // Validações de negócio
  if (!params.tipo_expediente || params.tipo_expediente.trim().length === 0) {
    throw new Error('Nome do tipo de expediente é obrigatório');
  }

  if (params.tipo_expediente.trim().length > 255) {
    throw new Error('Nome do tipo de expediente não pode exceder 255 caracteres');
  }

  if (!params.created_by || params.created_by <= 0) {
    throw new Error('ID do usuário criador é obrigatório');
  }

  // Chamar camada de persistência
  return await criarTipoExpedientePersistence(params);
}

