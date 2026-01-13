/**
 * CHATWOOT DOMAIN - Tipos e Schemas
 *
 * Define tipos, schemas Zod e utilitários para integração com Chatwoot.
 */

import { z } from 'zod';

// =============================================================================
// Tipos de Entidade
// =============================================================================

export type TipoEntidadeChatwoot = 'cliente' | 'parte_contraria' | 'terceiro';

export const tipoEntidadeChatwootSchema = z.enum([
  'cliente',
  'parte_contraria',
  'terceiro',
]);

// =============================================================================
// PartesChatwoot (mapeamento local)
// =============================================================================

export interface PartesChatwoot {
  id: number;
  tipo_entidade: TipoEntidadeChatwoot;
  entidade_id: number;
  chatwoot_contact_id: number;
  chatwoot_account_id: number;
  ultima_sincronizacao: string;
  dados_sincronizados: Record<string, unknown>;
  sincronizado: boolean;
  erro_sincronizacao: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Input Schemas
// =============================================================================

export const createPartesChatwootSchema = z.object({
  tipo_entidade: tipoEntidadeChatwootSchema,
  entidade_id: z.number().int().positive(),
  chatwoot_contact_id: z.number().int().positive(),
  chatwoot_account_id: z.number().int().positive(),
  dados_sincronizados: z.record(z.unknown()).optional().default({}),
});

export type CreatePartesChatwootInput = z.infer<typeof createPartesChatwootSchema>;

export const updatePartesChatwootSchema = z.object({
  ultima_sincronizacao: z.string().datetime().optional(),
  dados_sincronizados: z.record(z.unknown()).optional(),
  sincronizado: z.boolean().optional(),
  erro_sincronizacao: z.string().nullable().optional(),
});

export type UpdatePartesChatwootInput = z.infer<typeof updatePartesChatwootSchema>;

// =============================================================================
// Query Params
// =============================================================================

export interface ListarMapeamentosParams {
  limite?: number;
  offset?: number;
  tipo_entidade?: TipoEntidadeChatwoot;
  sincronizado?: boolean;
  chatwoot_account_id?: number;
}

export const listarMapeamentosSchema = z.object({
  limite: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  tipo_entidade: tipoEntidadeChatwootSchema.optional(),
  sincronizado: z.boolean().optional(),
  chatwoot_account_id: z.number().int().positive().optional(),
});

// =============================================================================
// Dados de sincronização
// =============================================================================

export interface DadosSincronizados {
  nome: string;
  email: string | null;
  telefone: string | null;
  identifier: string | null;
  tipo_pessoa: 'pf' | 'pj';
  tipo_entidade: TipoEntidadeChatwoot;
  labels: string[];
  custom_attributes: Record<string, unknown>;
  sincronizado_em: string;
}

// =============================================================================
// Resultado de sincronização
// =============================================================================

export interface SincronizacaoResult {
  sucesso: boolean;
  mapeamento: PartesChatwoot | null;
  chatwoot_contact_id: number | null;
  criado: boolean;
  erro?: string;
}

// =============================================================================
// Funções utilitárias
// =============================================================================

/**
 * Normaliza número de telefone para formato internacional
 * @example formatarTelefoneInternacional('11', '999999999') => '+5511999999999'
 */
export function formatarTelefoneInternacional(
  ddd: string | null | undefined,
  numero: string | null | undefined
): string | null {
  if (!ddd || !numero) return null;

  // Remove caracteres não numéricos
  const dddLimpo = ddd.replace(/\D/g, '');
  const numeroLimpo = numero.replace(/\D/g, '');

  if (!dddLimpo || !numeroLimpo) return null;

  // Formato: +55DDDNUMERO
  return `+55${dddLimpo}${numeroLimpo}`;
}

/**
 * Normaliza documento (CPF/CNPJ) para uso como identifier
 * Remove pontuação e mantém apenas dígitos
 */
export function normalizarDocumentoParaIdentifier(
  documento: string | null | undefined
): string | null {
  if (!documento) return null;
  return documento.replace(/\D/g, '');
}

/**
 * Obtém primeiro email de um array de emails
 */
export function obterPrimeiroEmail(
  emails: string[] | null | undefined
): string | null {
  if (!emails || emails.length === 0) return null;
  return emails[0];
}

/**
 * Verifica se dois objetos de dados sincronizados são diferentes
 * Usado para detectar mudanças e decidir se precisa sincronizar
 */
export function dadosModificados(
  anterior: Record<string, unknown>,
  atual: Record<string, unknown>
): boolean {
  const camposComparar = ['nome', 'email', 'telefone', 'identifier'];

  for (const campo of camposComparar) {
    if (anterior[campo] !== atual[campo]) {
      return true;
    }
  }

  return false;
}
