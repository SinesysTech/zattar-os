
'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from './utils';
import { createServiceClient } from '@/lib/supabase/service-client';
import { invalidateUsuariosCache } from '@/lib/redis';

export async function actionUploadAvatar(usuarioId: number, formData: FormData) {
  try {
    await requireAuth(['usuarios:editar']);

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'Arquivo não fornecido' };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return { success: false, error: 'Arquivo muito grande (máx 5MB)' };
    }

    const supabase = createServiceClient();

    // 1. Upload file to avatars bucket
    const fileExt = file.name.split('.').pop();
    const fileName = `${usuarioId}-${Date.now()}.${fileExt}`;
    const filePath = fileName; // Usar apenas nome do arquivo sem subdiretório

    const { error: uploadError } = await supabase.storage
      .from('avatar')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      return { success: false, error: `Erro no upload: ${uploadError.message}` };
    }

    // 2. Get Public URL (armazenar apenas o path relativo)
    const { data: { publicUrl } } = supabase.storage.from('avatar').getPublicUrl(filePath);

    // 3. Update User (armazenar URL completa para compatibilidade)
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ avatar_url: publicUrl })
      .eq('id', usuarioId);

    if (updateError) return { success: false, error: `Erro ao atualizar usuário: ${updateError.message}` };

    await invalidateUsuariosCache();
    revalidatePath(`/app/usuarios/${usuarioId}`);
    revalidatePath('/app/perfil');
    
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
    revalidatePath(`/app/usuarios/${usuarioId}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao remover avatar' };
  }
}
