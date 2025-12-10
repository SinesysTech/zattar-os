import { z } from 'zod';
import { Value } from './types';

// ============================================================================
// CONSTANTES
// ============================================================================

export const PERMISSOES = {
  proprietario: 'Proprietário',
  editar: 'Pode editar',
  visualizar: 'Apenas visualizar',
} as const;

export const TIPOS_PASTA = {
  comum: 'comum',
  privada: 'privada',
} as const;

export const TIPOS_MEDIA = {
  imagem: 'imagem',
  video: 'video',
  audio: 'audio',
  pdf: 'pdf',
  outros: 'outros',
} as const;

export const VISIBILIDADE_TEMPLATE = {
  publico: 'publico',
  privado: 'privado',
} as const;

export const PERMISSAO_VALUES = ['visualizar', 'editar'] as const;

// ============================================================================
// SCHEMAS
// ============================================================================

export const documentoSchema = z.object({
  titulo: z.string().min(1, 'Título obrigatório').max(500),
  conteudo: z.custom<Value>().optional(), // PlateContent
  pasta_id: z.number().nullable().optional(),
  descricao: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const criarDocumentoSchema = z.object({
  titulo: z.string().min(1, 'Título obrigatório').max(500),
  conteudo: z.custom<Value>().optional(),
  pasta_id: z.number().nullable().optional(),
  descricao: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const atualizarDocumentoSchema = z.object({
  titulo: z.string().min(1, 'Título obrigatório').max(500).optional(),
  conteudo: z.custom<Value>().optional(),
  pasta_id: z.number().nullable().optional(),
  descricao: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const pastaSchema = z.object({
  nome: z.string().min(1, 'Nome da pasta obrigatório').max(255),
  pasta_pai_id: z.number().nullable().optional(),
  tipo: z.nativeEnum(TIPOS_PASTA),
  descricao: z.string().nullable().optional(),
  cor: z.string().nullable().optional(),
  icone: z.string().nullable().optional(),
});

export const criarPastaSchema = z.object({
  nome: z.string().min(1, 'Nome da pasta obrigatório').max(255),
  pasta_pai_id: z.number().nullable().optional(),
  tipo: z.nativeEnum(TIPOS_PASTA).default(TIPOS_PASTA.comum),
  descricao: z.string().nullable().optional(),
  cor: z.string().nullable().optional(),
  icone: z.string().nullable().optional(),
});

export const atualizarPastaSchema = z.object({
  nome: z.string().min(1, 'Nome da pasta obrigatório').max(255).optional(),
  pasta_pai_id: z.number().nullable().optional(),
  descricao: z.string().nullable().optional(),
  cor: z.string().nullable().optional(),
  icone: z.string().nullable().optional(),
});

export const compartilhamentoSchema = z.object({
  documento_id: z.number(),
  usuario_id: z.number(),
  permissao: z.enum(PERMISSAO_VALUES),
  pode_deletar: z.boolean().optional(),
});

export const criarCompartilhamentoSchema = z.object({
  documento_id: z.number(),
  usuario_id: z.number(),
  permissao: z.enum(PERMISSAO_VALUES),
  pode_deletar: z.boolean().optional().default(false),
});

export const atualizarPermissaoCompartilhamentoSchema = z.object({
  permissao: z.enum(PERMISSAO_VALUES).optional(), // Optional now
  pode_deletar: z.boolean().optional(),
});

export const templateSchema = z.object({
  titulo: z.string().min(1, 'Título do template obrigatório').max(500),
  descricao: z.string().nullable().optional(),
  conteudo: z.custom<Value>(),
  visibilidade: z.nativeEnum(VISIBILIDADE_TEMPLATE),
  categoria: z.string().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
});

export const criarTemplateSchema = z.object({
  titulo: z.string().min(1, 'Título do template obrigatório').max(500),
  descricao: z.string().nullable().optional(),
  conteudo: z.custom<Value>(),
  visibilidade: z.nativeEnum(VISIBILIDADE_TEMPLATE).default(VISIBILIDADE_TEMPLATE.privado),
  categoria: z.string().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
});

export const atualizarTemplateSchema = z.object({
  titulo: z.string().min(1, 'Título do template obrigatório').max(500).optional(),
  descricao: z.string().nullable().optional(),
  conteudo: z.custom<Value>().optional(),
  visibilidade: z.nativeEnum(VISIBILIDADE_TEMPLATE).optional(),
  categoria: z.string().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
});

export const uploadSchema = z.object({
  documento_id: z.number().optional(), // Pode ser nulo se for upload avulso
  nome_arquivo: z.string().min(1, 'Nome do arquivo obrigatório'),
  tipo_mime: z.string().min(1, 'Tipo MIME obrigatório'),
  tamanho_bytes: z.number().min(0, 'Tamanho do arquivo deve ser positivo'),
  b2_key: z.string().min(1, 'B2 Key obrigatória'),
  b2_url: z.string().url('URL inválida para B2').min(1, 'B2 URL obrigatória'),
  tipo_media: z.nativeEnum(TIPOS_MEDIA),
});

export const criarUploadSchema = z.object({
  documento_id: z.number().nullable().optional(),
  nome_arquivo: z.string().min(1, 'Nome do arquivo obrigatório'),
  tipo_mime: z.string().min(1, 'Tipo MIME obrigatório'),
  tamanho_bytes: z.number().min(0, 'Tamanho do arquivo deve ser positivo'),
  b2_key: z.string().min(1, 'B2 Key obrigatória'),
  b2_url: z.string().url('URL inválida para B2').min(1, 'B2 URL obrigatória'),
  tipo_media: z.nativeEnum(TIPOS_MEDIA),
});

export const autoSavePayloadSchema = z.object({
  documento_id: z.number(),
  conteudo: z.custom<Value>(),
  titulo: z.string().optional(),
});

export const criarVersaoSchema = z.object({
  documento_id: z.number(),
  versao: z.number().min(1),
  conteudo: z.custom<Value>(),
  titulo: z.string(),
});

export const criarSalaChatSchema = z.object({
  nome: z.string().min(1, 'Nome da sala obrigatório').max(255),
  tipo: z.enum(['geral', 'documento', 'privado', 'grupo']),
  documento_id: z.number().nullable().optional(),
  participante_id: z.number().nullable().optional(),
});

export const criarMensagemChatSchema = z.object({
  sala_id: z.number(),
  conteudo: z.string().min(1, 'Mensagem não pode ser vazia'),
  tipo: z.enum(['texto', 'arquivo', 'sistema']).default('texto'),
});

export const atualizarMensagemChatSchema = z.object({
  conteudo: z.string().min(1, 'Mensagem não pode ser vazia'),
});
