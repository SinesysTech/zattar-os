/**
 * Domain: Public Leads
 * ============================================================================
 * Zod schemas e tipos do domínio de leads capturados em formulários públicos
 * (/contato e futuros). Consumido pela Server Action `submit-lead` e pelo
 * módulo admin `/leads` (a construir — ver project_leads_admin_module.md).
 * ============================================================================
 */

import { z } from 'zod';

// ─── Sources aceitos ────────────────────────────────────────────────────────
export const LeadSourceSchema = z.enum([
  'website-contato',
  'website-faq',
  'website-solucoes',
  'website-expertise',
  'website-insights',
  'api',
  'import',
  'other',
]);
export type LeadSource = z.infer<typeof LeadSourceSchema>;

// ─── Status do lead (gerenciado pelo admin) ─────────────────────────────────
export const LeadStatusSchema = z.enum([
  'novo',
  'em_contato',
  'qualificado',
  'convertido',
  'descartado',
  'spam',
]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

// ─── Input do formulário público ────────────────────────────────────────────
// Inclui honeypot `website` que DEVE estar vazio (bots tendem a preencher).
export const PublicLeadInputSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Informe seu nome completo')
    .max(200, 'Nome muito longo'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('E-mail inválido')
    .max(320, 'E-mail muito longo'),
  telefone: z
    .string()
    .trim()
    .max(32, 'Telefone muito longo')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  assunto: z
    .string()
    .trim()
    .max(200, 'Assunto muito longo')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  mensagem: z
    .string()
    .trim()
    .min(10, 'Conte-nos um pouco mais (mínimo 10 caracteres)')
    .max(5000, 'Mensagem muito longa (máximo 5000 caracteres)'),
  source: LeadSourceSchema,
  // Honeypot — bot-filter. Campo invisível no form; se vier preenchido descartamos.
  website: z.string().max(0, 'Campo inválido').optional().or(z.literal('')),
});
export type PublicLeadInput = z.infer<typeof PublicLeadInputSchema>;

// ─── Row completa da tabela ─────────────────────────────────────────────────
// Reflete a estrutura de public.public_leads (migration 20260421120000).
export const PublicLeadRowSchema = z.object({
  id: z.number(),
  nome: z.string(),
  email: z.string(),
  telefone: z.string().nullable(),
  assunto: z.string().nullable(),
  mensagem: z.string(),
  source: LeadSourceSchema,
  user_agent: z.string().nullable(),
  ip: z.string().nullable(),
  status: LeadStatusSchema,
  atribuido_a: z.number().nullable(),
  cliente_id: z.number().nullable(),
  notas_internas: z.string().nullable(),
  motivo_descarte: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  lida_em: z.string().nullable(),
  respondida_em: z.string().nullable(),
});
export type PublicLeadRow = z.infer<typeof PublicLeadRowSchema>;

// ─── Dados derivados do request (não capturados no form) ────────────────────
export type PublicLeadMetadata = {
  userAgent?: string | null;
  ip?: string | null;
};
