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
  revalidatePath('/audiencias');
  revalidatePath('/audiencias/semana');
  revalidatePath('/audiencias/mes');
  revalidatePath('/audiencias/ano');
  revalidatePath('/audiencias/lista');
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
