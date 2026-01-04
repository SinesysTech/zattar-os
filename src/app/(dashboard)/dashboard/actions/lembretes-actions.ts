/**
 * Server Actions para Lembretes (Reminders)
 * Expõe funcionalidades de lembretes via Next.js Server Actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { ActionResult } from '@/types';
import type {
  Lembrete,
  CriarLembreteInput,
  AtualizarLembreteInput,
  ListarLembretesParams,
  MarcarLembreteConcluidoInput,
  DeletarLembreteInput,
} from '../domain';
import {
  listarLembretes,
  obterLembrete,
  criarNovoLembrete,
  atualizarLembreteExistente,
  alterarStatusLembrete,
  removerLembrete,
  obterContagemLembretesPendentes,
  obterLembretesVencidos,
} from '../services/lembretes-service';

/**
 * Action: Lista lembretes do usuário autenticado
 */
export async function actionListarLembretes(
  params: Omit<ListarLembretesParams, 'usuario_id'>
): Promise<ActionResult<Lembrete[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Não autenticado',
        message: 'Você precisa estar autenticado para visualizar lembretes',
      };
    }

    const result = await listarLembretes({
      ...params,
      usuario_id: user.id,
    });

    if (result.isOk) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      error: result.error.code,
      message: result.error.message,
      errors: result.error.context as Record<string, string[]>,
    };
  } catch (error) {
    console.error('Erro na action ao listar lembretes:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro ao listar lembretes',
    };
  }
}

/**
 * Action: Obtém um lembrete específico
 */
export async function actionObterLembrete(
  id: number
): Promise<ActionResult<Lembrete>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Não autenticado',
        message: 'Você precisa estar autenticado para visualizar lembretes',
      };
    }

    const result = await obterLembrete(id, user.id);

    if (result.isOk) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      error: result.error.code,
      message: result.error.message,
    };
  } catch (error) {
    console.error('Erro na action ao obter lembrete:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro ao obter lembrete',
    };
  }
}

/**
 * Action: Cria um novo lembrete
 */
export async function actionCriarLembrete(
  input: CriarLembreteInput
): Promise<ActionResult<Lembrete>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Não autenticado',
        message: 'Você precisa estar autenticado para criar lembretes',
      };
    }

    const result = await criarNovoLembrete(input, user.id);

    if (result.isOk) {
      // Revalidar a página do dashboard para refletir o novo lembrete
      revalidatePath('/dashboard/geral');

      return {
        success: true,
        data: result.data,
        message: 'Lembrete criado com sucesso',
      };
    }

    return {
      success: false,
      error: result.error.code,
      message: result.error.message,
      errors: result.error.context as Record<string, string[]>,
    };
  } catch (error) {
    console.error('Erro na action ao criar lembrete:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro ao criar lembrete',
    };
  }
}

/**
 * Action: Atualiza um lembrete existente
 */
export async function actionAtualizarLembrete(
  input: AtualizarLembreteInput
): Promise<ActionResult<Lembrete>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Não autenticado',
        message: 'Você precisa estar autenticado para atualizar lembretes',
      };
    }

    const result = await atualizarLembreteExistente(input, user.id);

    if (result.isOk) {
      // Revalidar a página do dashboard
      revalidatePath('/dashboard/geral');

      return {
        success: true,
        data: result.data,
        message: 'Lembrete atualizado com sucesso',
      };
    }

    return {
      success: false,
      error: result.error.code,
      message: result.error.message,
      errors: result.error.context as Record<string, string[]>,
    };
  } catch (error) {
    console.error('Erro na action ao atualizar lembrete:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro ao atualizar lembrete',
    };
  }
}

/**
 * Action: Marca um lembrete como concluído ou não concluído
 */
export async function actionMarcarLembreteConcluido(
  input: MarcarLembreteConcluidoInput
): Promise<ActionResult<Lembrete>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Não autenticado',
        message: 'Você precisa estar autenticado para alterar lembretes',
      };
    }

    const result = await alterarStatusLembrete(input, user.id);

    if (result.isOk) {
      // Revalidar a página do dashboard
      revalidatePath('/dashboard/geral');

      return {
        success: true,
        data: result.data,
        message: input.concluido
          ? 'Lembrete marcado como concluído'
          : 'Lembrete marcado como pendente',
      };
    }

    return {
      success: false,
      error: result.error.code,
      message: result.error.message,
    };
  } catch (error) {
    console.error('Erro na action ao marcar lembrete:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro ao alterar status do lembrete',
    };
  }
}

/**
 * Action: Deleta um lembrete
 */
export async function actionDeletarLembrete(
  input: DeletarLembreteInput
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Não autenticado',
        message: 'Você precisa estar autenticado para deletar lembretes',
      };
    }

    const result = await removerLembrete(input, user.id);

    if (result.isOk) {
      // Revalidar a página do dashboard
      revalidatePath('/dashboard/geral');

      return {
        success: true,
        data: undefined,
        message: 'Lembrete deletado com sucesso',
      };
    }

    return {
      success: false,
      error: result.error.code,
      message: result.error.message,
    };
  } catch (error) {
    console.error('Erro na action ao deletar lembrete:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro ao deletar lembrete',
    };
  }
}

/**
 * Action: Obtém a contagem de lembretes pendentes
 */
export async function actionContarLembretesPendentes(): Promise<
  ActionResult<number>
> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Não autenticado',
        message: 'Você precisa estar autenticado',
      };
    }

    const result = await obterContagemLembretesPendentes(user.id);

    if (result.isOk) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      error: result.error.code,
      message: result.error.message,
    };
  } catch (error) {
    console.error('Erro na action ao contar lembretes pendentes:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro ao contar lembretes',
    };
  }
}

/**
 * Action: Obtém lembretes vencidos
 */
export async function actionObterLembretesVencidos(): Promise<
  ActionResult<Lembrete[]>
> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Não autenticado',
        message: 'Você precisa estar autenticado',
      };
    }

    const result = await obterLembretesVencidos(user.id);

    if (result.isOk) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      error: result.error.code,
      message: result.error.message,
    };
  } catch (error) {
    console.error('Erro na action ao obter lembretes vencidos:', error);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erro ao obter lembretes vencidos',
    };
  }
}
