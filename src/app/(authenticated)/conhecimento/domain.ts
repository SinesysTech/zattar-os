import { z } from 'zod';

export const FORMATOS_ARQUIVO = ['txt', 'md', 'html', 'pdf', 'docx'] as const;
export type FormatoArquivo = (typeof FORMATOS_ARQUIVO)[number];

export const STATUS_DOCUMENTO = ['pending', 'processing', 'indexed', 'failed'] as const;
export type StatusDocumento = (typeof STATUS_DOCUMENTO)[number];

export const TAMANHO_MAX_BYTES = 50 * 1024 * 1024; // 50 MB

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const KnowledgeBaseSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(1).max(200),
  slug: z.string().regex(SLUG_REGEX),
  descricao: z.string().nullable().optional(),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  icone: z.string().max(64).nullable().optional(),
  total_documentos: z.number().int().nonnegative(),
  total_chunks: z.number().int().nonnegative(),
  created_by: z.number().int().positive().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;

export const KnowledgeDocumentSchema = z.object({
  id: z.number().int().positive(),
  base_id: z.number().int().positive(),
  nome: z.string().min(1).max(255),
  arquivo_path: z.string().min(1),
  arquivo_tipo: z.enum(FORMATOS_ARQUIVO),
  arquivo_tamanho_bytes: z.number().int().positive(),
  texto_extraido: z.string().nullable().optional(),
  total_chunks: z.number().int().nonnegative(),
  status: z.enum(STATUS_DOCUMENTO),
  ultimo_erro: z.string().nullable().optional(),
  tentativas: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_by: z.number().int().positive().nullable(),
  created_at: z.string(),
  indexed_at: z.string().nullable().optional(),
});
export type KnowledgeDocument = z.infer<typeof KnowledgeDocumentSchema>;

export const KnowledgeChunkSchema = z.object({
  chunk_id: z.number().int().positive(),
  conteudo: z.string(),
  similarity: z.number().min(0).max(1),
  document_id: z.number().int().positive(),
  document_nome: z.string(),
  base_id: z.number().int().positive(),
  base_nome: z.string(),
  posicao: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type KnowledgeChunk = z.infer<typeof KnowledgeChunkSchema>;

export const CriarBaseInputSchema = z.object({
  nome: z.string().min(1).max(200),
  slug: z.string().regex(SLUG_REGEX, 'slug deve ser kebab-case (ex: jurisprudencia-tst)'),
  descricao: z.string().max(1000).optional(),
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icone: z.string().max(64).optional(),
});
export type CriarBaseInput = z.infer<typeof CriarBaseInputSchema>;

export const AtualizarBaseInputSchema = CriarBaseInputSchema.partial().extend({
  id: z.number().int().positive(),
});
export type AtualizarBaseInput = z.infer<typeof AtualizarBaseInputSchema>;

export const CriarDocumentoInputSchema = z.object({
  base_id: z.number().int().positive(),
  nome: z.string().min(1).max(255),
  arquivo_tipo: z.enum(FORMATOS_ARQUIVO),
  arquivo_tamanho_bytes: z.number().int().positive().max(
    TAMANHO_MAX_BYTES,
    `Arquivo excede o limite de 50 MB`,
  ),
});
export type CriarDocumentoInput = z.infer<typeof CriarDocumentoInputSchema>;

export const BuscarConhecimentoInputSchema = z.object({
  query: z.string().min(3).max(2000),
  base_ids: z.array(z.number().int().positive()).optional(),
  limit: z.number().int().min(1).max(20).default(8),
  threshold: z.number().min(0).max(1).default(0.0),
});
export type BuscarConhecimentoInput = z.infer<typeof BuscarConhecimentoInputSchema>;
