
'use server';

import { createClient } from '@/backend/utils/supabase/server';


export async function actionObterPerfil() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Try to find custom user record
    // We can use obterUsuarioPorAuthId if exists, but we have userId from requireAuth logic usually.
    // But here we want the profile.
    
    // We can query by authUserId

    // Actually obtaining user from DB logic is in backend services.
    
    // If we look at existing /api/perfil:
    // It gets auth user, then queries `usuarios` table by `auth_user_id`.
    
    // Let's rely on standard service if possible.
    // `obterUsuarioPorId` requires ID (int). We have UUID.
    
    const { data: usuarioDb, error: dbError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
      
    if (dbError || !usuarioDb) {
       return { success: false, error: 'Perfil não encontrado' };
    }
    
    return { success: true, data: usuarioDb };

  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao obter perfil' };
  }
}
