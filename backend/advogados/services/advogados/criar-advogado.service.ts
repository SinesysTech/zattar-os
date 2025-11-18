// Serviço para criar advogado

import { criarAdvogado as criarAdvogadoPersistence } from '../persistence/advogado-persistence.service';
import type { CriarAdvogadoParams, Advogado } from '@/backend/types/advogados/types';

/**
 * Criar um novo advogado
 */
export async function criarAdvogado(params: CriarAdvogadoParams): Promise<Advogado> {
  // Validações básicas
  if (!params.nome_completo || !params.nome_completo.trim()) {
    throw new Error('Nome completo é obrigatório');
  }

  if (!params.cpf || !params.cpf.trim()) {
    throw new Error('CPF é obrigatório');
  }

  if (!params.oab || !params.oab.trim()) {
    throw new Error('OAB é obrigatória');
  }

  if (!params.uf_oab || !params.uf_oab.trim()) {
    throw new Error('UF da OAB é obrigatória');
  }

  // Validar formato básico de CPF (11 dígitos)
  const cpfLimpo = params.cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) {
    throw new Error('CPF deve conter 11 dígitos');
  }

  // Validar formato básico de UF (2 letras)
  const ufLimpo = params.uf_oab.trim().toUpperCase();
  if (ufLimpo.length !== 2) {
    throw new Error('UF da OAB deve conter 2 letras');
  }

  return criarAdvogadoPersistence({
    nome_completo: params.nome_completo,
    cpf: cpfLimpo,
    oab: params.oab.trim(),
    uf_oab: ufLimpo,
  });
}

