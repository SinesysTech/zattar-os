import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { invalidatePendentesCache } from '@/backend/utils/redis/invalidation';

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
    .from('expedientes')
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
    const expedienteExiste = await validarExpedienteExiste(expedienteId);
    if (!expedienteExiste) {
      return { success: false, data: null, error: 'Expediente não encontrado' };
    }

    const tipoExiste = await validarTipoExpedienteExiste(tipoExpedienteId);
    if (!tipoExiste) {
      return { success: false, data: null, error: 'Tipo de expediente não encontrado' };
    }

    const usuarioExiste = await validarUsuarioExecutouExiste(usuarioExecutouId);
    if (!usuarioExiste) {
      return { success: false, data: null, error: 'Usuário não encontrado ou inativo' };
    }

    const supabase = createServiceClient();

    const { data: atualAntes, error: getError } = await supabase
      .from('expedientes')
      .select('id, tipo_expediente_id, descricao_arquivos')
      .eq('id', expedienteId)
      .single();
    if (getError || !atualAntes) {
      return { success: false, data: null, error: 'Expediente não encontrado' };
    }

    const { data: atualizado, error: updError } = await supabase
      .from('expedientes')
      .update({
        tipo_expediente_id: tipoExpedienteId,
        descricao_arquivos: descricaoArquivos || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', expedienteId)
      .select('*')
      .single();

    if (updError || !atualizado) {
      return {
        success: false,
        data: null,
        error: updError?.message || 'Erro ao atualizar tipo e descrição',
      };
    }

    try {
      await supabase.from('logs_alteracao').insert({
        tipo_entidade: 'expedientes',
        entidade_id: expedienteId,
        tipo_evento: 'alteracao_tipo_descricao',
        usuario_que_executou_id: usuarioExecutouId,
        dados_evento: {
          tipo_expediente_id_anterior: (atualAntes as any).tipo_expediente_id ?? null,
          tipo_expediente_id_novo: (atualizado as any).tipo_expediente_id ?? null,
          descricao_arquivos_anterior: (atualAntes as any).descricao_arquivos ?? null,
          descricao_arquivos_novo: (atualizado as any).descricao_arquivos ?? null,
          alterado_em: new Date().toISOString(),
        },
      });
    } catch {}

    await invalidatePendentesCache();

    return { success: true, data: atualizado as Record<string, unknown> };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
