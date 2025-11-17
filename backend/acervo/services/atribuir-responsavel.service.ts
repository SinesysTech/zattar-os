// Serviço para atribuir responsável a processos do acervo
// Valida existência e permissões antes de atribuir

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  atribuirResponsavelAcervo as rpcAtribuirResponsavel,
} from '@/backend/utils/supabase/set-user-context';

export interface AtribuirResponsavelAcervoParams {
  processoId: number;
  responsavelId: number | null;
  usuarioExecutouId: number;
}

export interface AtribuirResponsavelAcervoResult {
  success: boolean;
  data: Record<string, unknown> | null;
  error?: string;
}

/**
 * Valida se o processo existe
 */
async function validarProcessoExiste(processoId: number): Promise<boolean> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('acervo')
    .select('id')
    .eq('id', processoId)
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
 * Atribui responsável a um processo do acervo
 * 
 * @param params - Parâmetros da atribuição
 * @returns Resultado da operação
 */
export async function atribuirResponsavelAcervo(
  params: AtribuirResponsavelAcervoParams
): Promise<AtribuirResponsavelAcervoResult> {
  const { processoId, responsavelId, usuarioExecutouId } = params;

  try {
    // Validações
    const processoExiste = await validarProcessoExiste(processoId);
    if (!processoExiste) {
      return {
        success: false,
        data: null,
        error: 'Processo não encontrado',
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
      processoId,
      responsavelId,
      usuarioExecutouId
    );

    if (!resultado) {
      return {
        success: false,
        data: null,
        error: 'Erro ao atualizar processo',
      };
    }

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

