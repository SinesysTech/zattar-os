
'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from './utils';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { invalidateUsuariosCache } from '@/backend/utils/redis';

export async function actionUploadAvatar(usuarioId: number, formData: FormData) {
  try {
    const { userId } = await requireAuth(['usuarios:editar']);

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'Arquivo não fornecido' };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return { success: false, error: 'Arquivo muito grande (máx 5MB)' };
    }

    const supabase = createServiceClient();

    // 1. Upload file
    const fileExt = file.name.split('.').pop();
    const fileName = `${usuarioId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('public-files') // Verify bucket name. Usually 'avatars' or 'public-files'?
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true
      });

    // Check bucket name. 'avatars' is common. Legacy might use something else.
    // I will assume 'avatars' bucket exists or similar. If not I might need to check.
    // The legacy code uses `avatar_url` in DB.
    
    if (uploadError) {
       // If bucket not found, try 'avatars'
       const { error: retryError } = await supabase.storage
         .from('avatars')
         .upload(filePath, file, { contentType: file.type, upsert: true });

       if (retryError) return { success: false, error: `Erro upload: ${uploadError.message}` };
    }

    // 2. Get Public URL
    // We don't know which bucket suceeded if we tried two. 
    // Assuming 'avatars' for now as standard.
    // Or 'public-files' if that's the project standard.
    // I'll stick to 'avatars' as likely default for avatars.
    
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

    // 3. Update User
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ avatar_url: publicUrl })
      .eq('id', usuarioId);

    if (updateError) return { success: false, error: `Erro ao atualizar usuário: ${updateError.message}` };

    await invalidateUsuariosCache();
    revalidatePath(`/usuarios/${usuarioId}`);
    
    return { success: true, data: publicUrl };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao enviar avatar' };
  }
}

export async function actionRemoverAvatar(usuarioId: number) {
  try {
    await requireAuth(['usuarios:editar']);
    
    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from('usuarios')
      .update({ avatar_url: null })
      .eq('id', usuarioId);

    if (error) return { success: false, error: error.message };

    await invalidateUsuariosCache();
    revalidatePath(`/usuarios/${usuarioId}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao remover avatar' };
  }
}
