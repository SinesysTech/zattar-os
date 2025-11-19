// Serviço para atribuir responsável a processos pendentes de manifestação
// Valida existência e permissões antes de atribuir

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  atribuirResponsavelPendente as rpcAtribuirResponsavel,
} from '@/backend/utils/supabase/set-user-context';
import { invalidatePendentesCache } from '@/lib/redis/invalidation';

export interface AtribuirResponsavelPendenteParams {
  pendenteId: number;
  responsavelId: number | null;
  usuarioExecutouId: number;
}

export interface AtribuirResponsavelPendenteResult {
  success: boolean;
  data: Record<string, unknown> | null;
  error?: string;
}

/**
 * Valida se o processo pendente existe
 */
async function validarPendenteExiste(pendenteId: number): Promise<boolean> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('pendentes_manifestacao')
    .select('id')
    .eq('id', pendenteId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Valida se o responsável existe (se fornecido)
 */
async function validarResponsavelExiste(responsavelId: number | null): Promise<boolean> {
  if (responsavelId === null) {
    return true; // null é válido (desatribuição)
  }

  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', responsavelId)
    .eq('ativo', true)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Valida se o usuário que executa a ação existe
 */
async function validarUsuarioExecutouExiste(usuarioId: number): Promise<boolean> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', usuarioId)
    .eq('ativo', true)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Atribui responsável a um processo pendente de manifestação
 * 
 * @param params - Parâmetros da atribuição
 * @returns Resultado da operação
 */
export async function atribuirResponsavelPendente(
  params: AtribuirResponsavelPendenteParams
): Promise<AtribuirResponsavelPendenteResult> {
  const { pendenteId, responsavelId, usuarioExecutouId } = params;

  try {
    // Validações
    const pendenteExiste = await validarPendenteExiste(pendenteId);
    if (!pendenteExiste) {
      return {
        success: false,
        data: null,
        error: 'Processo pendente não encontrado',
      };
    }

    const responsavelExiste = await validarResponsavelExiste(responsavelId);
    if (!responsavelExiste) {
      return {
        success: false,
        data: null,
        error: 'Responsável não encontrado ou inativo',
      };
    }

    const usuarioExiste = await validarUsuarioExecutouExiste(usuarioExecutouId);
    if (!usuarioExiste) {
      return {
        success: false,
        data: null,
        error: 'Usuário não encontrado ou inativo',
      };
    }

    // Executar atribuição via RPC (já define contexto de usuário)
    const supabase = createServiceClient();
    const resultado = await rpcAtribuirResponsavel(
      supabase,
      pendenteId,
      responsavelId,
      usuarioExecutouId
    );

    if (!resultado) {
      return {
        success: false,
        data: null,
        error: 'Erro ao atualizar processo pendente',
      };
    }

    // Invalidar cache de pendentes após atribuição bem-sucedida
    await invalidatePendentesCache();

    return {
      success: true,
      data: resultado,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}