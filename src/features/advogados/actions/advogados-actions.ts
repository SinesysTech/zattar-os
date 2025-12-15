'use server';

import { revalidatePath } from 'next/cache';
import { authenticateRequest as getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/auth/authorization';
import {
  listarAdvogados,
  buscarAdvogado,
  criarAdvogado,
  atualizarAdvogado,
} from '../service';
import {
  criarAdvogadoSchema,
  atualizarAdvogadoSchema,
  type ListarAdvogadosParams,
  type CriarAdvogadoParams,
  type AtualizarAdvogadoParams,
} from '../domain';

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function actionListarAdvogados(
  params: ListarAdvogadosParams = {}
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const hasPermission = await checkPermission(user.id, 'advogados:visualizar');
    if (!hasPermission) return { success: false, error: 'Sem permissão' };

    const result = await listarAdvogados(params);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarAdvogado(id: number): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const hasPermission = await checkPermission(user.id, 'advogados:visualizar');
    if (!hasPermission) return { success: false, error: 'Sem permissão' };

    const result = await buscarAdvogado(id);
    if (!result) return { success: false, error: 'Advogado não encontrado' };
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionCriarAdvogado(params: CriarAdvogadoParams): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const hasPermission = await checkPermission(user.id, 'advogados:editar');
    if (!hasPermission) return { success: false, error: 'Sem permissão' };

    const validation = criarAdvogadoSchema.safeParse(params);
    if (!validation.success) {
        return { success: false, error: validation.error.errors[0].message };
    }

    const result = await criarAdvogado(params);
    revalidatePath('/advogados');
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarAdvogado(
  id: number, 
  params: AtualizarAdvogadoParams
): Promise<ActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const hasPermission = await checkPermission(user.id, 'advogados:editar');
    if (!hasPermission) return { success: false, error: 'Sem permissão' };

    const validation = atualizarAdvogadoSchema.safeParse(params);
    if (!validation.success) {
        return { success: false, error: validation.error.errors[0].message };
    }

    const result = await atualizarAdvogado(id, params);
    revalidatePath('/advogados');
    revalidatePath(`/advogados/${id}`);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
