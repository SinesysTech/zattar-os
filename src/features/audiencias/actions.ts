'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import * as service from './service';
import {
  createAudienciaSchema,
  ListarAudienciasParams,
  StatusAudiencia,
  updateAudienciaSchema,
  Audiencia,
} from './domain';
import { PaginatedResponse } from '@/lib/types';

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };

function formatZodErrors(zodError: z.ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};
  zodError.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(err.message);
  });
  return formattedErrors;
}

function revalidateAudienciasPaths() {
  // Rotas do dashboard
  revalidatePath('/audiencias');
  revalidatePath('/audiencias/semana');
  revalidatePath('/audiencias/mes');
  revalidatePath('/audiencias/ano');
  revalidatePath('/audiencias/lista');
  // Portal do cliente
  revalidatePath('/meu-processo/audiencias');
  // Dashboard principal (widget de audiências)
  revalidatePath('/');
}

export async function actionCriarAudiencia(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = Object.fromEntries(formData.entries());

  // Convert numeric and boolean fields from string
  const data = {
    ...rawData,
    processoId: rawData.processoId ? Number(rawData.processoId) : undefined,
    tipoAudienciaId: rawData.tipoAudienciaId ? Number(rawData.tipoAudienciaId) : undefined,
    responsavelId: rawData.responsavelId ? Number(rawData.responsavelId) : undefined,
  };

  const validation = createAudienciaSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: 'Erro de validação.',
      errors: formatZodErrors(validation.error),
      message: 'Por favor, corrija os erros no formulário.',
    };
  }

  const result = await service.criarAudiencia(validation.data);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao criar audiência.',
    };
  }

  revalidateAudienciasPaths();

  return {
    success: true,
    data: result.data,
    message: 'Audiência criada com sucesso.',
  };
}

export async function actionAtualizarAudiencia(
  id: number,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawData = Object.fromEntries(formData.entries());

  const data = {
    ...rawData,
    processoId: rawData.processoId ? Number(rawData.processoId) : undefined,
    tipoAudienciaId: rawData.tipoAudienciaId ? Number(rawData.tipoAudienciaId) : undefined,
    responsavelId: rawData.responsavelId ? Number(rawData.responsavelId) : undefined,
  };

  const validation = updateAudienciaSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: 'Erro de validação.',
      errors: formatZodErrors(validation.error),
      message: 'Por favor, corrija os erros no formulário.',
    };
  }

  const result = await service.atualizarAudiencia(id, validation.data);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao atualizar audiência.',
    };
  }

  revalidateAudienciasPaths();

  return {
    success: true,
    data: result.data,
    message: 'Audiência atualizada com sucesso.',
  };
}

export async function actionAtualizarStatusAudiencia(
  id: number,
  status: StatusAudiencia,
  statusDescricao?: string
): Promise<ActionResult> {
  const result = await service.atualizarStatusAudiencia(
    id,
    status,
    statusDescricao
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao atualizar status da audiência.',
    };
  }

  revalidateAudienciasPaths();

  return {
    success: true,
    data: result.data,
    message: 'Status da audiência atualizado com sucesso.',
  };
}

export async function actionListarAudiencias(
  params: ListarAudienciasParams
): Promise<ActionResult<PaginatedResponse<Audiencia>>> {
  const result = await service.listarAudiencias(params);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao listar audiências.',
    };
  }

  return {
    success: true,
    data: result.data,
    message: 'Audiências listadas com sucesso.',
  };
}

export async function actionBuscarAudienciaPorId(
  id: number
): Promise<ActionResult<Audiencia | null>> {
  const result = await service.buscarAudiencia(id);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao buscar audiência.',
    };
  }

  return {
    success: true,
    data: result.data,
    message: result.data ? 'Audiência encontrada.' : 'Audiência não encontrada.',
  };
}

export async function actionListarTiposAudiencia(params?: {
  trt?: string;
  grau?: string;
  limite?: number;
}): Promise<ActionResult<Array<{ id: number; descricao: string; is_virtual: boolean }>>> {
  try {
    const db = (await import('@/lib/supabase')).createDbClient();
    const limit = Math.min(Math.max(params?.limite ?? 200, 1), 1000);

    let query = db
      .from('tipo_audiencia')
      .select('id, descricao, is_virtual')
      .order('descricao', { ascending: true })
      .limit(limit);

    if (params?.trt) query = query.eq('trt', params.trt);
    if (params?.grau) query = query.eq('grau', params.grau);

    const { data, error } = await query;
    if (error) {
      return { success: false, error: error.message, message: 'Falha ao listar tipos de audiência.' };
    }

    return { success: true, data: (data as Array<{ id: number; descricao: string; is_virtual: boolean }>) ?? [], message: 'Tipos listados com sucesso.' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      message: 'Falha ao listar tipos de audiência.',
    };
  }
}

export async function actionListarSalasAudiencia(params?: {
  trt?: string;
  grau?: string;
  orgao_julgador_id?: number;
  limite?: number;
}): Promise<ActionResult<Array<{ id: number; nome: string }>>> {
  try {
    const db = (await import('@/lib/supabase')).createDbClient();
    const limit = Math.min(Math.max(params?.limite ?? 500, 1), 2000);

    let query = db
      .from('sala_audiencia')
      .select('id, nome')
      .order('nome', { ascending: true })
      .limit(limit);

    if (params?.trt) query = query.eq('trt', params.trt);
    if (params?.grau) query = query.eq('grau', params.grau);
    if (params?.orgao_julgador_id) query = query.eq('orgao_julgador_id', params.orgao_julgador_id);

    const { data, error } = await query;
    if (error) {
      return { success: false, error: error.message, message: 'Falha ao listar salas de audiência.' };
    }

    return { success: true, data: (data as Array<{ id: number; nome: string }>) ?? [], message: 'Salas listadas com sucesso.' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      message: 'Falha ao listar salas de audiência.',
    };
  }
}

export async function actionCriarAudienciaPayload(
  payload: z.infer<typeof createAudienciaSchema>
): Promise<ActionResult<Audiencia>> {
  const validation = createAudienciaSchema.safeParse(payload);
  if (!validation.success) {
    return {
      success: false,
      error: 'Erro de validação.',
      errors: formatZodErrors(validation.error),
      message: 'Por favor, corrija os erros no formulário.',
    };
  }

  const result = await service.criarAudiencia(validation.data);
  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao criar audiência.',
    };
  }

  revalidateAudienciasPaths();
  return {
    success: true,
    data: result.data,
    message: 'Audiência criada com sucesso.',
  };
}
