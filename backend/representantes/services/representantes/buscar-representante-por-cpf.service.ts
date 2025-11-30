// Serviço de busca de representante por CPF
// Camada de lógica de negócio com validações

import { buscarRepresentantePorCPF as buscarRepresentantePorCPFPersistence } from '../representantes-persistence.service';
import type { Representante } from '@/backend/types/representantes/representantes-types';

/**
 * Busca um representante pelo CPF
 *
 * @param cpf - CPF com ou sem formatação
 * @returns Representante encontrado ou null
 * @throws Error se CPF inválido
 */
export async function buscarRepresentantePorCPF(cpf: string): Promise<Representante | null> {
  // Validação
  const cpfNormalizado = cpf.replace(/\D/g, '');

  if (cpfNormalizado.length !== 11) {
    throw new Error('CPF inválido. Deve conter 11 dígitos.');
  }

  return await buscarRepresentantePorCPFPersistence(cpf);
}
