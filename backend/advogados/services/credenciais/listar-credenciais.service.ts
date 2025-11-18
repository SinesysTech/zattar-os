// Serviço para listar credenciais de um advogado

import { listarCredenciais as listarCredenciaisPersistence } from '../persistence/credencial-persistence.service';
import type { ListarCredenciaisParams, CredencialComAdvogado } from '@/backend/types/credenciais/types';

/**
 * Listar credenciais de um advogado
 */
export async function listarCredenciais(
  params: ListarCredenciaisParams
): Promise<CredencialComAdvogado[]> {
  // Validações básicas
  if (!params.advogado_id || params.advogado_id < 1) {
    throw new Error('ID do advogado é obrigatório');
  }

  return listarCredenciaisPersistence(params);
}

