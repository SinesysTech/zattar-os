
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

export async function actionAlterarSenha(senhaAtual: string, novaSenha: string) {
  try {
    // Validar entrada
    if (novaSenha.length < 8) return { success: false, error: 'Senha deve ter no mínimo 8 caracteres' };
    if (novaSenha.length > 72) return { success: false, error: 'Senha deve ter no máximo 72 caracteres' };

    // Autenticar usuário e obter dados
    const { userId } = await requireAuth([]);
    
    const supabaseAdmin = createServiceClient();
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('email_corporativo, auth_user_id')
      .eq('id', userId)
      .eq('ativo', true)
      .single();
    
    if (userError || !usuario) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    if (!usuario.auth_user_id) {
      return { success: false, error: 'Usuário não vinculado ao sistema de autenticação' };
    }

    // Verificar senha atual usando signInWithPassword temporário
    // Isso é necessário pois não há API admin para validar senha atual
    const { createClient } = await import('@supabase/supabase-js');
    const tempClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    
    const { error: signInError } = await tempClient.auth.signInWithPassword({
      email: usuario.email_corporativo,
      password: senhaAtual
    });

    if (signInError) {
      return { success: false, error: 'Senha atual incorreta' };
    }

    // Atualizar senha usando Admin API (seguro após validação)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      usuario.auth_user_id,
      { password: novaSenha }
    );

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao alterar senha' };
  }
}
