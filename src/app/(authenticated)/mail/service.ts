import 'server-only';

/**
 * MAIL MODULE — Service
 *
 * Camada de orquestração: valida config → chama clientes de protocolo (lib/mail/).
 * Todas as funções são async e retornam Result<T> para tratamento uniforme de erros.
 * Server Actions em actions/ devem consumir este service, nunca os clientes diretamente.
 */

import {
  listFolders,
  listMessages,
  getMessage,
  searchMessages,
  updateFlags,
  moveMessage,
} from '@/lib/mail/imap-client';
import {
  sendEmail,
  replyToEmail,
  forwardEmail,
} from '@/lib/mail/smtp-client';
import {
  getUserMailConfig,
  getAllEmailCredentials,
  saveEmailCredentials,
  deleteEmailCredentials,
} from './repository';
import type {
  EmailCredentials,
  MailConfig,
  MailFolder,
  MailMessage,
  MailMessagePreview,
  PaginatedResponse,
  SaveEmailCredentialsInput,
} from './domain';

// ---------------------------------------------------------------------------
// Result pattern
// ---------------------------------------------------------------------------

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } };

function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

function fail(message: string): Result<never> {
  return { success: false, error: { message } };
}

// ---------------------------------------------------------------------------
// Private helper
// ---------------------------------------------------------------------------

async function getConfig(
  usuarioId: number,
  accountId?: number
): Promise<MailConfig | null> {
  return getUserMailConfig(usuarioId, accountId);
}

// ---------------------------------------------------------------------------
// Pastas
// ---------------------------------------------------------------------------

/**
 * Lista as pastas IMAP da conta do usuário.
 */
export async function listarPastas(
  usuarioId: number,
  accountId?: number
): Promise<Result<MailFolder[]>> {
  const config = await getConfig(usuarioId, accountId);
  if (!config) return fail('Credenciais de email não configuradas');

  try {
    const folders = await listFolders(config);
    return ok(folders);
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erro ao listar pastas');
  }
}

// ---------------------------------------------------------------------------
// Mensagens
// ---------------------------------------------------------------------------

/**
 * Lista mensagens de uma pasta com paginação.
 */
export async function listarMensagens(
  usuarioId: number,
  params: {
    pasta?: string;
    pagina?: number;
    limite?: number;
    accountId?: number;
  }
): Promise<Result<PaginatedResponse<MailMessagePreview>>> {
  const { pasta = 'INBOX', pagina = 1, limite = 50, accountId } = params;

  const config = await getConfig(usuarioId, accountId);
  if (!config) return fail('Credenciais de email não configuradas');

  try {
    const result = await listMessages(config, pasta, pagina, limite);
    return ok(result);
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erro ao listar mensagens');
  }
}

/**
 * Lê o conteúdo completo de uma mensagem pelo UID.
 */
export async function lerMensagem(
  usuarioId: number,
  params: { pasta: string; uid: number; accountId?: number }
): Promise<Result<MailMessage | null>> {
  const { pasta, uid, accountId } = params;

  const config = await getConfig(usuarioId, accountId);
  if (!config) return fail('Credenciais de email não configuradas');

  try {
    const message = await getMessage(config, pasta, uid);
    return ok(message);
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erro ao ler mensagem');
  }
}

/**
 * Pesquisa mensagens em uma pasta por texto livre.
 */
export async function buscarMensagens(
  usuarioId: number,
  params: { pasta: string; busca: string; accountId?: number }
): Promise<Result<MailMessagePreview[]>> {
  const { pasta, busca, accountId } = params;

  const config = await getConfig(usuarioId, accountId);
  if (!config) return fail('Credenciais de email não configuradas');

  try {
    const results = await searchMessages(config, pasta, busca);
    return ok(results);
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erro ao buscar mensagens');
  }
}

// ---------------------------------------------------------------------------
// Envio e respostas
// ---------------------------------------------------------------------------

/**
 * Envia um novo e-mail.
 */
