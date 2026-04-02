/**
 * TAGS DOMAIN - Entidades e Schemas de Validação
 *
 * Módulo para gerenciamento de tags/etiquetas para classificação de processos.
 *
 * CONVENÇÕES:
 * - Prefixar schemas de criação com "create" (ex: createTagSchema)
 * - Prefixar schemas de atualização com "update" (ex: updateTagSchema)
 * - Interfaces espelham estrutura do banco em camelCase
 * - NUNCA importar React/Next.js aqui
 */

import { z } from "zod";

// =============================================================================
// ENTIDADE PRINCIPAL: Tag
// =============================================================================

/**
 * Tag/Etiqueta para classificação de entidades
 */
export interface Tag {
  id: number;
  nome: string;
  slug: string;
  cor: string | null;
  createdAt: string;
}

/**
 * Relacionamento Tag-Processo
 */
export interface ProcessoTag {
  id: number;
  processoId: number;
  tagId: number;
  createdAt: string;
}

/**
 * Tag com informação de se está vinculada a um processo específico
 */
export interface TagComVinculo extends Tag {
  vinculada: boolean;
}

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

/**
 * Schema para criação de tag
 */
export const createTagSchema = z.object({
  nome: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(50, "Nome deve ter no máximo 50 caracteres"),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser um hex válido (ex: #FF5733)")
    .nullable()
    .optional(),
});

/**
 * Schema para atualização de tag
 */
export const updateTagSchema = z.object({
  nome: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .optional(),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser um hex válido (ex: #FF5733)")
    .nullable()
    .optional(),
});

/**
 * Schema para vincular tags a um processo
 */
export const vincularTagsSchema = z.object({
  processoId: z.number().int().positive("ID do processo deve ser positivo"),
  tagIds: z.array(z.number().int().positive("ID da tag deve ser positivo")),
});

// =============================================================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================================================

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type VincularTagsInput = z.infer<typeof vincularTagsSchema>;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Gera slug a partir do nome da tag
 */
export function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]+/g, "-") // Substitui caracteres especiais por hífen
    .replace(/^-|-$/g, ""); // Remove hífens no início e fim
}

// =============================================================================
// CORES PREDEFINIDAS
// =============================================================================

/**
 * Paleta de cores predefinidas para tags
 */
export const TAG_COLORS = [
  { label: "Vermelho", value: "#EF4444" },
  { label: "Laranja", value: "#F97316" },
  { label: "Âmbar", value: "#F59E0B" },
  { label: "Amarelo", value: "#EAB308" },
  { label: "Lima", value: "#84CC16" },
  { label: "Verde", value: "#22C55E" },
  { label: "Esmeralda", value: "#10B981" },
  { label: "Teal", value: "#14B8A6" },
  { label: "Ciano", value: "#06B6D4" },
  { label: "Azul Claro", value: "#0EA5E9" },
  { label: "Azul", value: "#3B82F6" },
  { label: "Índigo", value: "#6366F1" },
  { label: "Violeta", value: "#8B5CF6" },
  { label: "Roxo", value: "#A855F7" },
  { label: "Fúcsia", value: "#D946EF" },
  { label: "Pink", value: "#EC4899" },
  { label: "Rosa", value: "#F43F5E" },
  { label: "Cinza", value: "#6B7280" },
] as const;

/**
 * Retorna uma cor aleatória da paleta
 */
export function getRandomTagColor(): string {
  const index = Math.floor(Math.random() * TAG_COLORS.length);
  return TAG_COLORS[index].value;
}
