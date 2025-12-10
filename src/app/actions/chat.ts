'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { chatService } from ' @/core/chat';
import {
  criarSalaChatSchema,
  criarMensagemChatSchema,
  ListarSalasParams,
} from ' @/core/chat/domain';
import { getSupabase } from ' @/core/app/_lib/supabase';

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };

function formatZodErrors(zodError: z.ZodError): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};
  zodError.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formattedErrors[path]) formattedErrors[path] = [];
    formattedErrors[path].push(err.message);
  });
  return formattedErrors;
}

async function getCurrentUserId(): Promise<number | null> {
  const { supabase } = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  return data?.id || null;
}

export async function actionCriarSala(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const usuarioId = await getCurrentUserId();
  if (!usuarioId) {
    return { success: false, error: 'Usuário não autenticado.', message: 'Falha na autenticação.' };
  }

  const rawData = Object.fromEntries(formData.entries());
  const data = {
    ...rawData,
    documentoId: rawData.documentoId ? Number(rawData.documentoId) : undefined,
    participanteId: rawData.participanteId ? Number(rawData.participanteId) : undefined,
  };

  const validation = criarSalaChatSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: 'Erro de validação.',
      errors: formatZodErrors(validation.error),
      message: 'Por favor, corrija os erros no formulário.',
    };
  }

  const result = await chatService.criarSala(validation.data, usuarioId);

  if (result.isErr()) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao criar sala.',
    };
  }

  revalidatePath('/chat');

  return {
    success: true,
    data: result.value,
    message: 'Sala criada com sucesso.',
  };
}

export async function actionEnviarMensagem(
  salaId: number,
  conteudo: string
): Promise<ActionResult> {
  const usuarioId = await getCurrentUserId();
  if (!usuarioId) {
    return { success: false, error: 'Usuário não autenticado.', message: 'Falha na autenticação.' };
  }

  const result = await chatService.enviarMensagem(
    { salaId, conteudo, tipo: 'texto' },
    usuarioId
  );

  if (result.isErr()) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao enviar mensagem.',
    };
  }

  return {
    success: true,
    data: result.value,
    message: 'Mensagem enviada.',
  };
}

export async function actionListarSalas(
  params: ListarSalasParams
): Promise<ActionResult> {
  const usuarioId = await getCurrentUserId();
  if (!usuarioId) {
    return { success: false, error: 'Usuário não autenticado.', message: 'Falha na autenticação.' };
  }

  const result = await chatService.listarSalasDoUsuario(usuarioId, params);

  if (result.isErr()) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao listar salas.',
    };
  }

  return {
    success: true,
    data: result.value,
    message: 'Salas listadas com sucesso.',
  };
}

export async function actionBuscarHistorico(
  salaId: number,
  limite?: number,
  antesDe?: string
): Promise<ActionResult> {
  const result = await chatService.buscarHistoricoMensagens(salaId, limite, antesDe);

  if (result.isErr()) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao buscar histórico.',
    };
  }

  return {
    success: true,
    data: result.value,
    message: 'Histórico carregado.',
  };
}

export async function actionDeletarSala(id: number): Promise<ActionResult> {
  const usuarioId = await getCurrentUserId();
  if (!usuarioId) {
    return { success: false, error: 'Usuário não autenticado.', message: 'Falha na autenticação.' };
  }

  const result = await chatService.deletarSala(id, usuarioId);

  if (result.isErr()) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao deletar sala.',
    };
  }

  revalidatePath('/chat');

  return {
    success: true,
    data: undefined,
    message: 'Sala deletada com sucesso.',
  };
}

export async function actionAtualizarNomeSala(
  id: number,
  nome: string
): Promise<ActionResult> {
  const usuarioId = await getCurrentUserId();
  if (!usuarioId) {
    return { success: false, error: 'Usuário não autenticado.', message: 'Falha na autenticação.' };
  }

  const result = await chatService.atualizarNomeSala(id, nome, usuarioId);

  if (result.isErr()) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao atualizar nome.',
    };
  }

  revalidatePath('/chat');

  return {
    success: true,
    data: result.value,
    message: 'Nome atualizado com sucesso.',
  };
}
