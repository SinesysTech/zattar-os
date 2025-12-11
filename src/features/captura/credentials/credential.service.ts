// Serviço para gerenciar credenciais de acesso aos tribunais
// Responsável por buscar credenciais do banco de dados

import type { CodigoTRT, GrauTRT, CredenciaisTRT } from '@/backend/types/captura/trt-types';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { getFromCache, setCache } from './credential-cache.service';

// Re-exportar getCredentialsBatch para facilitar imports
export { getCredentialsBatch } from './credential-cache.service';

/**
 * Parâmetros para buscar uma credencial
 */
interface GetCredentialParams {
  credentialId: number;
  userId?: string;
}

/**
 * Parâmetros para buscar credencial por TRT e grau
 */
interface GetCredentialByTribunalParams {
  advogadoId: number;
  tribunal: CodigoTRT;
  grau: GrauTRT;
}

/**
 * Busca uma credencial pelo ID no banco de dados
 * 
 * Quando userId é 'system' ou undefined, faz bypass de validação de permissão
 * (útil para jobs do sistema que precisam acessar qualquer credencial).
 * 
 * Para front-end, userId deve ser fornecido para validação de permissão futura.
 * 
 * @param params - Parâmetros de busca
 * @returns Credenciais ou null se não encontrado
 */
export async function getCredential(
  params: GetCredentialParams
): Promise<CredenciaisTRT | null> {
  const { credentialId } = params;
  const supabase = createServiceClient();

  // Buscar credencial no banco
  // createServiceClient() já bypassa RLS usando secret key
  // Quando userId === 'system' ou undefined, permite acesso a qualquer credencial
  // Quando userId fornecido (front-end), futuramente pode validar permissão aqui
  const { data: credencial, error } = await supabase
    .from('credenciais')
    .select(`
      id,
      advogado_id,
      senha,
      tribunal,
      grau,
      active,
      advogados (
        id,
        cpf,
        nome_completo
      )
    `)
    .eq('id', credentialId)
    .eq('active', true)
    .single();

  if (error || !credencial) {
    console.error('Erro ao buscar credencial:', error);
    return null;
  }

  // TODO: Quando userId fornecido e não for 'system', validar permissão
  // Por enquanto, permite acesso para qualquer userId (desenvolvimento)

  // advogados pode ser um objeto único ou array, mas com .single() deve ser objeto único
  // Tratamos ambos os casos para evitar erros de tipo
  const advogadoRaw = credencial.advogados;
  const advogado = Array.isArray(advogadoRaw)
    ? (advogadoRaw[0] as { cpf: string; nome_completo: string } | undefined)
    : (advogadoRaw as { cpf: string; nome_completo: string } | null);
  
  if (!advogado || !advogado.cpf) {
    console.error('Advogado não encontrado ou sem CPF');
    return null;
  }

  return {
    cpf: advogado.cpf,
    senha: credencial.senha,
  };
}

/**
 * Busca uma credencial por advogado, tribunal e grau
 * Útil para jobs do sistema que precisam buscar credenciais por TRT/grau
 * 
 * Esta função usa cache automaticamente:
 * 1. Primeiro verifica o cache
 * 2. Se não estiver no cache, busca no banco
 * 3. Salva no cache após buscar no banco
 * 
 * @param params - Parâmetros de busca
 * @returns Credenciais ou null se não encontrado
 */
export async function getCredentialByTribunalAndGrau(
  params: GetCredentialByTribunalParams
): Promise<CredenciaisTRT | null> {
  const { advogadoId, tribunal, grau } = params;

  // 1. Verificar cache primeiro
  const cached = getFromCache(advogadoId, tribunal, grau);
  if (cached) {
    return cached;
  }

  // 2. Se não estiver no cache, buscar no banco
  const supabase = createServiceClient();

  const { data: credencial, error } = await supabase
    .from('credenciais')
    .select(`
      id,
      advogado_id,
      senha,
      tribunal,
      grau,
      active,
      advogados (
        id,
        cpf,
        nome_completo
      )
    `)
    .eq('advogado_id', advogadoId)
    .eq('tribunal', tribunal)
    .eq('grau', grau)
    .eq('active', true)
    .single();

  if (error) {
    // Log detalhado para debug
    if (error.code === 'PGRST116') {
      console.error(`Credencial não encontrada para advogado_id=${advogadoId}, tribunal=${tribunal}, grau=${grau}, active=true`);
    } else {
      console.error('Erro ao buscar credencial:', {
        error,
        advogadoId,
        tribunal,
        grau,
      });
    }
    return null;
  }

  if (!credencial) {
    console.error(`Credencial não encontrada (null) para advogado_id=${advogadoId}, tribunal=${tribunal}, grau=${grau}`);
    return null;
  }

  // advogados pode ser um objeto único ou array, mas com .single() deve ser objeto único
  // Tratamos ambos os casos para evitar erros de tipo
  const advogadoRaw = credencial.advogados;
  const advogado = Array.isArray(advogadoRaw)
    ? (advogadoRaw[0] as { cpf: string; nome_completo: string } | undefined)
    : (advogadoRaw as { cpf: string; nome_completo: string } | null);

  if (!advogado || !advogado.cpf) {
    console.error('Advogado não encontrado ou sem CPF');
    return null;
  }

  // 3. Montar credencial e salvar no cache
  const credential: CredenciaisTRT = {
    cpf: advogado.cpf,
    senha: credencial.senha,
  };

  // Salvar no cache para próximas buscas
  setCache(advogadoId, tribunal, grau, credential);

  return credential;
}

