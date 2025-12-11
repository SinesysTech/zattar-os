import type { Value } from '@udecode/plate-common';
export type { Value };

/**
 * Este arquivo contém todos os tipos relacionados ao editor de documentos,
 * pastas, compartilhamento, templates, uploads, versões e chat.
 */

// ============================================================================
// DOCUMENTOS
// ============================================================================

/**
 * Documento completo do banco de dados
 */
// Plate.js JSONB content structure (can be deeply nested)



export interface Documento {
  id: number;
  titulo: string;
  conteudo: Value; // JSONB - Estrutura do Plate.js
  pasta_id: number | null;
  criado_por: number;
  editado_por: number | null;
  versao: number;
  descricao: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  editado_em: string | null;
  deleted_at: string | null;
}

/**
 * Parâmetros para criar um novo documento
 */
export interface CriarDocumentoParams {
  titulo: string;
  conteudo?: Value; // Opcional - default '[]'
  pasta_id?: number | null;
  descricao?: string | null;
  tags?: string[];
}

/**
 * Parâmetros para atualizar um documento existente
 */
export interface AtualizarDocumentoParams {
  titulo?: string;
  conteudo?: Value;
  pasta_id?: number | null;
  descricao?: string | null;
  tags?: string[];
}

/**
 * Parâmetros para listar documentos com filtros
 */
export interface ListarDocumentosParams {
  pasta_id?: number | null;
  busca?: string;
  tags?: string[];
  criado_por?: number;
  incluir_deletados?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Documento com informações do criador
 */
export interface DocumentoComUsuario extends Documento {
  criador: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
    emailCorporativo: string | null;
  };
  editor?: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
  };
}

// ============================================================================
// PASTAS
// ============================================================================

/**
 * Pasta do banco de dados
 */
export interface Pasta {
  id: number;
  nome: string;
  pasta_pai_id: number | null;
  tipo: 'comum' | 'privada';
  criado_por: number;
  descricao: string | null;
  cor: string | null;
  icone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Parâmetros para criar uma nova pasta
 */
export interface CriarPastaParams {
  nome: string;
  pasta_pai_id?: number | null;
  tipo: 'comum' | 'privada';
  descricao?: string | null;
  cor?: string | null;
  icone?: string | null;
}

/**
 * Parâmetros para atualizar uma pasta
 */
export interface AtualizarPastaParams {
  nome?: string;
  pasta_pai_id?: number | null;
  descricao?: string | null;
  cor?: string | null;
  icone?: string | null;
}

/**
 * Pasta com contagem de documentos e subpastas
 */
export interface PastaComContadores extends Pasta {
  total_documentos: number;
  total_subpastas: number;
  criador: {
    id: number;
    nomeCompleto: string;
  };
}

/**
 * Árvore hierárquica de pastas
 */
export interface PastaHierarquia extends Pasta {
  subpastas: PastaHierarquia[];
  documentos?: Documento[];
}

// ============================================================================
// COMPARTILHAMENTO
// ============================================================================

/**
 * Registro de compartilhamento de documento
 */
export interface DocumentoCompartilhado {
  id: number;
  documento_id: number;
  usuario_id: number;
  permissao: 'visualizar' | 'editar';
  pode_deletar: boolean;
  compartilhado_por: number;
  created_at: string;
}

/**
 * Parâmetros para compartilhar documento com usuário
 */
export interface CompartilharDocumentoParams {
  documento_id: number;
  usuario_id: number;
  permissao: 'visualizar' | 'editar';
  pode_deletar?: boolean;
}

/**
 * Compartilhamento com informações do usuário
 */
export interface DocumentoCompartilhadoComUsuario extends DocumentoCompartilhado {
  usuario: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
    emailCorporativo: string | null;
  };
  compartilhador: {
    id: number;
    nomeCompleto: string;
  };
}

/**
 * Parâmetros para listar compartilhamentos
 */
export interface ListarCompartilhamentosParams {
  documento_id?: number;
  usuario_id?: number;
}

// ============================================================================
// TEMPLATES
// ============================================================================

/**
 * Template de documento
 */
export interface Template {
  id: number;
  titulo: string;
  descricao: string | null;
  conteudo: Value; // JSONB - Estrutura do Plate.js
  visibilidade: 'publico' | 'privado';
  categoria: string | null;
  thumbnail_url: string | null;
  criado_por: number;
  uso_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Parâmetros para criar um novo template
 */
export interface CriarTemplateParams {
  titulo: string;
  descricao?: string | null;
  conteudo: Value;
  visibilidade: 'publico' | 'privado';
  categoria?: string | null;
  thumbnail_url?: string | null;
}

/**
 * Parâmetros para atualizar um template
 */
export interface AtualizarTemplateParams {
  titulo?: string;
  descricao?: string | null;
  conteudo?: Value;
  visibilidade?: 'publico' | 'privado';
  categoria?: string | null;
  thumbnail_url?: string | null;
}

/**
 * Template com informações do criador
 */
export interface TemplateComUsuario extends Template {
  criador: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
  };
}

/**
 * Parâmetros para listar templates
 */
