/**
 * @deprecated MIGRADO PARA src/core/partes
 * Este arquivo sera removido em versao futura.
 * Use: import { buscarClientesPorNome } from '@/core/partes'
 */

// Serviço de busca de clientes por nome
// Camada de lógica de negócio com validações

import { buscarClientesPorNome as buscarClientesPorNomePersistence } from '../persistence/cliente-persistence.service';
import type { Cliente } from '@/backend/types/partes/clientes-types';

/**
 * Busca clientes pelo nome (busca parcial)
 *
 * @param nome - Nome ou parte do nome para buscar
 * @returns Array de clientes encontrados (vazio se nenhum match)
 * @throws Error se nome inválido
 */
export async function buscarClientePorNome(nome: string): Promise<Cliente[]> {
  // Validação
  const nomeTrimmed = nome.trim();

  if (nomeTrimmed.length === 0) {
    throw new Error('Nome não pode ser vazio.');
  }

  if (nomeTrimmed.length < 3) {
    throw new Error('Nome deve ter pelo menos 3 caracteres para busca.');
  }

  return await buscarClientesPorNomePersistence(nome);
}
