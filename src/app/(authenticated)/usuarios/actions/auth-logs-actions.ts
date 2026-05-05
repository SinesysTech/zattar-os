'use server';

import {
  buscarAuthLogsPorUsuario,
  buscarUltimosLoginsPorAuthUsers,
} from '../repository-auth-logs';
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

/**
 * Busca o último sign-in (auth.users.last_sign_in_at) de múltiplos usuários
 * de uma vez. Devolve um Map<usuarioId, ISO string | null>.
 *
 * Usado pela listagem (cards/tabela) para popular o indicador de presença
 * sem fazer N+1 chamadas ao banco.
 */
export async function actionBuscarUltimosLogins(
  usuarioIds: number[],
): Promise<{
  success: boolean;
  data: Record<number, string | null>;
  error?: string;
}> {
  try {
    await requireAuth(['usuarios:visualizar']);

    if (usuarioIds.length === 0) {
      return { success: true, data: {} };
    }

    const supabase = createServiceClient();

    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, auth_user_id')
      .in('id', usuarioIds);

    if (usuariosError) {
      return {
        success: false,
        error: usuariosError.message,
        data: {},
      };
    }

    const idMap = new Map<string, number>();
    const authUserIds: string[] = [];

    for (const u of usuarios ?? []) {
      if (u.auth_user_id) {
        idMap.set(u.auth_user_id, u.id);
        authUserIds.push(u.auth_user_id);
      }
    }

    const ultimosLoginsMap = await buscarUltimosLoginsPorAuthUsers(authUserIds);

    const result: Record<number, string | null> = {};
    for (const id of usuarioIds) {
      result[id] = null;
    }
    for (const [authId, lastSignInAt] of ultimosLoginsMap.entries()) {
      const usuarioId = idMap.get(authId);
      if (usuarioId !== undefined) {
        result[usuarioId] = lastSignInAt;
      }
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao buscar últimos logins em batch:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar últimos logins',
      data: {},
    };
  }
}

/**
 * Conveniência: último login de um único usuário. Usado pela página de
 * detalhes (sidebar). Reusa a action batch para manter uma única fonte.
 */
export async function actionBuscarUltimoLogin(
  usuarioId: number,
): Promise<{ success: boolean; data: string | null; error?: string }> {
  const res = await actionBuscarUltimosLogins([usuarioId]);
  if (!res.success) {
    return { success: false, data: null, error: res.error };
  }
  return { success: true, data: res.data[usuarioId] ?? null };
}
