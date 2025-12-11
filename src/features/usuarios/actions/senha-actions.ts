
'use server';

import { requireAuth } from './utils';
import { createServiceClient } from '@/backend/utils/supabase/service-client';

export async function actionRedefinirSenha(usuarioId: number, novaSenha: string) {
  try {
    await requireAuth(['usuarios:editar']); // Admin reset

    if (novaSenha.length < 8) return { success: false, error: 'Senha deve ter no mínimo 8 caracteres' };
    if (novaSenha.length > 72) return { success: false, error: 'Senha deve ter no máximo 72 caracteres' };

    const supabase = createServiceClient();

    // Get auth_user_id
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('auth_user_id')
      .eq('id', usuarioId)
      .single();

    if (userError || !usuario || !usuario.auth_user_id) {
      return { success: false, error: 'Usuário não vinculado ao Auth System' };
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      usuario.auth_user_id,
      { password: novaSenha }
    );

    if (updateError) return { success: false, error: updateError.message };

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao redefinir senha' };
  }
}

/**
 * Atualiza senha do usuário autenticado via Admin API
 * @description Apenas atualiza senha no Auth System. Verificação de senha atual
 * deve ser feita client-side antes de chamar esta action.
 * @param novaSenha Nova senha (8-72 caracteres)
 */
export async function actionAtualizarSenhaServer(novaSenha: string) {
  try {
    // Validar entrada
    if (novaSenha.length < 8) {
      return { success: false, error: 'Senha deve ter no mínimo 8 caracteres' };
    }
    if (novaSenha.length > 72) {
      return { success: false, error: 'Senha deve ter no máximo 72 caracteres' };
    }

    // Autenticar usuário e obter auth_user_id
    const { userId } = await requireAuth([]);

    const supabase = createServiceClient();
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('auth_user_id')
      .eq('id', userId)
      .eq('ativo', true)
      .single();

    if (userError || !usuario) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    if (!usuario.auth_user_id) {
      return { success: false, error: 'Usuário não vinculado ao sistema de autenticação' };
    }

    // Atualizar senha via Admin API (sem verificação de senha atual)
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      usuario.auth_user_id,
      { password: novaSenha }
    );

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao atualizar senha' };
  }
}
