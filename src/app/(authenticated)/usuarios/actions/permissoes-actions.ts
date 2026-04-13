
'use server';

import { requireAuth } from './utils';
import { revalidatePath } from 'next/cache';
import {
  listarPermissoesUsuario,
  substituirPermissoes
} from '../repository';
import { createServiceClient } from '@/lib/supabase/service-client';
import { obterTodasPermissoes, validarAtribuirPermissaoDTO } from '../types/types';
import type { Permissao } from '../domain';

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

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return { success: false, error: 'Usuário inválido para atualização de permissões' };
    }

    if (!Array.isArray(permissoes)) {
      return { success: false, error: 'Payload de permissões inválido' };
    }

    const invalidas = permissoes.filter((p) => !validarAtribuirPermissaoDTO(p));
    if (invalidas.length > 0) {
      return { success: false, error: 'Foram enviadas permissões inválidas' };
    }

    // Evita colisões de UNIQUE (usuario_id, recurso, operacao).
    const permissoesUnicas = Array.from(
      new Map(
        permissoes.map((p) => [`${p.recurso}:${p.operacao}`, p])
      ).values()
    );

    await substituirPermissoes(usuarioId, permissoesUnicas, userId);

    revalidatePath(`/app/usuarios/${usuarioId}`);

    return { success: true };
  } catch (error) {
    console.error('[Usuarios] Falha ao salvar permissões', {
      usuarioId,
      totalPermissoes: Array.isArray(permissoes) ? permissoes.length : 0,
      error,
    });
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao salvar permissões' };
  }
}
