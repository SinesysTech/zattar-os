// Serviço para atualizar credencial

import { atualizarCredencial as atualizarCredencialPersistence } from '../persistence/credencial-persistence.service';
import type { AtualizarCredencialParams, Credencial } from '@/backend/types/credenciais/types';

/**
 * Atualizar credencial
 */
export async function atualizarCredencial(
  id: number,
  params: AtualizarCredencialParams
): Promise<Credencial> {
  if (!id || id < 1) {
    throw new Error('ID inválido');
  }

  // Validar se pelo menos um campo foi fornecido
  if (
    params.tribunal === undefined &&
    params.grau === undefined &&
    params.senha === undefined &&
    params.active === undefined
  ) {
    throw new Error('Pelo menos um campo deve ser fornecido para atualização');
  }

  // Validações de formato se campos fornecidos
  if (params.tribunal !== undefined) {
    const tribunalMatch = params.tribunal.match(/^TRT(\d{1,2})$/);
    if (!tribunalMatch) {
      throw new Error('Tribunal deve estar no formato TRT1 a TRT24');
    }

    const trtNum = parseInt(tribunalMatch[1], 10);
    if (trtNum < 1 || trtNum > 24) {
      throw new Error('Tribunal deve estar entre TRT1 e TRT24');
    }
  }

  if (params.grau !== undefined) {
    if (params.grau !== 'primeiro_grau' && params.grau !== 'segundo_grau') {
      throw new Error('Grau deve ser "primeiro_grau" ou "segundo_grau"');
    }
  }

  return atualizarCredencialPersistence(id, params);
}

