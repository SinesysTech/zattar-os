/**
 * CHAT FEATURE - Types & Validation Schemas
 *
 * Define todos os tipos, interfaces e schemas Zod do módulo de chat.
 * Segue convenções de naming em camelCase para propriedades e PascalCase para tipos.
 */

import { z } from 'zod';

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Tipos de sala de chat disponíveis no sistema
 */
export enum TipoSalaChat {
  /** Sala pública compartilhada por todos os usuários */
  Geral = 'geral',
  /** Sala vinculada a um documento específico */
  Documento = 'documento',
  /** Conversa privada 1-para-1 entre dois usuários */
  Privado = 'privado',
  /** Sala de grupo criada manualmente */
  Grupo = 'grupo',
}

/**
 * Tipos de mensagem que podem ser enviadas
 */
export enum TipoMensagemChat {
  /** Mensagem de texto simples */
  Texto = 'texto',
  /** Mensagem com arquivos anexados */
  Arquivo = 'arquivo',
  /** Notificação do sistema */
  Sistema = 'sistema',
}

// =============================================================================
// INTERFACES - Domain Entities
// =============================================================================

/**
 * Representa uma sala de chat no sistema
 */
export interface SalaChat {
  id: number;
  nome: string;
  tipo: TipoSalaChat;
  documentoId: number | null;
  participanteId: number | null;
  criadoPor: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Representa uma mensagem de chat
 */
export interface MensagemChat {
  id: number;
  salaId: number;
  usuarioId: number;
  conteudo: string;
  tipo: TipoMensagemChat;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Informações básicas do usuário para exibição no chat
 */
export interface UsuarioChat {
  id: number;
  nomeCompleto: string;
  nomeExibicao: string | null;
  emailCorporativo: string | null;
}

/**
 * Mensagem com dados do usuário anexados (para exibição)
 */
export interface MensagemComUsuario extends MensagemChat {
  usuario: UsuarioChat;
}

/**
 * Usuário que está digitando no momento
 */
export interface TypingUser {
  userId: number;
  userName: string;
  timestamp: number;
}

// =============================================================================
// ZOD SCHEMAS - Validation
// =============================================================================

/**
 * Schema para validação de criação de sala
 */
export const criarSalaChatSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres'),
    tipo: z.nativeEnum(TipoSalaChat),
    documentoId: z.number().optional().nullable(),
    participanteId: z.number().optional().nullable(),
  })
  .refine((data) => data.tipo !== TipoSalaChat.Documento || data.documentoId !== null, {
    message: 'documentoId é obrigatório para salas de documento',
    path: ['documentoId'],
  })
  .refine((data) => data.tipo !== TipoSalaChat.Privado || data.participanteId !== null, {
    message: 'participanteId é obrigatório para conversas privadas',
    path: ['participanteId'],
  });

/**
 * Schema para validação de criação de mensagem
 */
export const criarMensagemChatSchema = z.object({
  salaId: z.number({ required_error: 'ID da sala é obrigatório' }),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório'),
  tipo: z.nativeEnum(TipoMensagemChat).default(TipoMensagemChat.Texto),
});

// =============================================================================
// TYPES - Inferred & Parameters
// =============================================================================

/**
 * Tipo inferido do schema de criação de sala
 */
export type CriarSalaChatInput = z.infer<typeof criarSalaChatSchema>;

/**
 * Tipo inferido do schema de criação de mensagem
 */
export type CriarMensagemChatInput = z.infer<typeof criarMensagemChatSchema>;

/**
 * Parâmetros para listar salas do usuário
 */
export interface ListarSalasParams {
  tipo?: TipoSalaChat;
  documentoId?: number;
  limite?: number;
  offset?: number;
}

/**
 * Parâmetros para listar mensagens de uma sala
 */
export interface ListarMensagensParams {
  salaId: number;
  antesDe?: string;
  limite?: number;
}

/**
 * Informações de paginação
 */
export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Resposta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// =============================================================================
// ACTION RESULT
// =============================================================================

/**
 * Resultado de uma Server Action
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };
