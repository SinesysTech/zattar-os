
'use server';

import { requireAuth } from './utils';
import { revalidatePath } from 'next/cache';
import { 
  listarPermissoesUsuario, 
  atribuirPermissoesBatch, 
  substituirPermissoes 
} from '../repository';
import { createServiceClient } from '@/lib/supabase/service-client';
import { obterTodasPermissoes, validarAtribuirPermissoesDTO } from '@/features/usuarios/types/types';
import type { Permissao } from '../types';

export async function actionListarPermissoes(usuarioId: number) {
  try {
    await requireAuth(['usuarios:visualizar']);

    // Check if user is super admin
    const supabase = createServiceClient();
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, is_super_admin')
      .eq('id', usuarioId)
      .single();

    if (error || !usuario) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    if (usuario.is_super_admin) {
      const todasPermissoes = obterTodasPermissoes();
      return {
        success: true,
        data: {
          usuario_id: usuarioId,
          is_super_admin: true,
          permissoes: todasPermissoes.map((p) => ({
            recurso: p.recurso,
            operacao: p.operacao,
            permitido: true,
          })),
        },
      };
    }

    const permissoes = await listarPermissoesUsuario(usuarioId);
    return {
      success: true,
      data: {
        usuario_id: usuarioId,
        is_super_admin: false,
        permissoes: permissoes.map((p) => ({
          recurso: p.recurso,
          operacao: p.operacao,
          permitido: p.permitido,
        })),
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao listar permissões' };
  }
}

export async function actionSalvarPermissoes(usuarioId: number, permissoes: Permissao[]) {
  try {
    const { userId } = await requireAuth(['usuarios:gerenciar_permissoes']);

    // Validate input
    // We construct proper DTO expected by backend
    // backend expects { recurso, operacao, permitido }
    // Permissao type has { recurso, operacao, permitido }
    
    // We can use validarAtribuirPermissoesDTO if needed, but we are passing array directly. 
    // Not wrapping in { permissoes: ... }.
    
    // Call service to replace permissions
    await substituirPermissoes(usuarioId, permissoes, userId);
    
    revalidatePath(`/usuarios/${usuarioId}`);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao salvar permissões' };
  }
}
