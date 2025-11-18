// Serviço para buscar credencial por ID

import { buscarCredencial as buscarCredencialPersistence } from '../persistence/credencial-persistence.service';
import type { Credencial } from '@/backend/types/credenciais/types';

/**
 * Buscar credencial por ID
 */
export async function buscarCredencial(id: number): Promise<Credencial | null> {
  if (!id || id < 1) {
    throw new Error('ID inválido');
  }

  return buscarCredencialPersistence(id);
}

