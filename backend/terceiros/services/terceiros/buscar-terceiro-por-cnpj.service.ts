// Serviço de busca de terceiro por CNPJ
// Camada de lógica de negócio com validações

import { buscarTerceiroPorCNPJ as buscarTerceiroPorCNPJPersistence } from '../persistence/terceiro-persistence.service';
import type { Terceiro } from '@/backend/types/partes/terceiros-types';

/**
 * Busca um terceiro pelo CNPJ
 *
 * @param cnpj - CNPJ com ou sem formatação
 * @returns Terceiro encontrado ou null
 * @throws Error se CNPJ inválido
 */
export async function buscarTerceiroPorCNPJ(cnpj: string): Promise<Terceiro | null> {
  // Validação
  const cnpjNormalizado = cnpj.replace(/\D/g, '');

  if (cnpjNormalizado.length !== 14) {
    throw new Error('CNPJ inválido. Deve conter 14 dígitos.');
  }

  return await buscarTerceiroPorCNPJPersistence(cnpj);
}
