// Serviço de busca de terceiro por CPF
// Camada de lógica de negócio com validações

import { buscarTerceiroPorCPF as buscarTerceiroPorCPFPersistence } from '../persistence/terceiro-persistence.service';
import type { Terceiro } from '@/backend/types/partes/terceiros-types';

/**
 * Busca um terceiro pelo CPF
 *
 * @param cpf - CPF com ou sem formatação
 * @returns Terceiro encontrado ou null
 * @throws Error se CPF inválido
 */
export async function buscarTerceiroPorCPF(cpf: string): Promise<Terceiro | null> {
  // Validação
  const cpfNormalizado = cpf.replace(/\D/g, '');

  if (cpfNormalizado.length !== 11) {
    throw new Error('CPF inválido. Deve conter 11 dígitos.');
  }

  return await buscarTerceiroPorCPFPersistence(cpf);
}
