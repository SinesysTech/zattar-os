// Serviço para atribuir responsável a processos do acervo
// Valida existência e permissões antes de atribuir

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import {
  atribuirResponsavelAcervo as rpcAtribuirResponsavel,
} from '@/backend/utils/supabase/set-user-context';
import { invalidateAcervoCache } from '@/backend/utils/redis/invalidation';

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
 * Atribui responsável a TODAS as instâncias de um processo unificado
 * Propaga a atribuição para todas as instâncias do mesmo numero_processo
 */
async function atribuirResponsavelTodasInstancias(
  processoId: number,
  responsavelId: number | null
): Promise<boolean> {
  const supabase = createServiceClient();

  // 1. Buscar numero_processo do processo fornecido
  const { data: processo, error: errorProcesso } = await supabase
    .from('acervo')
    .select('numero_processo')
    .eq('id', processoId)
    .single();

  if (errorProcesso || !processo) {
    throw new Error('Processo não encontrado para propagação');
  }

  const numeroProcesso = processo.numero_processo;

  // 2. Atualizar TODAS as instâncias com o mesmo numero_processo
  const { error: errorUpdate } = await supabase
    .from('acervo')
    .update({ responsavel_id: responsavelId, updated_at: new Date().toISOString() })
    .eq('numero_processo', numeroProcesso);

  if (errorUpdate) {
    throw new Error(`Erro ao propagar atribuição: ${errorUpdate.message}`);
  }

  return true;
}

/**
 * Atribui responsável a um processo do acervo
 * IMPORTANTE: Propaga a atribuição para TODAS as instâncias do mesmo numero_processo (unificação)
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

    // NOVO: Propagar atribuição para todas as instâncias do processo unificado
    await atribuirResponsavelTodasInstancias(processoId, responsavelId);

    // Ainda executar RPC para logging/auditoria na instância específica
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

    // Invalidar cache após atribuição bem-sucedida
    await invalidateAcervoCache();

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