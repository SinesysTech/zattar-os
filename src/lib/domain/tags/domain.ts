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
// CORES PREDEFINIDAS — Single Source of Truth
// =============================================================================
// IMPORTANTE: Este é o ÚNICO arquivo do codebase que pode conter os valores
// hex das cores de tag. Eles existem aqui por dois motivos:
//   1. Compatibilidade com schema do banco (coluna `cor` é varchar hex)
//   2. Single source of truth para o picker em processo-tags-dialog.tsx
//
// Os hex aqui são equivalência aproximada dos tokens --palette-1..18 em
// globals.css. UI components devem consumir via TAG_COLORS (não hardcode).
// O ESLint exclui este arquivo da regra de tokens.

/**
 * Paleta de cores predefinidas para tags.
 *
 * @property hex   - Valor armazenado no banco (legacy compat)
 * @property token - CSS variable equivalente — preferida em componentes novos
 * @property label - Nome em PT-BR para UI
 */
export const TAG_COLORS = [
  { label: "Vermelho",   hex: "#ED4949", token: "--palette-1" },
  { label: "Laranja",    hex: "#ED7E40", token: "--palette-2" },
  { label: "Âmbar",      hex: "#E5A23A", token: "--palette-3" },
  { label: "Amarelo",    hex: "#DAB52D", token: "--palette-4" },
  { label: "Lima",       hex: "#9FBE3E", token: "--palette-5" },
  { label: "Verde",      hex: "#4FB04F", token: "--palette-6" },
  { label: "Esmeralda",  hex: "#3DAF7A", token: "--palette-7" },
  { label: "Teal",       hex: "#3DAFA6", token: "--palette-8" },
  { label: "Ciano",      hex: "#3DA8C7", token: "--palette-9" },
  { label: "Azul Claro", hex: "#3D90D6", token: "--palette-10" },
  { label: "Azul",       hex: "#3D6BD6", token: "--palette-11" },
  { label: "Índigo",     hex: "#4D55E0", token: "--palette-12" },
  { label: "Violeta",    hex: "#6E48E0", token: "--palette-13" },
  { label: "Roxo",       hex: "#8E48E0", token: "--palette-14" },
  { label: "Fúcsia",     hex: "#C449D6", token: "--palette-15" },
  { label: "Pink",       hex: "#D6498F", token: "--palette-16" },
  { label: "Rosa",       hex: "#DA4566", token: "--palette-17" },
  { label: "Cinza",      hex: "#6B6B70", token: "--palette-18" },
] as const;

/**
 * @deprecated Use `TAG_COLORS[i].hex` em vez de `.value`.
 * Mantido para compat de imports existentes — remove em sweep futuro.
 */
export const TAG_COLORS_LEGACY = TAG_COLORS.map(c => ({ label: c.label, value: c.hex }));

/**
 * Retorna o hex de uma cor aleatória da paleta (para gravar no banco).
 */
export function getRandomTagColor(): string {
  const index = Math.floor(Math.random() * TAG_COLORS.length);
  return TAG_COLORS[index].hex;
}

/**
 * Dado um hex armazenado no banco, retorna a CSS variable equivalente.
 * Útil para renderizar a tag usando token em vez do hex bruto.
 */
export function tagHexToToken(hex: string | null | undefined): string | null {
  if (!hex) return null;
  const match = TAG_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
  return match ? `var(${match.token})` : hex; // fallback: usa o hex como está
}
