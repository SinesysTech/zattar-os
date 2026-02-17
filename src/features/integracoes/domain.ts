/**
 * Domain - Integrações
 * Entidades, schemas e regras de negócio para integrações externas
 */

import { z } from "zod";

// =============================================================================
// TIPOS DE INTEGRAÇÃO
// =============================================================================

export const TIPOS_INTEGRACAO = {
  twofauth: "twofauth",
  zapier: "zapier",
  dify: "dify",
  webhook: "webhook",
  api: "api",
  chatwoot: "chatwoot",
} as const;

export type TipoIntegracao = keyof typeof TIPOS_INTEGRACAO;

// =============================================================================
// SCHEMAS ZOD
// =============================================================================

// Schema base para integração
export const integracaoBaseSchema = z.object({
  tipo: z.enum(["twofauth", "zapier", "dify", "webhook", "api", "chatwoot"]),
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
  configuracao: z.record(z.unknown()).default({}),
  metadata: z.record(z.unknown()).optional(),
});

// Schema para criar integração
export const criarIntegracaoSchema = integracaoBaseSchema;

// Schema para atualizar integração
export const atualizarIntegracaoSchema = integracaoBaseSchema.partial().extend({
  id: z.string().uuid(),
});

// Schema específico para 2FAuth
export const twofauthConfigSchema = z.object({
  api_url: z.string().url("URL inválida"),
  api_token: z.string().min(10, "Token deve ter no mínimo 10 caracteres"),
  account_id: z.number().int("Account ID deve ser um número inteiro").positive("Account ID deve ser positivo").optional(),
});

// Schema específico para Chatwoot
export const chatwootConfigSchema = z.object({
  api_url: z.string().url("URL inválida"),
  api_key: z.string().min(10, "API key deve ter no mínimo 10 caracteres"),
  account_id: z.number().int("Account ID deve ser um número inteiro").positive("Account ID deve ser positivo"),
  default_inbox_id: z.number().int().positive().optional(),
});

// =============================================================================
// TIPOS TYPESCRIPT
// =============================================================================

export interface Integracao {
  id: string;
  tipo: TipoIntegracao;
  nome: string;
  descricao?: string;
  ativo: boolean;
  configuracao: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by_auth_id?: string;
  updated_by_auth_id?: string;
}

export interface TwoFAuthConfig {
  api_url: string;
  api_token: string;
  account_id?: number;
}

export interface ChatwootConfig {
  api_url: string;
  api_key: string;
  account_id: number;
  default_inbox_id?: number;
}

export type CriarIntegracaoParams = z.infer<typeof criarIntegracaoSchema>;
export type AtualizarIntegracaoParams = z.infer<typeof atualizarIntegracaoSchema>;

// =============================================================================
// CONSTANTES
// =============================================================================

export const LABELS_TIPO_INTEGRACAO: Record<TipoIntegracao, string> = {
  twofauth: "2FAuth",
  zapier: "Zapier",
  dify: "Dify",
  webhook: "Webhook",
  api: "API",
  chatwoot: "Chatwoot",
};

export const DESCRICOES_TIPO_INTEGRACAO: Record<TipoIntegracao, string> = {
  twofauth: "Autenticação de dois fatores",
  zapier: "Automação de workflows",
  dify: "Agentes e workflows de IA",
  webhook: "Webhooks personalizados",
  api: "Integrações via API",
  chatwoot: "Sistema de atendimento e conversas",
};