export async function enviarEmail(
  usuarioId: number,
  params: {
    para: string[];
    assunto: string;
    texto: string;
    html?: string;
    cc?: string[];
    cco?: string[];
    accountId?: number;
  }
): Promise<Result<void>> {
  const { para, assunto, texto, html, cc, cco, accountId } = params;

  const config = await getConfig(usuarioId, accountId);
  if (!config) return fail('Credenciais de email não configuradas');

  try {
    await sendEmail(config, {
      to: para,
      subject: assunto,
      text: texto,
      html,
      cc,
      bcc: cco,
    });
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erro ao enviar e-mail');
  }
}

/**
 * Responde a uma mensagem existente.
 */
export async function responderEmail(
  usuarioId: number,
  params: {
    uid: number;
    pasta: string;
    texto: string;
    html?: string;
    responderTodos: boolean;
    accountId?: number;
  }
): Promise<Result<void>> {
  const { uid, pasta, texto, html, responderTodos, accountId } = params;

  const config = await getConfig(usuarioId, accountId);
  if (!config) return fail('Credenciais de email não configuradas');

  try {
    const original = await getMessage(config, pasta, uid);
    if (!original) return fail('Mensagem original não encontrada');

    await replyToEmail(config, original, texto, responderTodos, html);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erro ao responder e-mail');
  }
}

/**
 * Encaminha uma mensagem para novos destinatários.
 */
export async function encaminharEmail(
  usuarioId: number,
  params: {
    uid: number;
    pasta: string;
    para: string[];
    texto: string;
    html?: string;
    accountId?: number;
  }
): Promise<Result<void>> {
  const { uid, pasta, para, texto, html, accountId } = params;

  const config = await getConfig(usuarioId, accountId);
  if (!config) return fail('Credenciais de email não configuradas');

  try {
    const original = await getMessage(config, pasta, uid);
    if (!original) return fail('Mensagem original não encontrada');

    await forwardEmail(config, original, para, texto, html);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erro ao encaminhar e-mail');
  }
}

// ---------------------------------------------------------------------------
// Flags e movimentação
// ---------------------------------------------------------------------------

/**
 * Adiciona ou remove flags IMAP de uma mensagem (ex: \Seen, \Flagged).
 */
export async function atualizarFlags(
  usuarioId: number,
  params: {
    uid: number;
    pasta: string;
    adicionar?: string[];
    remover?: string[];
    accountId?: number;
  }
): Promise<Result<void>> {
  const { uid, pasta, adicionar = [], remover = [], accountId } = params;

  const config = await getConfig(usuarioId, accountId);
  if (!config) return fail('Credenciais de email não configuradas');

  try {
    await updateFlags(config, pasta, uid, adicionar, remover);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erro ao atualizar flags');
  }
}

/**
 * Move uma mensagem de uma pasta para outra.
 */
export async function moverMensagem(
  usuarioId: number,
  params: {
    uid: number;
    pastaOrigem: string;
    pastaDestino: string;
    accountId?: number;
  }
): Promise<Result<void>> {
  const { uid, pastaOrigem, pastaDestino, accountId } = params;

  const config = await getConfig(usuarioId, accountId);
  if (!config) return fail('Credenciais de email não configuradas');

  try {
    await moveMessage(config, pastaOrigem, uid, pastaDestino);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erro ao mover mensagem');
  }
}

// ---------------------------------------------------------------------------
// Gerenciamento de contas
// ---------------------------------------------------------------------------

/**
 * Lista todas as contas de e-mail cadastradas pelo usuário.
 */
export async function listarContas(
  usuarioId: number
): Promise<Result<EmailCredentials[]>> {
  try {
    const contas = await getAllEmailCredentials(usuarioId);
    return ok(contas);
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erro ao listar contas');
  }
}

/**
 * Cria ou atualiza uma conta de e-mail do usuário.
 */
export async function salvarConta(
  usuarioId: number,
  input: SaveEmailCredentialsInput
): Promise<Result<EmailCredentials>> {
  try {
    const conta = await saveEmailCredentials(usuarioId, input);
    return ok(conta);
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erro ao salvar conta');
  }
}

/**
 * Remove uma conta de e-mail do usuário.
 * Se accountId não for fornecido, remove todas as contas.
 */
export async function excluirConta(
  usuarioId: number,
  accountId?: number
): Promise<Result<void>> {
  try {
    await deleteEmailCredentials(usuarioId, accountId);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Erro ao excluir conta');
  }
}
