/**
 * ASSINATURA DIGITAL DOMAIN - Entidades e Schemas de Validação
 * 
 * CONVENÇÕES:
 * - Prefixar schemas com "create" ou "update" (createDocumentoSchema)
 * - Interfaces em camelCase espelhando o banco de dados
 * - NUNCA importar React/Next.js aqui
 * - Schemas Zod para validação de entrada
 * - Tipos base e enums
 * 
 * FLUXOS SUPORTADOS:
 * 1. Fluxo antigo: Templates + Formulários (simulador/preview)
 * 2. Fluxo novo: Documentos via upload de PDF + links públicos
 */

import { z } from "zod";
import type { ClienteBase, ParteContraria } from "@/features/partes/domain";

// =============================================================================
// TIPOS BASE E ENUMS
// =============================================================================

export type AssinaturaDigitalDocumentoStatus =
  | "rascunho"
  | "pronto"
  | "concluido"
  | "cancelado";

export type AssinaturaDigitalDocumentoAssinanteTipo =
  | "cliente"
  | "parte_contraria"
  | "representante"
  | "terceiro"
  | "usuario"
  | "convidado";

export type AssinaturaDigitalDocumentoAncoraTipo = "assinatura" | "rubrica";

// =============================================================================
// SCHEMAS ZOD - DOCUMENTOS (NOVO FLUXO)
// =============================================================================

export const createAssinaturaDigitalDocumentoAssinanteSchema = z.object({
  assinante_tipo: z.enum([
    "cliente",
    "parte_contraria",
    "representante",
    "terceiro",
    "usuario",
    "convidado",
  ]),
  assinante_entidade_id: z.number().int().positive().optional().nullable(),
  dados_snapshot: z.record(z.unknown()).optional(),
});

export const createAssinaturaDigitalDocumentoSchema = z.object({
  titulo: z.string().min(1).max(200).optional().nullable(),
  selfie_habilitada: z.boolean().default(false),
  pdf_original_url: z.string().url(),
  hash_original_sha256: z.string().optional().nullable(),
  created_by: z.number().int().positive().optional().nullable(),
  assinantes: z
    .array(createAssinaturaDigitalDocumentoAssinanteSchema)
    .min(1)
    .max(50),
});

export const upsertAssinaturaDigitalDocumentoAncoraSchema = z.object({
  documento_assinante_id: z.number().int().positive(),
  tipo: z.enum(["assinatura", "rubrica"]),
  pagina: z.number().int().positive(),
  x_norm: z.number().min(0).max(1),
  y_norm: z.number().min(0).max(1),
  w_norm: z.number().min(0).max(1),
  h_norm: z.number().min(0).max(1),
});

export const updatePublicSignerIdentificationSchema = z.object({
  nome_completo: z.string().min(3).max(200).optional(),
  cpf: z.string().regex(/^\d{11}$/).optional(),
  email: z.string().email().optional(),
  telefone: z.string().min(10).max(15).optional(),
});

export const finalizePublicSignerSchema = z.object({
  selfie_base64: z.string().optional().nullable(),
  assinatura_base64: z.string().min(1),
  rubrica_base64: z.string().optional().nullable(),
  ip_address: z.string().optional().nullable(),
  user_agent: z.string().optional().nullable(),
  geolocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().optional(),
    })
    .optional()
    .nullable(),
  termos_aceite_versao: z.string().default("v1.0-MP2200-2"),
  dispositivo_fingerprint_raw: z.record(z.unknown()).optional().nullable(),
});

// (Schemas de templates/formulários antigos removidos - fluxo legado descontinuado)

// =============================================================================
// INTERFACES TYPESCRIPT - DOCUMENTOS (NOVO FLUXO)
// =============================================================================

export interface AssinaturaDigitalDocumento {
  id: number;
  documento_uuid: string;
  titulo?: string | null;
  status: AssinaturaDigitalDocumentoStatus;
  selfie_habilitada: boolean;
  pdf_original_url: string;
  pdf_final_url?: string | null;
  hash_original_sha256?: string | null;
  hash_final_sha256?: string | null;
  created_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssinaturaDigitalDocumentoAssinante {
  id: number;
  documento_id: number;
  assinante_tipo: AssinaturaDigitalDocumentoAssinanteTipo;
  assinante_entidade_id?: number | null;
  dados_snapshot: Record<string, unknown>;
  dados_confirmados: boolean;
  token: string;
  status: "pendente" | "concluido";
  selfie_url?: string | null;
  assinatura_url?: string | null;
  rubrica_url?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  geolocation?: Record<string, unknown> | null;
  termos_aceite_versao?: string | null;
  termos_aceite_data?: string | null;
  dispositivo_fingerprint_raw?: Record<string, unknown> | null;
  concluido_em?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssinaturaDigitalDocumentoAncora {
  id: number;
  documento_id: number;
  documento_assinante_id: number;
  tipo: AssinaturaDigitalDocumentoAncoraTipo;
  pagina: number;
  x_norm: number;
  y_norm: number;
  w_norm: number;
  h_norm: number;
  created_at?: string;
}

export interface AssinaturaDigitalDocumentoCompleto
  extends AssinaturaDigitalDocumento {
  assinantes: AssinaturaDigitalDocumentoAssinante[];
  ancoras: AssinaturaDigitalDocumentoAncora[];
}

// =============================================================================
// INTERFACES TYPESCRIPT - TEMPLATES
// =============================================================================

// =============================================================================
// TYPES INFERIDOS DOS SCHEMAS ZOD (NOVO FLUXO)
// =============================================================================

export type CreateAssinaturaDigitalDocumentoAssinanteInput = z.infer<
  typeof createAssinaturaDigitalDocumentoAssinanteSchema
>;
export type CreateAssinaturaDigitalDocumentoInput = z.infer<
  typeof createAssinaturaDigitalDocumentoSchema
>;
export type UpsertAssinaturaDigitalDocumentoAncoraInput = z.infer<
  typeof upsertAssinaturaDigitalDocumentoAncoraSchema
>;
export type UpdatePublicSignerIdentificationInput = z.infer<
  typeof updatePublicSignerIdentificationSchema
>;
export type FinalizePublicSignerInput = z.infer<
  typeof finalizePublicSignerSchema
>;