export interface ListarTemplatesParams {
  visibilidade?: 'publico' | 'privado';
  categoria?: string;
  criado_por?: number;
  busca?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// UPLOADS
// ============================================================================

/**
 * Upload de arquivo associado a documento
 */
export interface DocumentoUpload {
  id: number;
  documento_id: number;
  nome_arquivo: string;
  tipo_mime: string;
  tamanho_bytes: number;
  b2_key: string;
  b2_url: string;
  tipo_media: 'imagem' | 'video' | 'audio' | 'pdf' | 'outros';
  criado_por: number;
  created_at: string;
}

/**
 * Parâmetros para registrar upload de arquivo
 */
export interface UploadArquivoParams {
  documento_id: number | null;
  nome_arquivo: string;
  tipo_mime: string;
  tamanho_bytes: number;
  b2_key: string;
  b2_url: string;
  tipo_media: 'imagem' | 'video' | 'audio' | 'pdf' | 'outros';
}

/**
 * Upload com informações do documento e usuário
 */
export interface DocumentoUploadComInfo extends DocumentoUpload {
  documento: {
    id: number;
    titulo: string;
  };
  criador: {
    id: number;
    nomeCompleto: string;
  };
}

/**
 * Parâmetros para listar uploads
 */
export interface ListarUploadsParams {
  documento_id?: number;
  tipo_media?: 'imagem' | 'video' | 'audio' | 'pdf' | 'outros';
  limit?: number;
  offset?: number;
}

// ============================================================================
// VERSÕES
// ============================================================================

/**
 * Versão de documento (histórico)
 */
export interface DocumentoVersao {
  id: number;
  documento_id: number;
  versao: number;
  conteudo: Value; // JSONB - Estrutura do Plate.js
  titulo: string;
  criado_por: number;
  created_at: string;
}

/**
 * Parâmetros para criar uma nova versão
 */
export interface CriarVersaoParams {
  documento_id: number;
  versao: number;
  conteudo: Value;
  titulo: string;
}

/**
 * Versão com informações do criador
 */
export interface DocumentoVersaoComUsuario extends DocumentoVersao {
  criador: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
  };
}

/**
 * Parâmetros para listar versões
 */
export interface ListarVersoesParams {
  documento_id: number;
  limit?: number;
  offset?: number;
}

// ============================================================================
// CHAT - SALAS
// ============================================================================

/**
 * Sala de chat
 */
export interface SalaChat {
  id: number;
  nome: string;
  tipo: 'geral' | 'documento' | 'privado' | 'grupo';
  documento_id: number | null;
  participante_id: number | null;
  criado_por: number;
  created_at: string;
}

/**
 * Parâmetros para criar uma nova sala de chat
 */
export interface CriarSalaChatParams {
  nome: string;
  tipo: 'geral' | 'documento' | 'privado' | 'grupo';
  documento_id?: number | null;
  participante_id?: number | null;
}

/**
 * Sala de chat com informações adicionais
 */
export interface SalaChatComInfo extends SalaChat {
  criador: {
    id: number;
    nomeCompleto: string;
  };
  documento?: {
    id: number;
    titulo: string;
  };
  ultima_mensagem?: {
    conteudo: string;
    created_at: string;
  };
  total_nao_lidas?: number;
}

/**
 * Parâmetros para listar salas de chat
 */
export interface ListarSalasChatParams {
  tipo?: 'geral' | 'documento' | 'privado' | 'grupo';
  documento_id?: number;
  limit?: number;
  offset?: number;
}

// ============================================================================
// CHAT - MENSAGENS
// ============================================================================

/**
 * Mensagem de chat
 */
export interface MensagemChat {
  id: number;
  sala_id: number;
  usuario_id: number;
  conteudo: string;
  tipo: 'texto' | 'arquivo' | 'sistema';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Parâmetros para criar uma nova mensagem
 */
export interface CriarMensagemChatParams {
  sala_id: number;
  conteudo: string;
  tipo: 'texto' | 'arquivo' | 'sistema';
}

/**
 * Parâmetros para atualizar uma mensagem
 */
export interface AtualizarMensagemChatParams {
  conteudo: string;
}

/**
 * Mensagem com informações do usuário
 */
export interface MensagemChatComUsuario extends MensagemChat {
  usuario: {
    id: number;
    nomeCompleto: string;
    nomeExibicao: string | null;
    emailCorporativo: string | null;
  };
}

/**
 * Parâmetros para listar mensagens
 */
export interface ListarMensagensChatParams {
  sala_id: number;
  antes_de?: string; // Timestamp para paginação
  limit?: number;
}

// ============================================================================
// REALTIME - SUPABASE
// ============================================================================

/**
 * Evento de presença do usuário no editor
 */
export interface PresencaUsuario {
  user_id: number;
  nome: string;
  email: string;
  cor: string;
  cursor?: {
    x: number;
    y: number;
  };
  ultima_atividade: string;
}

/**
 * Evento de broadcast para colaboração em tempo real
 */
export interface EventoColaboracao {
  tipo: 'cursor' | 'selection' | 'typing' | 'edit';
  usuario_id: number;
  documento_id: number;
  dados: unknown;
  timestamp: string;
}

/**
 * Payload para auto-save
 */
export interface AutoSavePayload {
  documento_id: number;
  conteudo: Value;
  titulo?: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Resposta padrão de sucesso
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Resposta padrão de erro
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
