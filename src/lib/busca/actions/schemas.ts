/**
 * Busca Actions — Schemas Zod + Tipos inferidos (sem "use server").
 *
 * Arquivos "use server" não podem exportar objetos (Zod schemas) nem tipos.
 * Este arquivo centraliza schemas e tipos de input das server actions de busca.
 */

import { z } from "zod";

export const buscaSemanticaSchema = z.object({
  query: z.string().min(3, "A busca deve ter pelo menos 3 caracteres"),
  tipo: z
    .enum(["processo", "documento", "audiencia", "expediente", "cliente", "lancamento", "outro"])
    .optional()
    .describe("Filtrar por tipo de documento"),
  limite: z.number().min(1).max(50).describe("Número máximo de resultados"),
  threshold: z
    .number()
    .min(0)
    .max(1)
    .describe("Limiar mínimo de similaridade (0-1)"),
});

export const buscaHibridaSchema = z.object({
  query: z.string().min(3, "A busca deve ter pelo menos 3 caracteres"),
  tipo: z
    .enum(["processo", "documento", "audiencia", "expediente", "cliente", "lancamento", "outro"])
    .optional(),
  limite: z.number().min(1).max(50),
});

export const contextoRAGSchema = z.object({
  query: z.string().min(3, "A pergunta deve ter pelo menos 3 caracteres"),
  maxTokens: z.number().min(500).max(8000),
});

export const buscarSimilaresSchema = z.object({
  tipo: z.enum(["processo", "documento", "audiencia", "expediente", "cliente", "lancamento", "outro"]),
  id: z.number().int().positive(),
  limite: z.number().min(1).max(20),
});

export type BuscaSemanticaInput = z.infer<typeof buscaSemanticaSchema>;
export type BuscaHibridaInput = z.infer<typeof buscaHibridaSchema>;
export type ContextoRAGInput = z.infer<typeof contextoRAGSchema>;
export type BuscarSimilaresInput = z.infer<typeof buscarSimilaresSchema>;
