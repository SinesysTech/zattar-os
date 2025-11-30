// Serviço para criar credencial

import { criarCredencial as criarCredencialPersistence } from '../persistence/credencial-persistence.service';
import type { CriarCredencialParams, Credencial } from '@/backend/types/credenciais/types';

/**
 * Criar uma nova credencial
 */
export async function criarCredencial(params: CriarCredencialParams): Promise<Credencial> {
  // Validações básicas
  if (!params.advogado_id || params.advogado_id < 1) {
    throw new Error('ID do advogado é obrigatório');
  }

  if (!params.tribunal || !params.tribunal.trim()) {
    throw new Error('Tribunal é obrigatório');
  }

  // Validar formato de tribunal (TRT1 a TRT24 ou TST)
  const isTST = params.tribunal === 'TST';
  const tribunalMatch = params.tribunal.match(/^TRT(\d{1,2})$/);

  if (!isTST && !tribunalMatch) {
    throw new Error('Tribunal deve estar no formato TRT1 a TRT24 ou TST');
  }

  if (tribunalMatch) {
    const trtNum = parseInt(tribunalMatch[1], 10);
    if (trtNum < 1 || trtNum > 24) {
      throw new Error('Tribunal deve estar entre TRT1 e TRT24');
    }
  }

  // Validar grau
  const grausValidos = ['primeiro_grau', 'segundo_grau', 'tribunal_superior'];
  if (!params.grau || !grausValidos.includes(params.grau)) {
    throw new Error('Grau deve ser "primeiro_grau", "segundo_grau" ou "tribunal_superior"');
  }

  // TST deve ter grau tribunal_superior
  if (isTST && params.grau !== 'tribunal_superior') {
    throw new Error('TST deve ter grau "tribunal_superior"');
  }

  // TRTs não podem ter grau tribunal_superior
  if (!isTST && params.grau === 'tribunal_superior') {
    throw new Error('TRTs devem ter grau "primeiro_grau" ou "segundo_grau"');
  }

  if (!params.senha || !params.senha.trim()) {
    throw new Error('Senha é obrigatória');
  }

  return criarCredencialPersistence(params);
}

