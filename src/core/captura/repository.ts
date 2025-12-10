/**
 * CAPTURA REPOSITORY - Acesso a Dados
 *
 * Funções para buscar credenciais, configurações e salvar logs de captura.
 * Reutiliza serviços existentes quando possível.
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { getCredential } from '@/backend/captura/credentials/credential.service';
import type { Credencial } from './domain';
import type { ConfigTribunal } from './domain';
import { buscarConfigTribunal } from './drivers/factory';

/**
 * Busca credencial por ID
 */
export async function buscarCredencial(credentialId: number): Promise<Credencial | null> {
  const credencialTRT = await getCredential({ credentialId });

  if (!credencialTRT) {
    return null;
  }

  return {
    cpf: credencialTRT.cpf,
    senha: credencialTRT.senha,
  };
}

/**
 * Busca configuração do tribunal
 */
export async function buscarConfigTribunalRepo(tribunalId: string): Promise<ConfigTribunal | null> {
  return buscarConfigTribunal(tribunalId);
}

/**
 * Salva log de captura (placeholder - implementar conforme necessário)
 */
export async function salvarLogCaptura(params: {
  tribunalId: string;
  credencialId: number;
  tipo: string;
  resultado: unknown;
  erro?: string;
  duracaoMs: number;
}): Promise<void> {
  // TODO: Implementar persistência de logs
  console.log('📝 Log de captura:', params);
}
