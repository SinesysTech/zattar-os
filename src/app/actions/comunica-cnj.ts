'use server';

import { revalidatePath } from 'next/cache';
import {
  buscarComunicacoes,
  sincronizarComunicacoes,
  listarTribunaisDisponiveis,
  vincularComunicacaoAExpediente,
  obterStatusRateLimit,
} from '@/core/comunica-cnj/service';
import type {
  ConsultarComunicacoesParams,
  SincronizarParams,
} from '@/core/comunica-cnj/domain';

// =============================================================================
// TIPOS DE RETORNO DAS ACTIONS
// =============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };

// =============================================================================
// SERVER ACTIONS - CONSULTA
// =============================================================================

/**
 * Action para consultar comunicações na API do CNJ (sem persistência)
 */
export async function actionConsultarComunicacoes(
  params: ConsultarComunicacoesParams
): Promise<ActionResult> {
  try {
    const result = await buscarComunicacoes(params);

    if (!result.success) {
      // Formata erros de validação Zod
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
      message: 'Comunicações consultadas com sucesso',
    };
  } catch (error) {
    console.error('Erro ao consultar comunicações:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao consultar comunicações. Tente novamente.',
    };
  }
}

/**
 * Action para listar tribunais disponíveis
 */
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

/**
 * Action para obter status do rate limit
 */
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

// =============================================================================
// SERVER ACTIONS - SINCRONIZAÇÃO
// =============================================================================

/**
 * Action para disparar sincronização manual de comunicações
 */
export async function actionDispararSincronizacaoManual(
  params: SincronizarParams
): Promise<ActionResult> {
  try {
    const result = await sincronizarComunicacoes(params);

    if (!result.success) {
      // Formata erros de validação Zod
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

    // Revalida paths relacionados
    revalidatePath('/comunica-cnj');
    revalidatePath('/expedientes');

    return {
      success: true,
      data: result.data,
      message: `Sincronização concluída: ${result.data.stats.novos} novas, ${result.data.stats.duplicados} duplicadas, ${result.data.stats.expedientesCriados} expedientes criados`,
    };
  } catch (error) {
    console.error('Erro ao sincronizar comunicações:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao sincronizar comunicações. Tente novamente.',
    };
  }
}

// =============================================================================
// SERVER ACTIONS - VINCULAÇÃO
// =============================================================================

/**
 * Action para vincular comunicação a um expediente
 */
export async function actionVincularExpediente(
  comunicacaoId: number,
  expedienteId: number
): Promise<ActionResult> {
  try {
    if (!comunicacaoId || comunicacaoId <= 0) {
      return {
        success: false,
        error: 'ID inválido',
        message: 'ID da comunicação é obrigatório',
      };
    }

    if (!expedienteId || expedienteId <= 0) {
      return {
        success: false,
        error: 'ID inválido',
        message: 'ID do expediente é obrigatório',
      };
    }

    const result = await vincularComunicacaoAExpediente(comunicacaoId, expedienteId);

    if (!result.success) {
      // Formata erros de validação Zod
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

    // Revalida paths relacionados
    revalidatePath('/comunica-cnj');
    revalidatePath(`/expedientes/${expedienteId}`);
    revalidatePath('/expedientes');

    return {
      success: true,
      data: undefined,
      message: 'Comunicação vinculada ao expediente com sucesso',
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
