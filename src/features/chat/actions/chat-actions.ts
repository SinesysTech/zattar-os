'use server';

/**
 * CHAT FEATURE - Server Actions
 *
 * Server Actions para operações de chat com validação e autenticação.
 */

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createChatService } from '../service';
import { criarSalaChatSchema, TipoMensagemChat, type ChatMessageData, type ListarSalasParams, type ActionResult, MessageStatus } from '../domain';

// =============================================================================
// HELPERS
// =============================================================================

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  return data?.id || null;
}

// =============================================================================
// ACTIONS - SALAS
// =============================================================================

/**
 * Action para criar uma nova sala de chat
 */
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

  const chatService = await createChatService();
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

/**
 * Action para listar salas do usuário
 */
export async function actionListarSalas(params: ListarSalasParams): Promise<ActionResult> {
  const usuarioId = await getCurrentUserId();
  if (!usuarioId) {
    return { success: false, error: 'Usuário não autenticado.', message: 'Falha na autenticação.' };
  }

  const chatService = await createChatService();
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

/**
 * Action para arquivar uma sala
 */
export async function actionArquivarSala(id: number): Promise<ActionResult> {
  const usuarioId = await getCurrentUserId();
  if (!usuarioId) {
    return { success: false, error: 'Usuário não autenticado.', message: 'Falha na autenticação.' };
  }

  const chatService = await createChatService();
  const result = await chatService.arquivarSala(id, usuarioId);

  if (result.isErr()) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao arquivar sala.',
    };
  }

  revalidatePath('/chat');
  return { success: true, data: undefined, message: 'Sala arquivada.' };
}

/**
 * Action para desarquivar uma sala
 */
export async function actionDesarquivarSala(id: number): Promise<ActionResult> {
  const usuarioId = await getCurrentUserId();
  if (!usuarioId) {
    return { success: false, error: 'Usuário não autenticado.', message: 'Falha na autenticação.' };
  }

  const chatService = await createChatService();
  const result = await chatService.desarquivarSala(id, usuarioId);

  if (result.isErr()) {
    return {
      success: false,
      error: result.error.message,
      message: 'Falha ao desarquivar sala.',
    };
  }

  revalidatePath('/chat');
  return { success: true, data: undefined, message: 'Sala desarquivada.' };
}


/**
 * Action para deletar uma sala
 */
export async function actionDeletarSala(id: number): Promise<ActionResult> {
  const usuarioId = await getCurrentUserId();
  if (!usuarioId) {
    return { success: false, error: 'Usuário não autenticado.', message: 'Falha na autenticação.' };
  }

  const chatService = await createChatService();
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

/**
 * Action para atualizar nome de uma sala
 */
export async function actionAtualizarNomeSala(id: number, nome: string): Promise<ActionResult> {
  const usuarioId = await getCurrentUserId();
  if (!usuarioId) {
    return { success: false, error: 'Usuário não autenticado.', message: 'Falha na autenticação.' };
  }

  const chatService = await createChatService();
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

// =============================================================================
// ACTIONS - MENSAGENS
// =============================================================================

/**
 * Action para enviar uma mensagem
 */
export async function actionEnviarMensagem(
  salaId: number,
  conteudo: string,
  tipo: TipoMensagemChat | string = 'texto',
  data?: ChatMessageData | null
): Promise<ActionResult> {
  const usuarioId = await getCurrentUserId();
  if (!usuarioId) {
    return { success: false, error: 'Usuário não autenticado.', message: 'Falha na autenticação.' };
  }

  const chatService = await createChatService();
  // Validar com schema
  const input = {
    salaId,
    conteudo,
    tipo: tipo as TipoMensagemChat,
    data: data ?? undefined
  };

  const result = await chatService.enviarMensagem(input, usuarioId);

  if (result.isErr()) {
    // Check if it's ZodError
    if (result.error instanceof z.ZodError) {
       return {
         success: false,
         error: 'Dados inválidos',
         errors: formatZodErrors(result.error),
         message: 'Erro ao enviar mensagem.'
       };
    }
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

/**
 * Action para buscar histórico de mensagens
 */
export async function actionBuscarHistorico(
  salaId: number,
  limite?: number,
  antesDe?: string
): Promise<ActionResult> {
  const usuarioId = await getCurrentUserId();
  // Mesmo para leitura, ideal ter user para calcular ownMessage, mas se não tiver, passa undefined (service suporta?)
  // Service.buscarHistoricoMensagens pede usuarioId. Se não autenticado, não deve ver?
  // Chat deve ser protegido.
  if (!usuarioId) {
     return { success: false, error: 'Usuário não autenticado.', message: 'Falha na autenticação.' };
  }

  const chatService = await createChatService();
  const result = await chatService.buscarHistoricoMensagens(salaId, usuarioId, limite, antesDe);

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

/**
 * Action para atualizar status da mensagem
 */
export async function actionAtualizarStatusMensagem(id: number, status: MessageStatus): Promise<ActionResult> {
  // TODO: Validar permissão? Normalmente status update é automático.
  const chatService = await createChatService();
  const result = await chatService.atualizarStatusMensagem(id, status);
  
  if (result.isErr()) {
     return { success: false, error: result.error.message, message: 'Erro ao atualizar status.' };
  }
  return { success: true, data: undefined, message: 'Status atualizado.' };
}