'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient as createSupabaseClient } from '@/backend/utils/supabase/server-client';
import {
  createExpedienteSchema,
  updateExpedienteSchema,
  ListarExpedientesParams,
} from '@/features/expedientes/types';
import {
  criarExpediente,
  atualizarExpediente,
  realizarBaixa,
  reverterBaixa,
  listarExpedientes,
} from '@/features/expedientes/service';

// =============================================================================
// TIPOS DE RETORNO DAS ACTIONS
// =============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };

// =============================================================================
// HELPERS
// =============================================================================

function formatZodErrors(
  zodError: z.ZodError<any>
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const err of zodError.errors) {
    const key = err.path.join('.');
    if (!errors[key]) {
      errors[key] = [];
    }
    errors[key].push(err.message);
  }
  return errors;
}

// =============================================================================
// SERVER ACTIONS
// =============================================================================

export async function actionCriarExpediente(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const rawData = {
      numeroProcesso: formData.get('numeroProcesso'),
      trt: formData.get('trt'),
      grau: formData.get('grau'),
      dataPrazoLegalParte: formData.get('dataPrazoLegalParte'),
      origem: formData.get('origem'),
      advogadoId: formData.get('advogadoId') ? parseInt(formData.get('advogadoId') as string, 10) : undefined,
      processoId: formData.get('processoId') ? parseInt(formData.get('processoId') as string, 10) : undefined,
      descricaoOrgaoJulgador: formData.get('descricaoOrgaoJulgador'),
      classeJudicial: formData.get('classeJudicial'),
      numero: formData.get('numero'),
      segredoJustica: formData.get('segredoJustica') === 'true',
      codigoStatusProcesso: formData.get('codigoStatusProcesso'),
      prioridadeProcessual: formData.get('prioridadeProcessual') === 'true',
      nomeParteAutora: formData.get('nomeParteAutora'),
      qtdeParteAutora: formData.get('qtdeParteAutora') ? parseInt(formData.get('qtdeParteAutora') as string, 10) : undefined,
      nomeParteRe: formData.get('nomeParteRe'),
      qtdeParteRe: formData.get('qtdeParteRe') ? parseInt(formData.get('qtdeParteRe') as string, 10) : undefined,
      dataAutuacao: formData.get('dataAutuacao'),
      juizoDigital: formData.get('juizoDigital') === 'true',
      dataArquivamento: formData.get('dataArquivamento'),
      idDocumento: formData.get('idDocumento'),
      dataCienciaParte: formData.get('dataCienciaParte'),
      responsavelId: formData.get('responsavelId') ? parseInt(formData.get('responsavelId') as string, 10) : undefined,
      tipoExpedienteId: formData.get('tipoExpedienteId') ? parseInt(formData.get('tipoExpedienteId') as string, 10) : undefined,
      observacoes: formData.get('observacoes'),
    };

    const validation = createExpedienteSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validação',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados inválidos',
      };
    }

    const result = await criarExpediente(validation.data);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath('/expedientes');
    revalidatePath('/expedientes/semana');
    revalidatePath('/expedientes/mes');
    revalidatePath('/expedientes/ano');
    revalidatePath('/expedientes/lista');
    // revalidatePath('/dashboard'); // Uncomment if dashboard has expedited widget

    return {
      success: true,
      data: result.data,
      message: 'Expediente criado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao criar expediente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao criar expediente. Tente novamente.',
    };
  }
}

