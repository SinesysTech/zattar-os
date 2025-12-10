
'use server'

import { revalidatePath } from 'next/cache';
import * as service from '../service';
import { criarAcordoComParcelasSchema } from '../domain';
import { AtualizarAcordoParams, ListarAcordosParams } from '../types';

export async function actionListarAcordos(params: ListarAcordosParams) {
  try {
    const data = await service.listarAcordos(params);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarAcordo(id: number) {
  try {
    const data = await service.buscarAcordo(id);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionCriarAcordoComParcelas(formData: FormData | object) {
  try {
    const params = formData instanceof FormData 
      ? Object.fromEntries(formData) 
      : formData;
    
    // Type coercion for numbers if coming from FormData
    if (formData instanceof FormData) {
        // Simple helper to parse numbers
        const keysToNumber = ['processoId', 'valorTotal', 'numeroParcelas', 'percentualEscritorio', 'honorariosSucumbenciaisTotal', 'intervaloEntreParcelas'];
        keysToNumber.forEach(k => {
            if (params[k]) params[k] = Number(params[k]);
        });
    }

    const validacao = criarAcordoComParcelasSchema.safeParse(params);
    if (!validacao.success) {
      return { success: false, error: validacao.error.errors[0].message };
    }

    const data = await service.criarAcordoComParcelas(validacao.data);
    revalidatePath('/acordos-condenacoes');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarAcordo(id: number, dados: AtualizarAcordoParams) {
  try {
    const data = await service.atualizarAcordo(id, dados);
    revalidatePath(`/acordos-condenacoes/${id}`);
    revalidatePath('/acordos-condenacoes');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionDeletarAcordo(id: number) {
  try {
    await service.deletarAcordo(id);
    revalidatePath('/acordos-condenacoes');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
