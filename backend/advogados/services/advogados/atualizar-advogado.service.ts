// Serviço para atualizar advogado

import { atualizarAdvogado as atualizarAdvogadoPersistence } from '../persistence/advogado-persistence.service';
import type { AtualizarAdvogadoParams, Advogado } from '@/backend/types/advogados/types';

/**
 * Atualizar advogado
 */
export async function atualizarAdvogado(
  id: number,
  params: AtualizarAdvogadoParams
): Promise<Advogado> {
  if (!id || id < 1) {
    throw new Error('ID inválido');
  }

  // Validar se pelo menos um campo foi fornecido
  if (
    params.nome_completo === undefined &&
    params.cpf === undefined &&
    params.oab === undefined &&
    params.uf_oab === undefined
  ) {
    throw new Error('Pelo menos um campo deve ser fornecido para atualização');
  }

  // Validações de formato se campos fornecidos
  if (params.cpf !== undefined) {
    const cpfLimpo = params.cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      throw new Error('CPF deve conter 11 dígitos');
    }
    params.cpf = cpfLimpo;
  }

  if (params.uf_oab !== undefined) {
    const ufLimpo = params.uf_oab.trim().toUpperCase();
    if (ufLimpo.length !== 2) {
      throw new Error('UF da OAB deve conter 2 letras');
    }
    params.uf_oab = ufLimpo;
  }

  return atualizarAdvogadoPersistence(id, params);
}

