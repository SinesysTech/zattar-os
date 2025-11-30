// Serviço de busca de representantes por nome
// Camada de lógica de negócio com validações

import { buscarRepresentantesPorNome as buscarRepresentantesPorNomePersistence } from '../representantes-persistence.service';
import type { Representante } from '@/backend/types/representantes/representantes-types';

/**
 * Busca representantes pelo nome (busca parcial)
 *
 * @param nome - Nome ou parte do nome para buscar
 * @returns Array de representantes encontrados (vazio se nenhum match)
 * @throws Error se nome inválido
 */
export async function buscarRepresentantePorNome(nome: string): Promise<Representante[]> {
  // Validação
  const nomeTrimmed = nome.trim();

  if (nomeTrimmed.length === 0) {
    throw new Error('Nome não pode ser vazio.');
  }

  if (nomeTrimmed.length < 3) {
    throw new Error('Nome deve ter pelo menos 3 caracteres para busca.');
  }

  return await buscarRepresentantesPorNomePersistence(nome);
}
