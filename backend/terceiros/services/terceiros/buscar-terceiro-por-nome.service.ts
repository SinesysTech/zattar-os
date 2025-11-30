// Serviço de busca de terceiros por nome
// Camada de lógica de negócio com validações

import { buscarTerceirosPorNome as buscarTerceirosPorNomePersistence } from '../persistence/terceiro-persistence.service';
import type { Terceiro } from '@/backend/types/partes/terceiros-types';

/**
 * Busca terceiros pelo nome (busca parcial)
 *
 * @param nome - Nome ou parte do nome para buscar
 * @returns Array de terceiros encontrados (vazio se nenhum match)
 * @throws Error se nome inválido
 */
export async function buscarTerceiroPorNome(nome: string): Promise<Terceiro[]> {
  // Validação
  const nomeTrimmed = nome.trim();

  if (nomeTrimmed.length === 0) {
    throw new Error('Nome não pode ser vazio.');
  }

  if (nomeTrimmed.length < 3) {
    throw new Error('Nome deve ter pelo menos 3 caracteres para busca.');
  }

  return await buscarTerceirosPorNomePersistence(nome);
}
