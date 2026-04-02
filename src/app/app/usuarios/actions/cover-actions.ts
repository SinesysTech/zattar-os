'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from './utils';
import { createServiceClient } from '@/lib/supabase/service-client';
import { invalidateUsuariosCache } from '@/lib/redis';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function actionUploadCover(usuarioId: number, formData: FormData) {
  try {
    await requireAuth(['usuarios:editar']);

    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'Arquivo não fornecido' };
    }

    // Validar tipo de arquivo
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.'
      };
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'Arquivo muito grande (máx 10MB)' };
    }

    const supabase = createServiceClient();

    // 1. Upload file to covers bucket
    const fileExt = file.name.split('.').pop();
    const fileName = `${usuarioId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      return { success: false, error: `Erro no upload: ${uploadError.message}` };
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(filePath);

    // 3. Update User
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ cover_url: publicUrl })
      .eq('id', usuarioId);

    if (updateError) {
      return { success: false, error: `Erro ao atualizar usuário: ${updateError.message}` };
    }

    await invalidateUsuariosCache();
    revalidatePath(`/app/usuarios/${usuarioId}`);
    revalidatePath('/app/perfil');

    return { success: true, data: publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao enviar capa'
    };
  }
}

export async function actionRemoverCover(usuarioId: number) {
  try {
    await requireAuth(['usuarios:editar']);

    const supabase = createServiceClient();

    const { error } = await supabase
      .from('usuarios')
      .update({ cover_url: null })
      .eq('id', usuarioId);

    if (error) {
      return { success: false, error: error.message };
    }

    await invalidateUsuariosCache();
    revalidatePath(`/app/usuarios/${usuarioId}`);
    revalidatePath('/app/perfil');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao remover capa'
    };
  }
}
