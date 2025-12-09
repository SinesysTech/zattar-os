/**
 * Schemas TypeScript para processos do Sinesys
 * @module types/sinesys/processos
 */

import { z } from 'zod';
import {
  PapelCliente,
  TimelineStatus,
  PapelClienteSchema,
  TimelineStatusSchema,
  ApiResponse,
} from './common';

/**
 * Item de timeline de um processo
 */
export interface TimelineItem {
  /** Data da movimentação (formato: DD/MM/YYYY) */
  data: string;
  /** Evento ou tipo de movimentação */
  evento: string;
  /** Descrição detalhada da movimentação */
  descricao: string;
  /** Indica se há documento anexo disponível */
  tem_documento: boolean;
}

/**
 * Schema Zod para TimelineItem
 */
export const TimelineItemSchema = z.object({
  data: z.string(),
  evento: z.string(),
  descricao: z.string(),
  tem_documento: z.boolean(),
});

/**
 * Informações de uma instância judicial
 */
export interface InstanciaSinesys {
  /** Nome da vara */
  vara: string;
  /** Data de início na instância (formato: DD/MM/YYYY) */
  data_inicio: string;
  /** Próxima audiência agendada (formato: DD/MM/YYYY às HH:MM) */
  proxima_audiencia?: string;
}

/**
 * Schema Zod para InstanciaSinesys
 */
export const InstanciaSinesysSchema = z.object({
  vara: z.string(),
  data_inicio: z.string(),
  proxima_audiencia: z.string().optional(),
});

/**
 * Informações das partes do processo
 */
export interface PartesProcesso {
  /** Nome da parte autora/reclamante */
  polo_ativo: string;
  /** Nome da parte ré/reclamada */
  polo_passivo: string;
}

/**
 * Schema Zod para PartesProcesso
 */
export const PartesProcessoSchema = z.object({
  polo_ativo: z.string(),
  polo_passivo: z.string(),
});

/**
 * Última movimentação do processo
 */
export interface UltimaMovimentacao {
  /** Data da última movimentação (formato: DD/MM/YYYY) */
  data: string;
  /** Evento da última movimentação */
  evento: string;
}

/**
 * Schema Zod para UltimaMovimentacao
 */
export const UltimaMovimentacaoSchema = z.object({
  data: z.string(),
  evento: z.string(),
});

/**
 * Processo do Sinesys (formato nativo da API)
 */
export interface ProcessoSinesys {
  /** Número do processo (formato CNJ) */
  numero: string;
  /** Tipo/natureza do processo */
  tipo: string;
  /** Papel do cliente no processo */
  papel_cliente: PapelCliente;
  /** Nome da parte contrária */
  parte_contraria: string;
  /** Tribunal onde tramita o processo */
  tribunal: string;
  /** Indica se o processo é sigiloso */
  sigilo: boolean;
  /** Valor da causa */
  valor_causa?: number;
  /** Nome da vara */
  vara?: string;
  /** Informações das instâncias */
  instancias: {
    primeiro_grau: InstanciaSinesys | null;
    segundo_grau: InstanciaSinesys | null;
  };
  /** Timeline de movimentações do processo */
  timeline: TimelineItem[];
  /** Status de disponibilidade da timeline */
  timeline_status: TimelineStatus;
  /** Mensagem sobre status da timeline (se sincronizando) */
  timeline_mensagem?: string;
  /** Última movimentação registrada */
  ultima_movimentacao?: UltimaMovimentacao;
  /** Informações das partes */
  partes: PartesProcesso;
}

/**
 * Schema Zod para ProcessoSinesys
 */
export const ProcessoSinesysSchema = z.object({
  numero: z.string(),
  tipo: z.string(),
  papel_cliente: PapelClienteSchema,
  parte_contraria: z.string(),
  tribunal: z.string(),
  sigilo: z.boolean(),
  valor_causa: z.number().optional(),
  vara: z.string().optional(),
  instancias: z.object({
    primeiro_grau: InstanciaSinesysSchema.nullable(),
    segundo_grau: InstanciaSinesysSchema.nullable(),
  }),
  timeline: z.array(TimelineItemSchema),
  timeline_status: TimelineStatusSchema,
  timeline_mensagem: z.string().optional(),
  ultima_movimentacao: UltimaMovimentacaoSchema.optional(),
  partes: PartesProcessoSchema,
});

/**
 * Informações do cliente na resposta
 */
export interface ClienteInfo {
  /** Nome completo do cliente */
  nome: string;
  /** CPF do cliente (apenas números) */
  cpf: string;
}

/**
 * Schema Zod para ClienteInfo
 */
export const ClienteInfoSchema = z.object({
  nome: z.string(),
  cpf: z.string(),
});

/**
 * Resumo estatístico dos processos
 */
export interface ResumoProcessos {
  /** Total de processos encontrados */
  total_processos: number;
  /** Quantidade de processos com audiência próxima */
  com_audiencia_proxima: number;
}

/**
 * Schema Zod para ResumoProcessos
 */
export const ResumoProcessosSchema = z.object({
  total_processos: z.number(),
  com_audiencia_proxima: z.number(),
});

/**
 * Dados de resposta da API de processos
 */
export interface ProcessosResponseData {
  /** Informações do cliente */
  cliente: ClienteInfo;
  /** Resumo estatístico */
  resumo: ResumoProcessos;
  /** Lista de processos */
  processos: ProcessoSinesys[];
}

/**
 * Schema Zod para ProcessosResponseData
 */
export const ProcessosResponseDataSchema = z.object({
  cliente: ClienteInfoSchema,
  resumo: ResumoProcessosSchema,
  processos: z.array(ProcessoSinesysSchema),
});

/**
 * Resposta completa da API de processos por CPF
 * GET /api/acervo/cliente/cpf/{cpf}
 */
export type ProcessosResponse = ApiResponse<ProcessosResponseData>;

/**
 * Schema Zod para ProcessosResponse
 */
export const ProcessosResponseSchema = z.object({
  success: z.boolean(),
  data: ProcessosResponseDataSchema.optional(),
  error: z.string().optional(),
});

/**
 * Função helper para validar resposta de processos
 */
export function validateProcessosResponse(data: unknown): ProcessosResponse {
  return ProcessosResponseSchema.parse(data);
}
