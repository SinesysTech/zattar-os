'use server';

import { revalidatePath } from 'next/cache';
import type { ListarClientesParams } from '../domain';
import * as service from '../service';

type ActionResponse<T> = { success: boolean; data?: T; error?: string };

export async function actionListarClientes(params: ListarClientesParams = {}) {
  try {
    const result = await service.listarClientes(params);
    if (!result.success) return { success: false, error: result.error.message };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarCliente(id: number) {
  try {
    const result = await service.buscarCliente(id);
    if (!result.success) return { success: false, error: result.error.message };
    if (!result.data) return { success: false, error: 'Cliente não encontrado' };
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarCliente(id: number, input: Parameters<typeof service.atualizarCliente>[1]) {
  try {
    const result = await service.atualizarCliente(id, input);
    if (!result.success) return { success: false, error: result.error.message };
    revalidatePath('/partes');
    revalidatePath(`/partes/clientes/${id}`);
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionListarClientesSugestoes(params?: { limit?: number }) {
  try {
    const limit = Math.min(Math.max(params?.limit ?? 20, 1), 100);
    const result = await service.listarClientes({ pagina: 1, limite: limit });
    if (!result.success) return { success: false, error: result.error.message };

    const options = result.data.data.map((c) => ({
      id: c.id,
      label: c.nome,
      cpf: (c as any).cpf ?? undefined,
      cnpj: (c as any).cnpj ?? undefined,
    }));

    return { success: true, data: { options } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}


