// Serviço de remoção de avatar de usuário
// Remove a imagem do Supabase Storage e atualiza a tabela usuarios

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import { deleteCached, invalidateUsuariosCache } from '@/backend/utils/redis';

// Bucket do Supabase Storage
const AVATAR_BUCKET = 'avatar';

/**
 * Resultado da remoção de avatar
 */
export interface RemoverAvatarResult {
  sucesso: boolean;
  erro?: string;
}

/**
 * Remove o avatar de um usuário
 */
export async function removerAvatar(usuarioId: number): Promise<RemoverAvatarResult> {
  const supabase = createServiceClient();

  try {
    // 1. Buscar usuário e verificar se tem avatar
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

    // 2. Se não tem avatar, retornar sucesso (nada a fazer)
    if (!usuario.avatar_url) {
      return {
        sucesso: true,
      };
    }

    // 3. Deletar arquivo do Storage
    const { error: erroDelete } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([usuario.avatar_url]);

    if (erroDelete) {
      console.warn('Aviso: Não foi possível deletar arquivo do Storage:', erroDelete.message);
      // Continua mesmo se não conseguir deletar o arquivo
      // (pode ter sido deletado manualmente ou não existir mais)
    }

    // 4. Atualizar avatar_url para NULL na tabela usuarios
    const { error: erroUpdate } = await supabase
      .from('usuarios')
      .update({ avatar_url: null })
      .eq('id', usuarioId);

    if (erroUpdate) {
      console.error('Erro ao remover avatar_url:', erroUpdate);
      return {
        sucesso: false,
        erro: `Erro ao atualizar usuário: ${erroUpdate.message}`,
      };
    }

    // 5. Invalidar cache do usuário
    await invalidateUsuariosCache();
    await deleteCached(`usuarios:id:${usuarioId}`);

    return {
      sucesso: true,
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao remover avatar:', error);
    return {
      sucesso: false,
      erro: `Erro inesperado: ${erroMsg}`,
    };
  }
}
