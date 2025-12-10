
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
    // Check auth but we need to authenticate against Supabase Auth with password to change it?
    // Or can we use admin if we validated current password?
    // Supabase Client SDK `updateUser` requires being logged in.
    // Since this is a server action, we don't have the user's session strictly in the same way for `updateUser` unless we exchange token.
    // However, we can verify checking 'senhaAtual' via re-login attempt or just use admin if we trust the session (cookie).
    // The requirement "actionAlterarSenha(senhaAtual, novaSenha)" implies checking current password.
    // We can try `supabase.auth.signInWithPassword` to validate current password.

    const { userId } = await requireAuth([]); // Just need to be logged in
    
    // Get user email
    const supabaseAdmin = createServiceClient();
    const { data: usuario } = await supabaseAdmin.from('usuarios').select('email_corporativo, auth_user_id').eq('id', userId).single();
    
    if (!usuario) return { success: false, error: 'Usuário não encontrado' };

    // Verify current password by signing in (creating a throwaway client or using REST)
    // Using simple fetch to verify credentials to avoid messing with current session?
    // Or simple `supabase.auth.signInWithPassword` with a new client instance.
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

    // Update password as Admin (safe since we verified current)
    // Or update as user using the session from signIn? Yes.
    // Actually we can just used the signed in tempClient to update pass.
    
    const { error: updateError } = await tempClient.auth.updateUser({
      password: novaSenha
    });

    if (updateError) return { success: false, error: updateError.message };

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao alterar senha' };
  }
}
