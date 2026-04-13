'use server';

/**
 * MAIL MODULE — Server Actions
 *
 * Thin authentication wrappers sobre o service layer.
 * Cada action: autentica → delega ao service com usuarioId → retorna Result<T>.
 */

import { getCurrentUser } from '@/lib/auth/server';
import * as mailService from '../service';
import type { SaveEmailCredentialsInput } from '../domain';

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

const ERR_UNAUTHENTICATED = {
  success: false as const,
  error: { message: 'Não autenticado' },
};

async function getAuthenticatedUserId(): Promise<number | null> {
  const user = await getCurrentUser();
  return user ? user.id : null;
}

// ---------------------------------------------------------------------------
// Pastas
// ---------------------------------------------------------------------------

export async function actionListarPastas(accountId?: number) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return ERR_UNAUTHENTICATED;
  return mailService.listarPastas(userId, accountId);
}

// ---------------------------------------------------------------------------
// Mensagens
// ---------------------------------------------------------------------------

export async function actionListarMensagens(params: {
  pasta?: string;
  pagina?: number;
  limite?: number;
  accountId?: number;
}) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return ERR_UNAUTHENTICATED;
  return mailService.listarMensagens(userId, params);
}

export async function actionLerMensagem(params: {
  pasta: string;
  uid: number;
  accountId?: number;
}) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return ERR_UNAUTHENTICATED;
  return mailService.lerMensagem(userId, params);
}

export async function actionBuscarMensagens(params: {
  pasta: string;
  busca: string;
  accountId?: number;
}) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return ERR_UNAUTHENTICATED;
  return mailService.buscarMensagens(userId, params);
}

// ---------------------------------------------------------------------------
// Envio
// ---------------------------------------------------------------------------

export async function actionEnviarEmail(params: {
  para: string[];
  assunto: string;
  texto: string;
  html?: string;
  cc?: string[];
  cco?: string[];
  accountId?: number;
}) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return ERR_UNAUTHENTICATED;
  return mailService.enviarEmail(userId, params);
}

export async function actionResponderEmail(params: {
  uid: number;
  pasta: string;
  texto: string;
  html?: string;
  responderTodos: boolean;
  accountId?: number;
}) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return ERR_UNAUTHENTICATED;
  return mailService.responderEmail(userId, params);
}

export async function actionEncaminharEmail(params: {
  uid: number;
  pasta: string;
  para: string[];
  texto: string;
  html?: string;
  accountId?: number;
}) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return ERR_UNAUTHENTICATED;
  return mailService.encaminharEmail(userId, params);
}

// ---------------------------------------------------------------------------
// Flags e movimentação
// ---------------------------------------------------------------------------

export async function actionAtualizarFlags(params: {
  uid: number;
  pasta: string;
  adicionar?: string[];
  remover?: string[];
  accountId?: number;
}) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return ERR_UNAUTHENTICATED;
  return mailService.atualizarFlags(userId, params);
}

export async function actionMoverMensagem(params: {
  uid: number;
  pastaOrigem: string;
  pastaDestino: string;
  accountId?: number;
}) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return ERR_UNAUTHENTICATED;
  return mailService.moverMensagem(userId, params);
}

// ---------------------------------------------------------------------------
// Contas
// ---------------------------------------------------------------------------

export async function actionListarContas() {
  const userId = await getAuthenticatedUserId();
  if (!userId) return ERR_UNAUTHENTICATED;
  return mailService.listarContas(userId);
}

export async function actionSalvarConta(input: SaveEmailCredentialsInput) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return ERR_UNAUTHENTICATED;
  return mailService.salvarConta(userId, input);
}

export async function actionExcluirConta(accountId?: number) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return ERR_UNAUTHENTICATED;
  return mailService.excluirConta(userId, accountId);
}
