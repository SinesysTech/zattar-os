import { z } from 'zod';
import { SLUG_PATTERN, generateSlug } from '@/lib/assinatura-digital/slug-helpers';

/**
 * Segmento Types
 *
 * Segmento substitui o conceito de Escritório, tornando o sistema agnóstico e multi-domínio.
 * Agora o sistema pode ser usado por qualquer tipo de organização (Jurídico, RH, Vendas, etc.)
 * sem estar acoplado a um domínio específico.
 */

// ============================================================================
// Interface Principal - Backend (snake_case)
// ============================================================================

/**
 * Interface Segmento - Representa um segmento/área de negócio no sistema
 *
 * Exemplos: 'Jurídico', 'RH', 'Vendas', 'Marketing', etc.
 * Cada segmento pode ter múltiplos formulários associados.
 */
export interface Segmento {
  /** ID auto-incremental do n8n Data Tables (Primary Key) */
  id: number;

  /** UUID de negócio gerado pelo Next.js */
  segmento_uuid: string;

  /** Nome do segmento (ex: 'Jurídico', 'RH', 'Vendas') */
  nome: string;

  /** Slug único para URL (ex: 'juridico', 'rh', 'vendas') */
  slug: string;

  /** Descrição opcional do segmento */
  descricao?: string;

  /** Flag de ativação (default: true) */
  ativo: boolean;

  /** Timestamp ISO do n8n (camelCase) - Data de criação */
  createdAt: string;

  /** Timestamp ISO do n8n (camelCase) - Data de atualização */
  updatedAt: string;

  /** Usuário que criou o segmento */
  criado_por?: string;

  /** Contagem de formulários associados (calculado pela API) */
  formularios_count?: number;

  /** Lista de formulários associados (opcional, retornado pela API se solicitado) */
  formularios?: Array<{ id: number; nome: string }>;
}

// ============================================================================
// Interface de Formulário - Frontend (camelCase)
// ============================================================================

/**
 * Interface para formulário de criação/edição de Segmento
 * Usa camelCase seguindo padrão do frontend
 */
export interface SegmentoForm {
  /** Nome do segmento */
  nome: string;

  /** Slug único para URL */
  slug: string;

  /** Descrição opcional */
  descricao?: string;
}

// ============================================================================
// NOTA: Payloads, Filtros e Responses foram movidos para types/n8n.types.ts
// para eliminar duplicação e centralizar contratos de API.
// ============================================================================

// ============================================================================
// Validação Zod
// ============================================================================

/**
 * Schema Zod para validação de formulário de Segmento
 */
export const segmentoSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  slug: z
    .string()
    .min(3, 'Slug deve ter no mínimo 3 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(
      SLUG_PATTERN,
      'Slug deve estar no formato kebab-case (ex: juridico-sp)'
    )
    .toLowerCase(),

  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
});

/**
 * Type inferido do schema Zod
 */
export type SegmentoSchemaType = z.infer<typeof segmentoSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gera slug a partir do nome do segmento
 *
 * @param nome - Nome do segmento
 * @returns Slug no formato kebab-case
 *
 * @example
 * generateSlugFromNome('Jurídico SP') // 'juridico-sp'
 * generateSlugFromNome('RH & Pessoas') // 'rh-pessoas'
 * generateSlugFromNome('Vendas - Região Sul') // 'vendas-regiao-sul'
 */
export function generateSlugFromNome(nome: string): string {
  return generateSlug(nome);
}

/**
 * Mapeia dados do formulário (camelCase) para formato do backend (snake_case)
 *
 * @param form - Dados do formulário
 * @returns Objeto parcial de Segmento pronto para envio ao backend
 */
export function mapSegmentoFormToSegmento(form: SegmentoForm): Partial<Segmento> {
  return {
    nome: form.nome,
    slug: form.slug,
    descricao: form.descricao,
  };
}