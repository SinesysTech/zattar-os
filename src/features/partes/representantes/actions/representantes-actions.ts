'use server';

import { revalidatePath } from 'next/cache';
import type {
  AtualizarRepresentanteParams,
  BuscarRepresentantesPorOABParams,
  CriarRepresentanteParams,
  ListarRepresentantesParams,
  UpsertRepresentantePorCPFParams,
} from '../../types/representantes-types';
import * as service from '../service';

type ActionResponse<T> = { success: boolean; data?: T; error?: string };

export async function actionListarRepresentantes(
  params: ListarRepresentantesParams & { incluirEndereco?: boolean; incluirProcessos?: boolean }
): Promise<ActionResponse<Awaited<ReturnType<typeof service.listarRepresentantes>>>> {
  try {
    const incluirEndereco = params.incluirEndereco ?? false;
    const incluirProcessos = params.incluirProcessos ?? false;

    const { incluirEndereco: _, incluirProcessos: __, ...listParams } = params;

    const data = incluirProcessos
      ? await service.listarRepresentantesComEnderecoEProcessos(listParams)
      : incluirEndereco
        ? await service.listarRepresentantesComEndereco(listParams)
        : await service.listarRepresentantes(listParams);

    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarRepresentantePorId(
  id: number,
  opts?: { incluirEndereco?: boolean }
): Promise<ActionResponse<unknown>> {
  try {
    const incluirEndereco = opts?.incluirEndereco ?? false;
    const data = incluirEndereco
      ? await service.buscarRepresentantePorIdComEndereco(id)
      : await service.buscarRepresentantePorId(id);

    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionCriarRepresentante(
  params: CriarRepresentanteParams
): Promise<ActionResponse<unknown>> {
  try {
    const data = await service.criarRepresentante(params);
    revalidatePath('/partes');
    return { success: data.sucesso, data, error: data.sucesso ? undefined : data.erro };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionAtualizarRepresentante(
  params: AtualizarRepresentanteParams
): Promise<ActionResponse<unknown>> {
  try {
    const data = await service.atualizarRepresentante(params);
    revalidatePath('/partes');
    revalidatePath(`/partes/representantes/${params.id}`);
    return { success: data.sucesso, data, error: data.sucesso ? undefined : data.erro };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionDeletarRepresentante(id: number): Promise<ActionResponse<unknown>> {
  try {
    const data = await service.deletarRepresentante(id);
    revalidatePath('/partes');
    return { success: data.sucesso, data, error: data.sucesso ? undefined : data.erro };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionUpsertRepresentantePorCPF(
  params: UpsertRepresentantePorCPFParams
): Promise<ActionResponse<unknown>> {
  try {
    const data = await service.upsertRepresentantePorCPF(params);
    revalidatePath('/partes');
    return { success: data.sucesso, data, error: data.sucesso ? undefined : data.erro };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarRepresentantePorNome(nome: string): Promise<ActionResponse<unknown>> {
  try {
    const data = await service.buscarRepresentantePorNome(nome);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function actionBuscarRepresentantesPorOAB(
  params: BuscarRepresentantesPorOABParams
): Promise<ActionResponse<unknown>> {
  try {
    const data = await service.buscarRepresentantesPorOAB(params);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}


