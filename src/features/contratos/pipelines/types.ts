/**
 * CONTRATOS PIPELINES - Tipos e Schemas
 *
 * Interfaces TypeScript e schemas Zod para pipelines e estágios de contratos.
 *
 * Um Pipeline representa um fluxo de trabalho para um segmento de contratos.
 * Cada Pipeline possui Estágios (fases) pelos quais um contrato avança.
 */

import { z } from 'zod';

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Pipeline de contratos — fluxo de trabalho vinculado a um segmento
 */
export interface ContratoPipeline {
  id: number;
  segmentoId: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  estagios: ContratoPipelineEstagio[];
}

/**
 * Estágio (fase) de um pipeline de contratos
 */
export interface ContratoPipelineEstagio {
  id: number;
  pipelineId: number;
  nome: string;
  slug: string;
  cor: string;
  ordem: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// ZOD SCHEMAS — PIPELINE
// =============================================================================

export const createPipelineSchema = z.object({
  segmentoId: z.number().int().positive(),
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres'),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').nullable().optional(),
});

export const updatePipelineSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres').optional(),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').nullable().optional(),
  ativo: z.boolean().optional(),
});

// =============================================================================
// ZOD SCHEMAS — ESTÁGIO
// =============================================================================

export const createEstagioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  slug: z.string().min(1, 'Slug é obrigatório').max(100, 'Slug deve ter no máximo 100 caracteres'),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hex válida (ex: #6B7280)')
    .default('#6B7280'),
  ordem: z.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
});

export const updateEstagioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
  slug: z.string().min(1, 'Slug é obrigatório').max(100, 'Slug deve ter no máximo 100 caracteres').optional(),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hex válida (ex: #6B7280)')
    .optional(),
  ordem: z.number().int().min(0).optional(),
  isDefault: z.boolean().optional(),
});

export const reorderEstagiosSchema = z.object({
  estagioIds: z
    .array(z.number().int().positive())
    .min(1, 'Ao menos um estágio é necessário para reordenar'),
});

// =============================================================================
// INFERRED TYPES
// =============================================================================

export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;
export type UpdatePipelineInput = z.infer<typeof updatePipelineSchema>;
export type CreateEstagioInput = z.infer<typeof createEstagioSchema>;
export type UpdateEstagioInput = z.infer<typeof updateEstagioSchema>;
export type ReorderEstagiosInput = z.infer<typeof reorderEstagiosSchema>;

// =============================================================================
// PARÂMETROS DE LISTAGEM
// =============================================================================

export interface ListarPipelinesParams {
  segmentoId?: number;
  ativo?: boolean;
}
