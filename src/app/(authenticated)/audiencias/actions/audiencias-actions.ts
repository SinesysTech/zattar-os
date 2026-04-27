'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import * as service from '../service';
import {
  createAudienciaSchema,
  EnderecoPresencial,
  ListarAudienciasParams,
  StatusAudiencia,
  updateAudienciaSchema,
  Audiencia,
  type ResumoUltimaCapturaAudiencias,
} from '../domain';
import { PaginatedResponse } from '@/types';
import { authenticateRequest as getCurrentUser } from '@/lib/auth/session';
import { checkPermission } from '@/lib/auth/authorization';
import type { Operacao } from '@/app/(authenticated)/usuarios';

import type { ActionResult } from './types';

const RECURSO = 'audiencias' as const;

async function autorizar(
  operacoes: Operacao | Operacao[],
): Promise<{ ok: true; userId: number } | { ok: false; result: ActionResult<never> }> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      result: {
        success: false,
        error: 'Não autenticado',
        message: 'Você precisa estar autenticado para realizar esta ação.',
      },
    };
  }

  const ops = Array.isArray(operacoes) ? operacoes : [operacoes];
  for (const op of ops) {
    const has = await checkPermission(user.id, RECURSO, op);
    if (!has) {
      return {
        ok: false,
        result: {
          success: false,
          error: `Sem permissão: ${RECURSO}.${op}`,
          message: `Você não tem permissão para ${op.replaceAll('_', ' ')} em audiências.`,
        },
      };
    }
  }

  return { ok: true, userId: user.id };
}

async function autorizarOperacoesDoPayload(
  userId: number,
  audienciaAtual: Audiencia,
  payload: z.infer<typeof updateAudienciaSchema>,
): Promise<{ ok: true } | { ok: false; result: ActionResult<never> }> {
  const ops = new Set<Operacao>();

  if ('responsavelId' in payload) {
    const antes = audienciaAtual.responsavelId ?? null;
    const depois = payload.responsavelId ?? null;
    if (antes !== depois) {
      if (antes == null && depois != null) ops.add('atribuir_responsavel');
      else if (antes != null && depois == null) ops.add('desatribuir_responsavel');
      else ops.add('transferir_responsavel');
    }
  }

  if (
    'urlAudienciaVirtual' in payload &&
    payload.urlAudienciaVirtual !== audienciaAtual.urlAudienciaVirtual
  ) {
    ops.add('editar_url_virtual');
  }

  const CAMPOS_DEDICADOS: ReadonlySet<string> = new Set([
    'responsavelId',
    'urlAudienciaVirtual',
  ]);
  const temOutroCampo = Object.entries(payload as Record<string, unknown>).some(
    ([k, v]) => !CAMPOS_DEDICADOS.has(k) && v !== undefined,
  );
  if (temOutroCampo) ops.add('editar');

  for (const op of ops) {
    const has = await checkPermission(userId, RECURSO, op);
    if (!has) {
      return {
        ok: false,
        result: {
          success: false,
          error: `Sem permissão: ${RECURSO}.${op}`,
          message: `Você não tem permissão para ${op.replaceAll('_', ' ')} em audiências.`,
        },
      };
    }
  }

  return { ok: true };
}

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
  revalidatePath('/app/audiencias', 'layout');
  revalidatePath('/portal/audiencias', 'layout');
  revalidatePath('/app/dashboard');
}

function parseAudienciaFormData(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());

  let enderecoPresencial: FormDataEntryValue | null | unknown = rawData.enderecoPresencial;
  if (typeof enderecoPresencial === 'string' && enderecoPresencial) {
    try {
      enderecoPresencial = JSON.parse(enderecoPresencial);
    } catch (e) {
      console.error('Falha ao fazer parse de enderecoPresencial:', e);
      enderecoPresencial = null;
    }
  }

  const parseNumber = (value: unknown) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  };

  const parseString = (value: unknown) => {
    if (typeof value === 'string') {
      return value.trim() === '' ? null : value.trim();
    }
    return value;
  };

  return {
    ...rawData,
    processoId: parseNumber(rawData.processoId),
    tipoAudienciaId: parseNumber(rawData.tipoAudienciaId),
    responsavelId: parseNumber(rawData.responsavelId),
    modalidade: parseString(rawData.modalidade),
    urlAudienciaVirtual: parseString(rawData.urlAudienciaVirtual),
    observacoes: parseString(rawData.observacoes),
    salaAudienciaNome: parseString(rawData.salaAudienciaNome),
    enderecoPresencial: enderecoPresencial || undefined,
  };
}

