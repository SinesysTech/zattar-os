'use server';

import { revalidatePath } from 'next/cache';
import type { ListarPartesContrariasParams } from '../domain';
import * as service from '../service';

export async function actionListarPartesContrarias(params: ListarPartesContrariasParams = {}) {
  try {
    const result = await service.listarPartesContrarias(params);
    if (!result.success) return { success: false, error: result.error.message };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarParteContraria(id: number) {
  try {
    const result = await service.buscarParteContraria(id);
    if (!result.success) return { success: false, error: result.error.message };
    if (!result.data) return { success: false, error: 'Parte contrária não encontrada' };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarParteContraria(id: number, input: Parameters<typeof service.atualizarParteContraria>[1]) {
  try {
    const result = await service.atualizarParteContraria(id, input);
    if (!result.success) return { success: false, error: result.error.message };
    revalidatePath('/partes');
    revalidatePath(`/partes/partes-contrarias/${id}`);
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}


