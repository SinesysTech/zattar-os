// Serviço de negócio para buscar tipo de expediente

import { buscarTipoExpediente as buscarTipoExpedientePersistence } from '../persistence/tipo-expediente-persistence.service';
import type { TipoExpediente } from '@/backend/types/tipos-expedientes/types';

/**
 * Buscar tipo de expediente por ID
 */
export async function buscarTipoExpediente(id: number): Promise<TipoExpediente | null> {
  if (!id || id <= 0) {
    throw new Error('ID inválido');
  }

  return await buscarTipoExpedientePersistence(id);
}

