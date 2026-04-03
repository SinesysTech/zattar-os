'use server';

import { revalidatePath } from 'next/cache';
import { authenticateRequest as getCurrentUser } from '@/lib/auth/session';
import { checkPermission } from '@/lib/auth/authorization';
import {
  listarCredenciais,
  buscarCredencial,
  criarCredencial,
  atualizarCredencial,
  criarCredenciaisEmLote,
  atualizarStatusCredenciaisEmLote,
} from '../service';
import {
  criarCredencialSchema,
  atualizarCredencialSchema,
  criarCredenciaisEmLoteSchema,
  type ListarCredenciaisParams,
  type CriarCredencialParams,
  type AtualizarCredencialParams,
  type CriarCredenciaisEmLoteParams,
} from '../domain';
import type { ActionResponse } from './advogados-actions'; // Reuse type

export async function actionListarCredenciais(
  params: ListarCredenciaisParams
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const [recurso, operacao] = 'credenciais:visualizar'.split(':');
    const hasPermission = await checkPermission(user.id, recurso, operacao);
    if (!hasPermission) return { success: false, error: 'Sem permissão' };

    const result = await listarCredenciais(params);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarCredencial(id: number): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const [recurso, operacao] = 'credenciais:visualizar'.split(':');
    const hasPermission = await checkPermission(user.id, recurso, operacao);
    if (!hasPermission) return { success: false, error: 'Sem permissão' };

    const result = await buscarCredencial(id);
    if (!result) return { success: false, error: 'Credencial não encontrada' };
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionCriarCredencial(params: CriarCredencialParams): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const [recurso, operacao] = 'credenciais:editar'.split(':');
    const hasPermission = await checkPermission(user.id, recurso, operacao);
    if (!hasPermission) return { success: false, error: 'Sem permissão' };

    const validation = criarCredencialSchema.safeParse(params);
    if (!validation.success) {
        return { success: false, error: validation.error.errors[0].message };
    }

    const result = await criarCredencial(params);
    revalidatePath('/app/captura/credenciais');
    revalidatePath('/app/captura/advogados');
    return { success: true, data: result };
  } catch (error) {
     return { success: false, error: String(error) };
  }
}

export async function actionAtualizarCredencial(
  id: number,
  params: AtualizarCredencialParams
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const [recurso, operacao] = 'credenciais:editar'.split(':');
    const hasPermission = await checkPermission(user.id, recurso, operacao);
    if (!hasPermission) return { success: false, error: 'Sem permissão' };

     const validation = atualizarCredencialSchema.safeParse(params);
    if (!validation.success) {
        return { success: false, error: validation.error.errors[0].message };
    }

    const result = await atualizarCredencial(id, params);
    
    revalidatePath('/app/captura/credenciais');
    revalidatePath('/app/captura/advogados');

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Criar credenciais em lote para múltiplos tribunais e graus
 */
export async function actionCriarCredenciaisEmLote(
  params: CriarCredenciaisEmLoteParams
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const [recurso, operacao] = 'credenciais:editar'.split(':');
    const hasPermission = await checkPermission(user.id, recurso, operacao);
    if (!hasPermission) return { success: false, error: 'Sem permissão' };

    const validation = criarCredenciaisEmLoteSchema.safeParse(params);
    if (!validation.success) {
      return { success: false, error: validation.error.errors[0].message };
    }

    const result = await criarCredenciaisEmLote(validation.data);

    revalidatePath('/app/captura/credenciais');
    revalidatePath('/app/captura/advogados');

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Atualizar status (ativar/desativar) de múltiplas credenciais em lote
 */
export async function actionAtualizarStatusCredenciaisEmLote(
  ids: number[],
  active: boolean
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const [recurso, operacao] = 'credenciais:editar'.split(':');
    const hasPermission = await checkPermission(user.id, recurso, operacao);
    if (!hasPermission) return { success: false, error: 'Sem permissão' };

    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: false, error: 'Nenhuma credencial selecionada' };
    }

    const atualizadas = await atualizarStatusCredenciaisEmLote(ids, active);

    revalidatePath('/app/captura/credenciais');
    revalidatePath('/app/captura/advogados');

    return { success: true, data: { atualizadas } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
