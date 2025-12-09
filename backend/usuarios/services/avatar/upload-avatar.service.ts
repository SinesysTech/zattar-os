// Serviço de upload de avatar de usuário
// Faz upload da imagem para o Supabase Storage e atualiza a tabela usuarios

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { deleteCached, invalidateUsuariosCache } from '@/backend/utils/redis';

// Tipos de imagem permitidos
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Tamanho máximo: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Bucket do Supabase Storage
const AVATAR_BUCKET = 'avatar';

/**
 * Resultado do upload de avatar
 */
export interface UploadAvatarResult {
  sucesso: boolean;
  avatarUrl?: string;
  erro?: string;
}

/**
 * Parâmetros para upload de avatar
 */
export interface UploadAvatarParams {
  usuarioId: number;
  file: Buffer;
  mimeType: string;
  fileName: string;
}

/**
 * Obtém a extensão do arquivo baseado no MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return extensions[mimeType] || 'jpg';
}

/**
 * Faz upload do avatar de um usuário
 */
export async function uploadAvatar(params: UploadAvatarParams): Promise<UploadAvatarResult> {
  const { usuarioId, file, mimeType, fileName } = params;
  const supabase = createServiceClient();

  try {
    // 1. Validar MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        sucesso: false,
        erro: 'Formato não suportado. Use JPEG, PNG ou WebP.',
      };
    }

    // 2. Validar tamanho do arquivo
    if (file.length > MAX_FILE_SIZE) {
      return {
        sucesso: false,
        erro: 'Imagem muito grande. Tamanho máximo: 2MB.',
      };
    }

    // 3. Verificar se usuário existe
    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('id, avatar_url')
      .eq('id', usuarioId)
      .single();

    if (erroUsuario || !usuario) {
      return {
        sucesso: false,
        erro: 'Usuário não encontrado.',
      };
    }

    // 4. Deletar avatar anterior se existir
    if (usuario.avatar_url) {
      const { error: erroDelete } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove([usuario.avatar_url]);

      if (erroDelete) {
        console.warn('Aviso: Não foi possível deletar avatar anterior:', erroDelete.message);
        // Continua mesmo se não conseguir deletar o anterior
      }
    }

    // 5. Gerar nome do arquivo: {usuarioId}.{ext}
    const extension = getExtensionFromMimeType(mimeType);
    const storagePath = `${usuarioId}.${extension}`;

    // 6. Fazer upload para o Supabase Storage
    const { error: erroUpload } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(storagePath, file, {
        contentType: mimeType,
        upsert: true, // Sobrescreve se já existir
      });

    if (erroUpload) {
      console.error('Erro ao fazer upload do avatar:', erroUpload);
      return {
        sucesso: false,
        erro: `Erro ao fazer upload: ${erroUpload.message}`,
      };
    }

    // 7. Atualizar avatar_url na tabela usuarios
    const { error: erroUpdate } = await supabase
      .from('usuarios')
      .update({ avatar_url: storagePath })
      .eq('id', usuarioId);

    if (erroUpdate) {
      console.error('Erro ao atualizar avatar_url:', erroUpdate);
      // Tentar reverter o upload
      await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);
      return {
        sucesso: false,
        erro: `Erro ao atualizar usuário: ${erroUpdate.message}`,
      };
    }

    // 8. Invalidar cache do usuário
    await invalidateUsuariosCache();
    await deleteCached(`usuarios:id:${usuarioId}`);

    // 9. Gerar URL pública
    const { data: publicUrlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(storagePath);

    // Adicionar timestamp para cache-busting
    const avatarUrlWithTimestamp = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    return {
      sucesso: true,
      avatarUrl: avatarUrlWithTimestamp,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao fazer upload do avatar:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}

/**
 * Gera a URL pública do avatar de um usuário
 */
export function getAvatarPublicUrl(avatarPath: string | null): string | null {
  if (!avatarPath) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  // Adicionar timestamp para cache-busting
  return `${supabaseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/${avatarPath}?t=${Date.now()}`;
}
