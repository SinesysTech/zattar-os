// Serviço para buscar advogado por ID

import { buscarAdvogado as buscarAdvogadoPersistence } from '../persistence/advogado-persistence.service';
import type { Advogado } from '@/backend/types/advogados/types';

/**
 * Buscar advogado por ID
 */
export async function buscarAdvogado(id: number): Promise<Advogado | null> {
  if (!id || id < 1) {
    throw new Error('ID inválido');
  }

  return buscarAdvogadoPersistence(id);
}

