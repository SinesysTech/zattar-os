// Serviço para gerenciar credenciais de acesso aos tribunais
// Responsável por buscar e descriptografar credenciais do banco de dados

import type { CodigoTRT, GrauTRT, CredenciaisTRT } from '@/backend/captura/services/trt/types';
import {
  getMockCredentialById,
  MOCK_ADVOGADO,
} from '@/dev_data/storage/mock-config';

/**
 * Parâmetros para buscar uma credencial
 */
interface GetCredentialParams {
  credentialId: number;
  userId?: string;
}

/**
 * Busca uma credencial pelo ID
 * 
 * TEMPORÁRIO: Durante desenvolvimento, usa dados mockados
 * TODO: Implementar busca no Supabase após validação do backend
 * 
 * @param params - Parâmetros de busca
 * @returns Credenciais descriptografadas ou null se não encontrado
 */
export async function getCredential(
  params: GetCredentialParams
): Promise<CredenciaisTRT | null> {
  const { credentialId } = params;

  // TEMPORÁRIO: Buscar em dados mockados
  const mockCredential = getMockCredentialById(credentialId);

  if (!mockCredential) {
    return null;
  }

  // Retornar credenciais descriptografadas
  // Em produção, aqui seria feita a descriptografia da senha_encrypted
  return {
    cpf: mockCredential.cpf,
    senha: mockCredential.senha,
  };
}

/**
 * Valida se uma credencial existe e está ativa
 * 
 * TEMPORÁRIO: Durante desenvolvimento, usa dados mockados
 */
export async function validateCredential(
  credentialId: number
): Promise<boolean> {
  const mockCredential = getMockCredentialById(credentialId);
  return mockCredential !== undefined && mockCredential.active === true;
}

/**
 * Busca informações do advogado associado a uma credencial
 * 
 * TEMPORÁRIO: Durante desenvolvimento, retorna dados mockados
 */
export async function getAdvogadoByCredentialId(credentialId: number) {
  const mockCredential = getMockCredentialById(credentialId);

  if (!mockCredential) {
    return null;
  }

  // TEMPORÁRIO: Retornar advogado mockado
  // Em produção, buscar no banco usando mockCredential.advogado_id
  return MOCK_ADVOGADO;
}