export async function actionCriarAudiencia(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const auth = await autorizar('editar');
  if (!auth.ok) return auth.result;

  const data = parseAudienciaFormData(formData);

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
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Não autenticado',
      message: 'Você precisa estar autenticado para realizar esta ação.',
    };
  }

  const data = parseAudienciaFormData(formData);

  const validation = updateAudienciaSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: 'Erro de validação.',
      errors: formatZodErrors(validation.error),
      message: 'Por favor, corrija os erros no formulário.',
    };
  }

  const atualResult = await service.buscarAudiencia(id);
  if (!atualResult.success || !atualResult.data) {
    return {
      success: false,
      error: 'Audiência não encontrada.',
      message: 'A audiência não foi encontrada.',
    };
  }

  const authOps = await autorizarOperacoesDoPayload(user.id, atualResult.data, validation.data);
  if (!authOps.ok) return authOps.result;

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
  const auth = await autorizar('editar');
  if (!auth.ok) return auth.result;

  const result = await service.atualizarStatusAudiencia(id, status, statusDescricao);

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

export async function actionAtualizarObservacoes(
  id: number,
  observacoes: string | null
): Promise<ActionResult<Audiencia>> {
  const auth = await autorizar('editar');
  if (!auth.ok) return auth.result as ActionResult<Audiencia>;

  const result = await service.atualizarObservacoesAudiencia(id, observacoes);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao atualizar observações da audiência.',
    };
  }

  revalidateAudienciasPaths();

  return {
    success: true,
    data: result.data,
    message: 'Observações atualizadas com sucesso.',
  };
}

export async function actionAtualizarUrlVirtual(
  id: number,
  urlAudienciaVirtual: string | null
): Promise<ActionResult<Audiencia>> {
  const auth = await autorizar('editar_url_virtual');
  if (!auth.ok) return auth.result as ActionResult<Audiencia>;

  const result = await service.atualizarUrlVirtualAudiencia(id, urlAudienciaVirtual);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao atualizar URL da audiência virtual.',
    };
  }

  revalidateAudienciasPaths();

  return {
    success: true,
    data: result.data,
    message: 'URL da audiência virtual atualizada com sucesso.',
  };
}

export async function actionAtualizarEnderecoPresencial(
  id: number,
  enderecoPresencial: EnderecoPresencial | null
): Promise<ActionResult<Audiencia>> {
  const auth = await autorizar('editar');
  if (!auth.ok) return auth.result as ActionResult<Audiencia>;

  const result = await service.atualizarEnderecoPresencialAudiencia(id, enderecoPresencial);

  if (!result.success) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao atualizar endereço presencial da audiência.',
    };
  }

  revalidateAudienciasPaths();

  return {
    success: true,
    data: result.data,
    message: 'Endereço presencial atualizado com sucesso.',
  };
}

export async function actionListarAudiencias(
  params: ListarAudienciasParams
): Promise<ActionResult<PaginatedResponse<Audiencia>>> {
  const auth = await autorizar('listar');
  if (!auth.ok) return auth.result as ActionResult<PaginatedResponse<Audiencia>>;

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
  const auth = await autorizar('visualizar');
  if (!auth.ok) return auth.result as ActionResult<Audiencia | null>;

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

export async function actionCriarAudienciaPayload(
  payload: z.infer<typeof createAudienciaSchema>
): Promise<ActionResult<Audiencia>> {
  const auth = await autorizar('editar');
  if (!auth.ok) return auth.result as ActionResult<Audiencia>;

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

export async function actionAtualizarAudienciaPayload(
  id: number,
  payload: z.infer<typeof updateAudienciaSchema>
): Promise<ActionResult<Audiencia>> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: 'Não autenticado',
      message: 'Você precisa estar autenticado para realizar esta ação.',
    };
  }

  const validation = updateAudienciaSchema.safeParse(payload);
  if (!validation.success) {
    return {
      success: false,
      error: 'Erro de validação.',
      errors: formatZodErrors(validation.error),
      message: 'Por favor, corrija os erros no formulário.',
    };
  }

  const atualResult = await service.buscarAudiencia(id);
  if (!atualResult.success || !atualResult.data) {
    return {
      success: false,
      error: 'Audiência não encontrada.',
      message: 'A audiência não foi encontrada.',
    };
  }

  const authOps = await autorizarOperacoesDoPayload(user.id, atualResult.data, validation.data);
  if (!authOps.ok) return authOps.result;

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

export async function actionObterResumoUltimaCapturaAudiencias(): Promise<ActionResult<ResumoUltimaCapturaAudiencias | null>> {
  const auth = await autorizar('listar');
  if (!auth.ok) return auth.result as ActionResult<ResumoUltimaCapturaAudiencias | null>;

  const result = await service.obterResumoUltimaCapturaAudiencias();

  if (!result.success) {
    return { success: false, error: result.error.message, message: result.error.message };
  }
  return { success: true, data: result.data, message: 'Resumo obtido com sucesso.' };
}
