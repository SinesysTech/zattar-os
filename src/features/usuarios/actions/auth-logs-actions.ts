'use server';

import { buscarAuthLogsPorUsuario } from '../repository-auth-logs';
import { createServiceClient } from '@/lib/supabase/service-client';
import { requireAuth } from './utils';

export async function actionBuscarAuthLogs(usuarioId: number) {
  try {
    // Validar permissão para visualizar logs (pode ser ajustado conforme necessário)
    await requireAuth(['usuarios:visualizar']);

    const supabase = createServiceClient();

    // Buscar usuário sem cache para garantir auth_user_id atualizado
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('auth_user_id, email_corporativo')
      .eq('id', usuarioId)
      .single();

    if (usuarioError || !usuario) {
      return {
        success: false,
        error: 'Usuário não encontrado',
        data: []
      };
    }

    let authUserId: string | null = usuario.auth_user_id;

    // Fallback para exceções: resolve pelo e-mail na tabela auth.users
    if (!authUserId && usuario.email_corporativo) {
      const { data: authUser } = await supabase
        .schema('auth')
        .from('users')
        .select('id')
        .eq('email', usuario.email_corporativo)
        .maybeSingle();

      authUserId = authUser?.id ?? null;
    }

    // Se o usuário não tem auth_user_id, retornar array vazio
    if (!authUserId) {
      return {
        success: true,
        data: [],
      };
    }

    // Buscar logs de autenticação
    const logs = await buscarAuthLogsPorUsuario(authUserId);

    return {
      success: true,
      data: logs,
    };
  } catch (error) {
    console.error('Erro ao buscar logs de autenticação:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar logs',
      data: [],
    };
  }
}
