'use server';

import { revalidatePath } from 'next/cache';
import { authenticateRequest as getCurrentUser } from '@/lib/auth/session';
import { checkPermission } from '@/lib/auth/authorization';
import {
  listarCredenciais,
  buscarCredencial,
  criarCredencial,
  atualizarCredencial,
} from '../service';
import {
  criarCredencialSchema,
  atualizarCredencialSchema,
  type ListarCredenciaisParams,
  type CriarCredencialParams,
  type AtualizarCredencialParams,
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
    revalidatePath(`/advogados/${params.advogado_id}`);
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
    
    // We don't know the advogado_id easily without fetching, so revalidate path might be tricky for list. 
    // Usually revalidatePath('/advogados/[id]') works if we know it.
    // For now revalidate global list or assume page handles it.
    // Or fetch the credencial to know the advogado_id.
    const cred = await buscarCredencial(id);
    if (cred) revalidatePath(`/advogados/${cred.advogado_id}`);

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
