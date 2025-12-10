/**
 * @deprecated MIGRADO PARA src/core/partes
 * Este arquivo sera removido em versao futura.
 * Use: import { buscarParteContrariaPorDocumento } from '@/core/partes'
 */

// Serviço de busca de partes contrárias por nome
// Camada de lógica de negócio com validações

import { buscarPartesContrariasPorNome as buscarPartesContrariasPorNomePersistence } from '../persistence/parte-contraria-persistence.service';
import type { ParteContraria } from '@/backend/types/partes/partes-contrarias-types';

/**
 * Busca partes contrárias pelo nome (busca parcial)
 *
 * @param nome - Nome ou parte do nome para buscar
 * @returns Array de partes contrárias encontradas (vazio se nenhum match)
 * @throws Error se nome inválido
 */
export async function buscarParteContrariaPorNome(nome: string): Promise<ParteContraria[]> {
  // Validação
  const nomeTrimmed = nome.trim();

  if (nomeTrimmed.length === 0) {
    throw new Error('Nome não pode ser vazio.');
  }

  if (nomeTrimmed.length < 3) {
    throw new Error('Nome deve ter pelo menos 3 caracteres para busca.');
  }

  return await buscarPartesContrariasPorNomePersistence(nome);
}