export async function actionAtualizarExpediente(
  id: number,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'ID inválido',
        message: 'ID do expediente é obrigatório',
      };
    }

    const rawData: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
      if (value === 'true') {
        rawData[key] = true;
      } else if (value === 'false') {
        rawData[key] = false;
      } else if (!isNaN(Number(value)) && key.includes('Id')) { // Assuming IDs are numbers
        rawData[key] = parseInt(value as string, 10);
      } else if (!isNaN(Number(value)) && (key.includes('qtde') || key.includes('pagina') || key.includes('limite'))) {
        rawData[key] = parseInt(value as string, 10);
      }
      else if (value !== '') { // Only include non-empty values
        rawData[key] = value;
      }
    }


    const validation = updateExpedienteSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: 'Erro de validação',
        errors: formatZodErrors(validation.error),
        message: validation.error.errors[0]?.message || 'Dados inválidos',
      };
    }

    const result = await atualizarExpediente(id, validation.data);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath('/expedientes');
    revalidatePath(`/expedientes/${id}`);
    revalidatePath('/expedientes/semana');
    revalidatePath('/expedientes/mes');
    revalidatePath('/expedientes/ano');
    revalidatePath('/expedientes/lista');
    // revalidatePath('/dashboard'); // Uncomment if dashboard has expedited widget

    return {
      success: true,
      data: result.data,
      message: 'Expediente atualizado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao atualizar expediente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao atualizar expediente. Tente novamente.',
    };
  }
}

export async function actionBaixarExpediente(
  id: number,
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'ID inválido',
        message: 'ID do expediente é obrigatório para baixa',
      };
    }

    const supabase = await createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return {
        success: false,
        error: 'Não autenticado',
        message: 'Usuário não autenticado para realizar a baixa.',
      };
    }

    // Buscar o ID numérico do usuário usando o auth_user_id
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single();

    if (usuarioError || !usuario) {
      return {
        success: false,
        error: 'Usuário não encontrado',
        message: 'Usuário não encontrado no sistema.',
      };
    }

    // Monta objeto com tipagem superficial - validação será feita no service
    const rawData = {
      expedienteId: id,
      protocoloId: formData.get('protocoloId') ? (formData.get('protocoloId') as string).trim() : undefined,
      justificativaBaixa: (formData.get('justificativaBaixa') as string | null) || undefined,
      dataBaixa: (formData.get('dataBaixa') as string | null) || undefined,
    };

    // Delega validação para o service realizarBaixa
    const result = await realizarBaixa(id, rawData, usuario.id);

    if (!result.success) {
      // Mapeia erros de validação do service para ActionResult
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

    revalidatePath('/expedientes');
    revalidatePath('/expedientes/semana');
    revalidatePath('/expedientes/mes');
    revalidatePath('/expedientes/ano');
    revalidatePath('/expedientes/lista');
    // revalidatePath('/dashboard'); // Uncomment if dashboard has expedited widget

    return {
      success: true,
      data: result.data,
      message: 'Expediente baixado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao baixar expediente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao baixar expediente. Tente novamente.',
    };
  }
}

export async function actionReverterBaixa(id: number): Promise<ActionResult> {
  try {
    if (!id || id <= 0) {
      return {
        success: false,
        error: 'ID inválido',
        message: 'ID do expediente é obrigatório para reverter baixa',
      };
    }

    const supabase = await createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return {
        success: false,
        error: 'Não autenticado',
        message: 'Usuário não autenticado para reverter a baixa.',
      };
    }

    // Buscar o ID numérico do usuário usando o auth_user_id
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single();

    if (usuarioError || !usuario) {
      return {
        success: false,
        error: 'Usuário não encontrado',
        message: 'Usuário não encontrado no sistema.',
      };
    }

    const result = await reverterBaixa(id, usuario.id);

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        message: result.error.message,
      };
    }

    revalidatePath('/expedientes');
    revalidatePath('/expedientes/semana');
    revalidatePath('/expedientes/mes');
    revalidatePath('/expedientes/ano');
    revalidatePath('/expedientes/lista');
    // revalidatePath('/dashboard'); // Uncomment if dashboard has expedited widget

    return {
      success: true,
      data: result.data,
      message: 'Baixa de expediente revertida com sucesso',
    };
  } catch (error) {
    console.error('Erro ao reverter baixa de expediente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao reverter baixa de expediente. Tente novamente.',
    };
  }
}

export async function actionListarExpedientes(
  params: ListarExpedientesParams
): Promise<ActionResult> {
  try {
    const result = await listarExpedientes(params);

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
      message: 'Expedientes carregados com sucesso',
    };
  } catch (error) {
    console.error('Erro ao listar expedientes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      message: 'Erro ao carregar expedientes. Tente novamente.',
    };
  }
}
