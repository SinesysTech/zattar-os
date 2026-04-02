import { z } from 'zod';

/**
 * ASSISTENTES-TIPOS DOMAIN
 * 
 * Relacionamento entre assistentes Dify e tipos de expedientes para automação.
 * Quando um expediente é criado com um tipo específico, o sistema dispara
 * automaticamente o assistente configurado para gerar a peça jurídica.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AssistenteTipo {
  id: number;
  assistente_id: number;
  tipo_expediente_id: number;
  ativo: boolean;
  criado_por: number;
  created_at: string;
  updated_at: string;
}

export interface AssistenteTipoComRelacoes extends AssistenteTipo {
  assistente_nome: string;
  assistente_dify_app_id: string | null;
  tipo_expediente_nome: string;
  criador_nome: string;
}

// ============================================================================
// SCHEMAS
// ============================================================================

export const criarAssistenteTipoSchema = z.object({
  assistente_id: z.number().int().positive('ID do assistente deve ser positivo'),
  tipo_expediente_id: z.number().int().positive('ID do tipo de expediente deve ser positivo'),
  ativo: z.boolean().default(true),
});

export const atualizarAssistenteTipoSchema = z.object({
  assistente_id: z.number().int().positive().optional(),
  tipo_expediente_id: z.number().int().positive().optional(),
  ativo: z.boolean().optional(),
});

export const listarAssistentesTiposSchema = z.object({
  assistente_id: z.number().int().positive().optional(),
  tipo_expediente_id: z.number().int().positive().optional(),
  ativo: z.boolean().optional(),
  limite: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CriarAssistenteTipoInput = z.infer<typeof criarAssistenteTipoSchema>;
export type AtualizarAssistenteTipoInput = z.infer<typeof atualizarAssistenteTipoSchema>;
export type ListarAssistentesTiposParams = z.infer<typeof listarAssistentesTiposSchema>;