/**
 * Busca todas as credenciais ativas para um TRT e grau específicos
 * Útil para jobs do sistema que processam capturas para múltiplos advogados
 * 
 * Esta função também popula o cache automaticamente para cada credencial encontrada.
 * 
 * @param tribunal - Código do tribunal
 * @param grau - Grau do processo
 * @returns Lista de credenciais com informações do advogado
 */
export async function getActiveCredentialsByTribunalAndGrau(
  tribunal: CodigoTRT,
  grau: GrauTRT
): Promise<Array<{
  credentialId: number;
  advogadoId: number;
  cpf: string;
  nomeCompleto: string;
  credenciais: CredenciaisTRT;
}>> {
  const supabase = createServiceClient();

  // Buscar todas as credenciais ativas para o TRT/grau
  const { data: credenciais, error } = await supabase
    .from('credenciais')
    .select(`
      id,
      advogado_id,
      senha,
      tribunal,
      grau,
      active,
      advogados (
        id,
        cpf,
        nome_completo
      )
    `)
    .eq('tribunal', tribunal)
    .eq('grau', grau)
    .eq('active', true);

  if (error || !credenciais) {
    console.error('Erro ao buscar credenciais:', error);
    return [];
  }

  // Montar resultado e popular cache
  const resultados = credenciais
    .map((credencial) => {
      // advogados pode ser um objeto único ou array
      // Tratamos ambos os casos para evitar erros de tipo
      const advogadoRaw = credencial.advogados;
      const advogado = Array.isArray(advogadoRaw)
        ? (advogadoRaw[0] as { id: number; cpf: string; nome_completo: string } | undefined)
        : (advogadoRaw as { id: number; cpf: string; nome_completo: string } | null);

      if (!advogado || !advogado.cpf) {
        return null;
      }

      const credential: CredenciaisTRT = {
        cpf: advogado.cpf,
        senha: credencial.senha,
      };

      // Popular cache para uso futuro
      setCache(advogado.id, tribunal, grau, credential);

      return {
        credentialId: credencial.id,
        advogadoId: advogado.id,
        cpf: advogado.cpf,
        nomeCompleto: advogado.nome_completo,
        credenciais: credential,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return resultados;
}

/**
 * Busca credencial completa por ID (incluindo tribunal e grau)
 * Retorna credenciais + informações do tribunal e grau
 */
export interface CredencialCompleta {
  credentialId: number;
  advogadoId: number;
  tribunal: CodigoTRT;
  grau: GrauTRT;
  credenciais: CredenciaisTRT;
}

export async function getCredentialComplete(
  credentialId: number
): Promise<CredencialCompleta | null> {
  const supabase = createServiceClient();

  const { data: credencial, error } = await supabase
    .from('credenciais')
    .select(`
      id,
      advogado_id,
      senha,
      tribunal,
      grau,
      active,
      advogados (
        id,
        cpf,
        nome_completo
      )
    `)
    .eq('id', credentialId)
    .eq('active', true)
    .single();

  if (error || !credencial) {
    console.error('Erro ao buscar credencial completa:', error);
    return null;
  }

  const advogadoRaw = credencial.advogados;
  const advogado = Array.isArray(advogadoRaw)
    ? (advogadoRaw[0] as { id: number; cpf: string; nome_completo: string } | undefined)
    : (advogadoRaw as { id: number; cpf: string; nome_completo: string } | null);

  if (!advogado || !advogado.cpf) {
    console.error('Advogado não encontrado ou sem CPF');
    return null;
  }

  return {
    credentialId: credencial.id,
    advogadoId: advogado.id,
    tribunal: credencial.tribunal as CodigoTRT,
    grau: credencial.grau as GrauTRT,
    credenciais: {
      cpf: advogado.cpf,
      senha: credencial.senha,
    },
  };
}

/**
 * Valida se uma credencial existe e está ativa
 */
export async function validateCredential(
  credentialId: number
): Promise<boolean> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('credenciais')
    .select('id, active')
    .eq('id', credentialId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.active === true;
}

/**
 * Busca informações do advogado associado a uma credencial
 */
export async function getAdvogadoByCredentialId(credentialId: number) {
  const supabase = createServiceClient();

  const { data: credencial, error } = await supabase
    .from('credenciais')
    .select(`
      advogado_id,
      advogados (
        id,
        cpf,
        nome_completo,
        oab,
        uf_oab
      )
    `)
    .eq('id', credentialId)
    .single();

  if (error || !credencial) {
    return null;
  }

  // advogados pode ser um objeto único ou array, mas com .single() deve ser objeto único
  // Tratamos ambos os casos para evitar erros de tipo
  const advogadoRaw = credencial.advogados;
  const advogado = Array.isArray(advogadoRaw)
    ? (advogadoRaw[0] as {
        id: number;
        cpf: string;
        nome_completo: string;
        oab: string;
        uf_oab: string;
      } | undefined)
    : (advogadoRaw as {
        id: number;
        cpf: string;
        nome_completo: string;
        oab: string;
        uf_oab: string;
      } | null);

  if (!advogado) {
    return null;
  }

  return advogado;
}
