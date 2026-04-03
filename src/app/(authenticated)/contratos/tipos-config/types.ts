/**
 * CONTRATOS FEATURE - Tipos Configuráveis
 *
 * Tipos e schemas Zod para contrato_tipos e contrato_tipos_cobranca.
 * Ambas as tabelas possuem estrutura idêntica: id, nome, slug, descricao, ativo, ordem.
 */

import { z } from 'zod';

// =============================================================================
// INTERFACES DE DOMÍNIO
// =============================================================================

/**
 * Representa um tipo de contrato configurável (tabela contrato_tipos)
 *
 * @example
 * ```typescript
 * const tipo: ContratoTipo = {
 *   id: 1,
 *   nome: 'Ajuizamento',
 *   slug: 'ajuizamento',
 *   descricao: null,
 *   ativo: true,
 *   ordem: 0,
 *   createdAt: '2024-01-01T00:00:00Z',
 *   updatedAt: '2024-01-01T00:00:00Z',
 * };
 * ```
 */
export interface ContratoTipo {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Representa um tipo de cobrança configurável (tabela contrato_tipos_cobranca)
 *
 * @example
 * ```typescript
 * const tipoCobranca: ContratoTipoCobranca = {
 *   id: 1,
 *   nome: 'Honorários',
 *   slug: 'honorarios',
 *   descricao: 'Cobrança de honorários advocatícios',
 *   ativo: true,
 *   ordem: 1,
 *   createdAt: '2024-01-01T00:00:00Z',
 *   updatedAt: '2024-01-01T00:00:00Z',
 * };
 * ```
 */
export interface ContratoTipoCobranca {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// SCHEMAS ZOD
// =============================================================================

/**
 * Schema para criar um tipo (contrato ou cobrança).
 * A mesma estrutura serve para ambas as tabelas.
 */
export const createContratoTipoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres'),
  slug: z
    .string()
    .min(1, 'Slug é obrigatório')
    .max(100, 'Slug deve ter no máximo 100 caracteres')
    .regex(
      /^[a-z0-9_]+$/,
      'Slug deve conter apenas letras minúsculas, números e underscores',
    ),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').nullable().optional(),
  ordem: z.number().int('Ordem deve ser um número inteiro').min(0, 'Ordem deve ser maior ou igual a 0').default(0),
});

/**
 * Schema para atualizar um tipo (todos os campos opcionais).
 * Inclui campo `ativo` ausente no schema de criação.
 */
export const updateContratoTipoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200, 'Nome deve ter no máximo 200 caracteres').optional(),
  slug: z
    .string()
    .min(1, 'Slug é obrigatório')
    .max(100, 'Slug deve ter no máximo 100 caracteres')
    .regex(
      /^[a-z0-9_]+$/,
      'Slug deve conter apenas letras minúsculas, números e underscores',
    )
    .optional(),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').nullable().optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int('Ordem deve ser um número inteiro').min(0, 'Ordem deve ser maior ou igual a 0').optional(),
});

// =============================================================================
// TIPOS DERIVADOS
// =============================================================================

export type CreateContratoTipoInput = z.infer<typeof createContratoTipoSchema>;
export type UpdateContratoTipoInput = z.infer<typeof updateContratoTipoSchema>;

// =============================================================================
// TIPOS DE PARÂMETROS
// =============================================================================

/**
 * Parâmetros para listar tipos (filtros opcionais)
 *
 * @example
 * ```typescript
 * const params: ListarTiposParams = { ativo: true, search: 'honorários' };
 * ```
 */
export interface ListarTiposParams {
  /** Filtrar por status ativo/inativo. Omitir para trazer todos. */
  ativo?: boolean;
  /** Busca textual no campo nome (case-insensitive) */
  search?: string;
}
