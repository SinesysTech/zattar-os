'use server';

/**
 * Server Actions para Comunica CNJ
 *
 * Actions para comunicacoes do CNJ (Conselho Nacional de Justica).
 * Utiliza wrapper safe-action para:
 * - Autenticacao automatica
 * - Validacao com Zod
 * - Tipagem forte
 * - Error handling consistente
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  authenticatedAction,
} from '@/lib/safe-action';
import {
  buscarComunicacoes,
  sincronizarComunicacoes,
  listarTribunaisDisponiveis,
  vincularComunicacaoAExpediente,
  obterStatusRateLimit,
} from './service';
import type {
  ConsultarComunicacoesParams,
  SincronizarParams,
} from './domain';

// =============================================================================
// SCHEMAS
// =============================================================================

const consultarComunicacoesSchema = z.object({
  tribunalId: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  pagina: z.number().optional(),
  limite: z.number().optional(),
});

const sincronizarSchema = z.object({
  tribunalId: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

const vincularExpedienteSchema = z.object({
  comunicacaoId: z.number().min(1, 'ID da comunicacao invalido'),
  expedienteId: z.number().min(1, 'ID do expediente invalido'),
});

// =============================================================================
// TIPOS DE RETORNO DAS ACTIONS
// =============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };

// =============================================================================
// SERVER ACTIONS - SAFE (Recomendadas)
// =============================================================================

/**
 * Consulta comunicacoes na API do CNJ (sem persistencia)
 */
export const actionConsultarComunicacoesSafe = authenticatedAction(
  consultarComunicacoesSchema,
  async (params) => {
    const result = await buscarComunicacoes(params as ConsultarComunicacoesParams);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
);

/**
 * Lista tribunais disponiveis
 */
export const actionListarTribunaisSafe = authenticatedAction(
  z.object({}),
  async () => {
    const result = await listarTribunaisDisponiveis();
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  }
);

/**
 * Obtem status do rate limit
 */
export const actionObterStatusRateLimitSafe = authenticatedAction(
  z.object({}),
  async () => {
    return obterStatusRateLimit();
  }
);

/**
 * Dispara sincronizacao manual de comunicacoes
 */
export const actionDispararSincronizacaoManualSafe = authenticatedAction(
  sincronizarSchema,
  async (params) => {
    const result = await sincronizarComunicacoes(params as SincronizarParams);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/comunica-cnj');
    revalidatePath('/app/expedientes');
    return result.data;
  }
);

/**
 * Vincula comunicacao a um expediente
 */
export const actionVincularExpedienteSafe = authenticatedAction(
  vincularExpedienteSchema,
  async ({ comunicacaoId, expedienteId }) => {
    const result = await vincularComunicacaoAExpediente(comunicacaoId, expedienteId);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    revalidatePath('/app/comunica-cnj');
    revalidatePath('/app/expedientes');
    revalidatePath('/app/expedientes');
    return undefined;
  }
);

// =============================================================================
// LEGACY EXPORTS (mantidos para retrocompatibilidade durante migracao)
// =============================================================================

export async function actionConsultarComunicacoes(
  params: ConsultarComunicacoesParams
): Promise<ActionResult> {
  try {
    const result = await buscarComunicacoes(params);
    if (!result.success) {
      if (result.error.code === 'VALIDATION_ERROR' && result.error.details) {
        return {
          success: false,
          error: result.error.message,
          errors: result.error.details as Record<string, string[]>,
          message: result.error.message,
        };
      }
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }
    return {
      success: true,
      data: result.data,
      message: 'Comunicacoes consultadas com sucesso',
    };
  } catch (error) {
    console.error('Erro ao consultar comunicacoes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao consultar comunicacoes. Tente novamente.',
    };
  }
}

export async function actionListarTribunais(): Promise<ActionResult> {
  try {
    const result = await listarTribunaisDisponiveis();
    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }
    return {
      success: true,
      data: result.data,
      message: 'Tribunais carregados com sucesso',
    };
  } catch (error) {
    console.error('Erro ao listar tribunais:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao carregar tribunais. Tente novamente.',
    };
  }
}

export async function actionObterStatusRateLimit(): Promise<ActionResult> {
  try {
    const rateLimit = obterStatusRateLimit();
    return {
      success: true,
      data: rateLimit,
      message: 'Status do rate limit obtido com sucesso',
    };
  } catch (error) {
    console.error('Erro ao obter status do rate limit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao obter status do rate limit. Tente novamente.',
    };
  }
}

export async function actionDispararSincronizacaoManual(
  params: SincronizarParams
): Promise<ActionResult> {
  try {
    const result = await sincronizarComunicacoes(params);
    if (!result.success) {
      if (result.error.code === 'VALIDATION_ERROR' && result.error.details) {
        return {
          success: false,
          error: result.error.message,
          errors: result.error.details as Record<string, string[]>,
          message: result.error.message,
        };
      }
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }
    revalidatePath('/app/comunica-cnj');
    revalidatePath('/app/expedientes');
    return {
      success: true,
      data: result.data,
      message: `Sincronizacao concluida: ${result.data.stats.novos} novas, ${result.data.stats.duplicados} duplicadas, ${result.data.stats.expedientesCriados} expedientes criados`,
    };
  } catch (error) {
    console.error('Erro ao sincronizar comunicacoes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao sincronizar comunicacoes. Tente novamente.',
    };
  }
}

export async function actionVincularExpediente(
  comunicacaoId: number,
  expedienteId: number
): Promise<ActionResult> {
  try {
    if (!comunicacaoId || comunicacaoId <= 0) {
      return {
        success: false,
        error: 'ID invalido',
        message: 'ID da comunicacao e obrigatorio',
      };
    }
    if (!expedienteId || expedienteId <= 0) {
      return {
        success: false,
        error: 'ID invalido',
        message: 'ID do expediente e obrigatorio',
      };
    }
    const result = await vincularComunicacaoAExpediente(comunicacaoId, expedienteId);
    if (!result.success) {
      if (result.error.code === 'VALIDATION_ERROR' && result.error.details) {
        return {
          success: false,
          error: result.error.message,
          errors: result.error.details as Record<string, string[]>,
          message: result.error.message,
        };
      }
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }
    revalidatePath('/app/comunica-cnj');
    revalidatePath('/app/expedientes');
    return {
      success: true,
      data: undefined,
      message: 'Comunicacao vinculada ao expediente com sucesso',
    };
  } catch (error) {
    console.error('Erro ao vincular expediente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao vincular expediente. Tente novamente.',
    };
  }
}
