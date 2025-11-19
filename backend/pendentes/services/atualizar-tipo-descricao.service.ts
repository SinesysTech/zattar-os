import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { invalidatePendentesCache } from '@/lib/redis/invalidation';

export interface AtualizarTipoDescricaoParams {
  expedienteId: number;
  tipoExpedienteId: number | null;
  descricaoArquivos: string | null;
  usuarioExecutouId: number;
}

export interface AtualizarTipoDescricaoResult {
  success: boolean;
  data: Record<string, unknown> | null;
  error?: string;
}

/**
 * Valida se o expediente existe
 */
async function validarExpedienteExiste(expedienteId: number): Promise<boolean> {
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('pendentes_manifestacao')
    .select('id')
    .eq('id', expedienteId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Valida se o tipo de expediente existe (se fornecido)
 */
async function validarTipoExpedienteExiste(tipoExpedienteId: number | null): Promise<boolean> {
  if (tipoExpedienteId === null) {
    return true; // null é válido (sem tipo)
  }

  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('tipos_expedientes')
    .select('id')
    .eq('id', tipoExpedienteId)
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
 * Atualiza tipo e descrição de um expediente pendente de manifestação
 * 
 * @param params - Parâmetros da atualização
 * @returns Resultado da operação
 */
export async function atualizarTipoDescricaoExpediente(
  params: AtualizarTipoDescricaoParams
): Promise<AtualizarTipoDescricaoResult> {
  const { expedienteId, tipoExpedienteId, descricaoArquivos, usuarioExecutouId } = params;

  try {
    // Validações
    const expedienteExiste = await validarExpedienteExiste(expedienteId);
    if (!expedienteExiste) {
      return {
        success: false,
        data: null,
        error: 'Expediente não encontrado',
      };
    }

    const tipoExiste = await validarTipoExpedienteExiste(tipoExpedienteId);
    if (!tipoExiste) {
      return {
        success: false,
        data: null,
        error: 'Tipo de expediente não encontrado',
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

    // Executar atualização via RPC
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('atualizar_tipo_descricao_expediente', {
      p_expediente_id: expedienteId,
      p_usuario_executou_id: usuarioExecutouId,
      p_tipo_expediente_id: tipoExpedienteId,
      p_descricao_arquivos: descricaoArquivos || null,
    });

    if (error) {
      return {
        success: false,
        data: null,
        error: `Erro ao atualizar tipo e descrição: ${error.message}`,
      };
    }

    if (!data) {
      return {
        success: false,
        data: null,
        error: 'Erro ao atualizar tipo e descrição: nenhum dado retornado',
      };
    }

    // Invalidate cache after successful update
    await invalidatePendentesCache();

    return {
      success: true,
      data: data as Record<string, unknown>,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}