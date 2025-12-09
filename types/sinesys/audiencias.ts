/**
 * Schemas TypeScript para audiências do Sinesys
 * @module types/sinesys/audiencias
 */

import { z } from 'zod';
import {
  PapelCliente,
  ModalidadeAudiencia,
  StatusAudiencia,
  TipoLocalAudiencia,
  PapelClienteSchema,
  ModalidadeAudienciaSchema,
  StatusAudienciaSchema,
  TipoLocalAudienciaSchema,
  ApiResponse,
} from './common';
import { ClienteInfo, ClienteInfoSchema } from './processos';

/**
 * Informações do local da audiência
 */
export interface LocalAudiencia {
  /** Tipo de local (virtual, presencial, híbrido) */
  tipo: TipoLocalAudiencia;
  /** URL para audiência virtual */
  url_virtual?: string;
  /** Endereço físico para audiência presencial */
  endereco?: string;
  /** Sala/número da sala para audiência presencial */
  sala?: string;
  /** Informações sobre presença híbrida */
  presenca_hibrida?: string;
}

/**
 * Schema Zod para LocalAudiencia
 */
export const LocalAudienciaSchema = z.object({
  tipo: TipoLocalAudienciaSchema,
  url_virtual: z.string().optional(),
  endereco: z.string().optional(),
  sala: z.string().optional(),
  presenca_hibrida: z.string().optional(),
});

/**
 * Informações das partes na audiência
 */
export interface PartesAudiencia {
  /** Nome da parte autora/reclamante */
  polo_ativo: string;
  /** Nome da parte ré/reclamada */
  polo_passivo: string;
}

/**
 * Schema Zod para PartesAudiencia
 */
export const PartesAudienciaSchema = z.object({
  polo_ativo: z.string(),
  polo_passivo: z.string(),
});

/**
 * Audiência do Sinesys (formato nativo da API)
 */
export interface AudienciaSinesys {
  /** Número do processo relacionado */
  numero_processo: string;
  /** Tipo de audiência (ex: "Audiência de Instrução") */
  tipo: string;
  /** Data da audiência (formato ISO: YYYY-MM-DD) */
  data: string;
  /** Horário da audiência (ex: "14:00 - 15:00") */
  horario: string;
  /** Modalidade da audiência */
  modalidade: ModalidadeAudiencia;
  /** Status atual da audiência */
  status: StatusAudiencia;
  /** Informações do local */
  local: LocalAudiencia;
  /** Informações das partes */
  partes: PartesAudiencia;
  /** Papel do cliente na audiência */
  papel_cliente: PapelCliente;
  /** Nome da parte contrária */
  parte_contraria: string;
  /** Tribunal onde ocorre a audiência */
  tribunal: string;
  /** Vara responsável */
  vara: string;
  /** Indica se é processo sigiloso */
  sigilo: boolean;
  /** Observações adicionais sobre a audiência */
  observacoes?: string;
}

/**
 * Schema Zod para AudienciaSinesys
 */
export const AudienciaSinesysSchema = z.object({
  numero_processo: z.string(),
  tipo: z.string(),
  data: z.string(),
  horario: z.string(),
  modalidade: ModalidadeAudienciaSchema,
  status: StatusAudienciaSchema,
  local: LocalAudienciaSchema,
  partes: PartesAudienciaSchema,
  papel_cliente: PapelClienteSchema,
  parte_contraria: z.string(),
  tribunal: z.string(),
  vara: z.string(),
  sigilo: z.boolean(),
  observacoes: z.string().optional(),
});

/**
 * Resumo estatístico das audiências
 */
export interface ResumoAudiencias {
  /** Total de audiências encontradas */
  total_audiencias: number;
  /** Quantidade de audiências futuras */
  futuras: number;
  /** Quantidade de audiências realizadas */
  realizadas: number;
  /** Quantidade de audiências canceladas */
  canceladas: number;
}

/**
 * Schema Zod para ResumoAudiencias
 */
export const ResumoAudienciasSchema = z.object({
  total_audiencias: z.number(),
  futuras: z.number(),
  realizadas: z.number(),
  canceladas: z.number(),
});

/**
 * Dados de resposta da API de audiências
 */
export interface AudienciasResponseData {
  /** Informações do cliente */
  cliente: ClienteInfo;
  /** Resumo estatístico */
  resumo: ResumoAudiencias;
  /** Lista de audiências */
  audiencias: AudienciaSinesys[];
}

/**
 * Schema Zod para AudienciasResponseData
 */
export const AudienciasResponseDataSchema = z.object({
  cliente: ClienteInfoSchema,
  resumo: ResumoAudienciasSchema,
  audiencias: z.array(AudienciaSinesysSchema),
});

/**
 * Resposta completa da API de audiências por CPF
 * GET /api/audiencias/cliente/cpf/{cpf}
 */
export type AudienciasResponse = ApiResponse<AudienciasResponseData>;

/**
 * Schema Zod para AudienciasResponse
 */
export const AudienciasResponseSchema = z.object({
  success: z.boolean(),
  data: AudienciasResponseDataSchema.optional(),
  error: z.string().optional(),
});

/**
 * Função helper para validar resposta de audiências
 */
export function validateAudienciasResponse(data: unknown): AudienciasResponse {
  return AudienciasResponseSchema.parse(data);
}
