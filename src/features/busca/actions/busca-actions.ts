'use server';

/**
 * Server Actions para Busca Semântica
 *
 * Implementa busca por similaridade de vetores usando a camada de IA
 */

import { z } from 'zod';
import { authenticatedAction } from '@/lib/safe-action';
import {
  buscaSemantica,
  buscaHibrida,
  obterContextoRAG,
  buscarSimilares,
} from '@/lib/ai/retrieval';
import type { DocumentoMetadata } from '@/lib/ai/types';

// =============================================================================
// SCHEMAS
// =============================================================================

const buscaSemanticaSchema = z.object({
  query: z.string().min(3, 'A busca deve ter pelo menos 3 caracteres'),
  tipo: z
    .enum(['processo', 'documento', 'audiencia', 'expediente', 'cliente', 'lancamento', 'outro'])
    .optional()
    .describe('Filtrar por tipo de documento'),
  limite: z.number().min(1).max(50).default(10).describe('Número máximo de resultados'),
  threshold: z
    .number()
    .min(0)
    .max(1)
    .default(0.7)
    .describe('Limiar mínimo de similaridade (0-1)'),
});

const buscaHibridaSchema = z.object({
  query: z.string().min(3, 'A busca deve ter pelo menos 3 caracteres'),
  tipo: z
    .enum(['processo', 'documento', 'audiencia', 'expediente', 'cliente', 'lancamento', 'outro'])
    .optional(),
  limite: z.number().min(1).max(50).default(10),
});

const contextoRAGSchema = z.object({
  query: z.string().min(3, 'A pergunta deve ter pelo menos 3 caracteres'),
  maxTokens: z.number().min(500).max(8000).default(2000),
});

const buscarSimilaresSchema = z.object({
  tipo: z.enum(['processo', 'documento', 'audiencia', 'expediente', 'cliente', 'lancamento', 'outro']),
  id: z.number().int().positive(),
  limite: z.number().min(1).max(20).default(5),
});

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Busca semântica no conhecimento indexado
 *
 * Usa embeddings e similaridade de cosseno para encontrar documentos relevantes.
 */
export const actionBuscaSemantica = authenticatedAction(
  buscaSemanticaSchema,
  async (data) => {
    const filtros: Partial<DocumentoMetadata> = data.tipo ? { tipo: data.tipo } : {};

    const resultados = await buscaSemantica(data.query, {
      limite: data.limite,
      threshold: data.threshold,
      filtros,
    });

    return {
      query: data.query,
      total: resultados.length,
      resultados: resultados.map((r) => ({
        id: r.id,
        texto: r.texto.length > 500 ? r.texto.substring(0, 500) + '...' : r.texto,
        tipo: r.metadata.tipo,
        documentoId: r.metadata.id,
        processoId: r.metadata.processoId,
        numeroProcesso: r.metadata.numeroProcesso,
        similaridade: Math.round(r.similaridade * 100) / 100,
      })),
    };
  }
);

/**
 * Busca híbrida combinando semântica e textual
 *
 * Combina busca por similaridade de vetores com busca textual tradicional.
 */
export const actionBuscaHibrida = authenticatedAction(
  buscaHibridaSchema,
  async (data) => {
    const filtros: Partial<DocumentoMetadata> = data.tipo ? { tipo: data.tipo } : {};

    const resultados = await buscaHibrida(data.query, {
      limite: data.limite,
      filtros,
    });

    return {
      query: data.query,
      total: resultados.length,
      resultados: resultados.map((r) => ({
        id: r.id,
        texto: r.texto.length > 500 ? r.texto.substring(0, 500) + '...' : r.texto,
        tipo: r.metadata.tipo,
        documentoId: r.metadata.id,
        processoId: r.metadata.processoId,
        similaridade: Math.round(r.similaridade * 100) / 100,
      })),
    };
  }
);

/**
 * Obtém contexto RAG para uso com LLMs
 *
 * Retorna texto formatado com documentos relevantes para uso em prompts.
 */
export const actionObterContextoRAG = authenticatedAction(
  contextoRAGSchema,
  async (data) => {
    const { contexto, fontes } = await obterContextoRAG(data.query, data.maxTokens);

    return {
      query: data.query,
      contexto,
      fontesUsadas: fontes.length,
      fontes: fontes.map((f) => ({
        tipo: f.metadata.tipo,
        id: f.metadata.id,
        similaridade: Math.round(f.similaridade * 100) / 100,
      })),
    };
  }
);

/**
 * Busca documentos similares a um documento específico
 *
 * Encontra documentos com conteúdo semelhante ao documento de referência.
 */
export const actionBuscarSimilares = authenticatedAction(
  buscarSimilaresSchema,
  async (data) => {
    const resultados = await buscarSimilares(data.tipo, data.id, data.limite);

    return {
      referencia: { tipo: data.tipo, id: data.id },
      total: resultados.length,
      similares: resultados.map((r) => ({
        id: r.id,
        texto: r.texto.length > 300 ? r.texto.substring(0, 300) + '...' : r.texto,
        tipo: r.metadata.tipo,
        documentoId: r.metadata.id,
        similaridade: Math.round(r.similaridade * 100) / 100,
      })),
    };
  }
);

// =============================================================================
// TIPOS EXPORTADOS
// =============================================================================

export type BuscaSemanticaInput = z.infer<typeof buscaSemanticaSchema>;
export type BuscaHibridaInput = z.infer<typeof buscaHibridaSchema>;
export type ContextoRAGInput = z.infer<typeof contextoRAGSchema>;
export type BuscarSimilaresInput = z.infer<typeof buscarSimilaresSchema>;
