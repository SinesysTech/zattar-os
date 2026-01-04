/**
 * CHAT FEATURE - Shared Converters
 *
 * Funções de conversão snake_case -> camelCase para entidades do chat.
 * Extraído do repository original para reutilização entre repositories.
 */

import { fromSnakeToCamel } from "@/lib/utils";
import type {
  SalaChat,
  MensagemChat,
  MensagemComUsuario,
  UsuarioChat,
  SalaChatRow,
  MensagemChatRow,
  Chamada,
  ChamadaParticipante,
  ChamadaRow,
  ChamadaParticipanteRow,
} from "../../domain";

/**
 * Converte row de sala do banco (snake_case) para domínio (camelCase)
 */
export function converterParaSalaChat(data: SalaChatRow): SalaChat {
  return fromSnakeToCamel(data) as unknown as SalaChat;
}

/**
 * Converte row de mensagem do banco (snake_case) para domínio (camelCase)
 */
export function converterParaMensagemChat(data: MensagemChatRow): MensagemChat {
  return fromSnakeToCamel(data) as unknown as MensagemChat;
}

/**
 * Converte MensagemChatRow (com usuario opcional) para MensagemComUsuario
 */
export function converterParaMensagemComUsuario(
  data: MensagemChatRow,
  currentUserId?: number
): MensagemComUsuario {
  // Extrair usuario antes de converter a mensagem
  const usuarioRow = data.usuario;

  if (!usuarioRow) {
    throw new Error("Usuário não encontrado na mensagem");
  }

  // Converter usuario
  const usuario = fromSnakeToCamel(usuarioRow) as unknown as UsuarioChat;

  // Mapear avatar_url para avatar
  if (usuarioRow.avatar_url) {
    usuario.avatar = usuarioRow.avatar_url;
  }

  // Converter mensagem usando fromSnakeToCamel
  const mensagemConvertida = fromSnakeToCamel({
    id: data.id,
    sala_id: data.sala_id,
    usuario_id: data.usuario_id,
    conteudo: data.conteudo,
    tipo: data.tipo,
    created_at: data.created_at,
    updated_at: data.updated_at,
    deleted_at: data.deleted_at,
    status: data.status,
    data: data.data,
  }) as unknown as {
    id: number;
    salaId: number;
    usuarioId: number;
    conteudo: string;
    tipo: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    status?: "sent" | "forwarded" | "read";
    data?: unknown;
  };

  // Construir MensagemComUsuario garantindo todos os campos necessários
  const mensagemComUsuario: MensagemComUsuario = {
    id: mensagemConvertida.id,
    salaId: mensagemConvertida.salaId,
    usuarioId: mensagemConvertida.usuarioId,
    conteudo: mensagemConvertida.conteudo,
    tipo: mensagemConvertida.tipo as MensagemChat["tipo"],
    createdAt: mensagemConvertida.createdAt,
    updatedAt: mensagemConvertida.updatedAt,
    deletedAt: mensagemConvertida.deletedAt,
    status: mensagemConvertida.status,
    data: mensagemConvertida.data as MensagemChat["data"],
    usuario,
    ownMessage: currentUserId ? data.usuario_id === currentUserId : false,
  };

  return mensagemComUsuario;
}

/**
 * Converte row de chamada do banco (snake_case) para domínio (camelCase)
 */
export function converterParaChamada(data: ChamadaRow): Chamada {
  return fromSnakeToCamel(data) as unknown as Chamada;
}

/**
 * Converte row de participante de chamada do banco (snake_case) para domínio (camelCase)
 */
export function converterParaChamadaParticipante(data: ChamadaParticipanteRow): ChamadaParticipante {
  return fromSnakeToCamel(data) as unknown as ChamadaParticipante;
}
