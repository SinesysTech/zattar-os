// Helper para atribuir responsável usando funções RPC do Supabase
// As funções RPC já definem o contexto de usuário internamente para os triggers funcionarem

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Atribui responsável a um processo do acervo
 * Usa função RPC que define contexto de usuário automaticamente
 * 
 * @param supabase - Cliente Supabase
 * @param processoId - ID do processo
 * @param responsavelId - ID do responsável (ou null para desatribuir)
 * @param usuarioExecutouId - ID do usuário que está executando a ação
 * @returns Dados atualizados do processo ou null se não encontrado
 */
export async function atribuirResponsavelAcervo(
  supabase: SupabaseClient,
  processoId: number,
  responsavelId: number | null,
  usuarioExecutouId: number
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.rpc('atribuir_responsavel_acervo', {
    processo_id: processoId,
    responsavel_id_param: responsavelId,
    usuario_executou_id: usuarioExecutouId,
  });

  if (error) {
    throw new Error(`Erro ao atribuir responsável ao processo: ${error.message}`);
  }

  return data as Record<string, unknown> | null;
}

/**
 * Atribui responsável a uma audiência
 * Usa função RPC que define contexto de usuário automaticamente
 * 
 * @param supabase - Cliente Supabase
 * @param audienciaId - ID da audiência
 * @param responsavelId - ID do responsável (ou null para desatribuir)
 * @param usuarioExecutouId - ID do usuário que está executando a ação
 * @returns Dados atualizados da audiência ou null se não encontrado
 */
export async function atribuirResponsavelAudiencia(
  supabase: SupabaseClient,
  audienciaId: number,
  responsavelId: number | null,
  usuarioExecutouId: number
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.rpc('atribuir_responsavel_audiencia', {
    audiencia_id: audienciaId,
    responsavel_id_param: responsavelId,
    usuario_executou_id: usuarioExecutouId,
  });

  if (error) {
    throw new Error(`Erro ao atribuir responsável à audiência: ${error.message}`);
  }

  return data as Record<string, unknown> | null;
}

/**
 * Atribui responsável a um processo pendente de manifestação
 * Usa função RPC que define contexto de usuário automaticamente
 * 
 * @param supabase - Cliente Supabase
 * @param pendenteId - ID do processo pendente
 * @param responsavelId - ID do responsável (ou null para desatribuir)
 * @param usuarioExecutouId - ID do usuário que está executando a ação
 * @returns Dados atualizados do processo pendente ou null se não encontrado
 */
export async function atribuirResponsavelPendente(
  supabase: SupabaseClient,
  pendenteId: number,
  responsavelId: number | null,
  usuarioExecutouId: number
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.rpc('atribuir_responsavel_pendente', {
    pendente_id: pendenteId,
    responsavel_id_param: responsavelId,
    usuario_executou_id: usuarioExecutouId,
  });

  if (error) {
    throw new Error(`Erro ao atribuir responsável ao processo pendente: ${error.message}`);
  }

  return data as Record<string, unknown> | null;
}

