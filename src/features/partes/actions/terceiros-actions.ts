'use server';

import { revalidatePath } from 'next/cache';
import type { ListarTerceirosParams } from '../domain';
import * as service from '../service';

export async function actionListarTerceiros(params: ListarTerceirosParams = {}) {
  try {
    const result = await service.listarTerceiros(params);
    if (!result.success) return { success: false, error: result.error.message };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarTerceiro(id: number) {
  try {
    const result = await service.buscarTerceiro(id);
    if (!result.success) return { success: false, error: result.error.message };
    if (!result.data) return { success: false, error: 'Terceiro não encontrado' };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarTerceiro(id: number, input: Parameters<typeof service.atualizarTerceiro>[1]) {
  try {
    const result = await service.atualizarTerceiro(id, input);
    if (!result.success) return { success: false, error: result.error.message };
    revalidatePath('/partes');
    revalidatePath(`/partes/terceiros/${id}`);
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}


