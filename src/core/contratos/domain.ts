/**
 * CONTRATOS DOMAIN - Entidades e Schemas de Validacao
 *
 * Modulo para gerenciamento de contratos juridicos.
 * Mapeia todos os 18 campos da tabela contratos do banco de dados.
 *
 * CONVENCOES:
 * - Prefixar schemas de criacao com "create" (ex: createContratoSchema)
 * - Prefixar schemas de atualizacao com "update" (ex: updateContratoSchema)
 * - Interfaces espelham estrutura do banco em camelCase
 * - NUNCA importar React/Next.js aqui
 */

import { z } from 'zod';

// =============================================================================
// TIPOS BASE (ENUMS)
// =============================================================================

/**
 * Area de direito do contrato
 */
export type AreaDireito =
  | 'trabalhista'
  | 'civil'
  | 'previdenciario'
  | 'criminal'
  | 'empresarial'
  | 'administrativo';

/**
 * Tipo de contrato juridico
 */
export type TipoContrato =
  | 'ajuizamento'
  | 'defesa'
  | 'ato_processual'
  | 'assessoria'
  | 'consultoria'
  | 'extrajudicial'
  | 'parecer';

/**
 * Tipo de cobranca do contrato
 */
export type TipoCobranca = 'pro_exito' | 'pro_labore';

/**
 * Status do contrato
 */
export type StatusContrato =
  | 'em_contratacao'
  | 'contratado'
  | 'distribuido'
  | 'desistencia';

/**
 * Polo processual do cliente
 */
export type PoloProcessual = 'autor' | 're';

/**
 * Tipo de parte no contrato (para campos JSONB)
 */
export type TipoParte = 'cliente' | 'parte_contraria';

// =============================================================================
// INTERFACES AUXILIARES
// =============================================================================

/**
 * Estrutura de uma parte no JSONB (parte_autora, parte_re)
 */
export interface ParteContrato {
  tipo: TipoParte;
  id: number;
  nome: string;
}

// =============================================================================
// ENTIDADE PRINCIPAL: Contrato
// =============================================================================

/**
 * Contrato juridico - mapeamento completo da tabela contratos
 *
 * Campos obrigatorios:
 * - id, areaDireito, tipoContrato, tipoCobranca, clienteId, poloCliente
 * - qtdeParteAutora, qtdeParteRe, status, dataContratacao
 * - createdAt, updatedAt
 *
 * Campos opcionais (nullable):
 * - parteContrariaId, parteAutora, parteRe, dataAssinatura
 * - dataDistribuicao, dataDesistencia, responsavelId, createdBy
 * - observacoes, dadosAnteriores
 */
export interface Contrato {
  id: number;
  areaDireito: AreaDireito;
  tipoContrato: TipoContrato;
  tipoCobranca: TipoCobranca;
  clienteId: number;
  poloCliente: PoloProcessual;
  parteContrariaId: number | null;
  parteAutora: ParteContrato[] | null;
  parteRe: ParteContrato[] | null;
  qtdeParteAutora: number;
  qtdeParteRe: number;
  status: StatusContrato;
  dataContratacao: string;
  dataAssinatura: string | null;
  dataDistribuicao: string | null;
  dataDesistencia: string | null;
  responsavelId: number | null;
  createdBy: number | null;
  observacoes: string | null;
  dadosAnteriores: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

/**
 * Schema para validar uma parte do contrato (JSONB)
 */
export const parteContratoSchema = z.object({
  tipo: z.enum(['cliente', 'parte_contraria']),
  id: z.number().int().positive('ID da parte deve ser positivo'),
  nome: z.string().min(1, 'Nome da parte e obrigatorio'),
});

/**
 * Schema de area de direito
 */
export const areaDireitoSchema = z.enum([
  'trabalhista',
  'civil',
  'previdenciario',
  'criminal',
  'empresarial',
  'administrativo',
]);

/**
 * Schema de tipo de contrato
 */
export const tipoContratoSchema = z.enum([
  'ajuizamento',
  'defesa',
  'ato_processual',
  'assessoria',
  'consultoria',
  'extrajudicial',
  'parecer',
]);

/**
 * Schema de tipo de cobranca
 */
export const tipoCobrancaSchema = z.enum(['pro_exito', 'pro_labore']);

/**
 * Schema de status do contrato
 */
export const statusContratoSchema = z.enum([
  'em_contratacao',
  'contratado',
  'distribuido',
  'desistencia',
]);

/**
 * Schema de polo processual
 */
export const poloProcessualSchema = z.enum(['autor', 're']);

/**
 * Schema para criacao de contrato
 *
 * Campos obrigatorios:
 * - areaDireito, tipoContrato, tipoCobranca, clienteId, poloCliente
 *
 * Campos opcionais com defaults:
 * - status: default 'em_contratacao'
 * - dataContratacao: default data atual
 * - qtdeParteAutora, qtdeParteRe: default 1
 */
export const createContratoSchema = z.object({
  // Campos obrigatorios
  areaDireito: areaDireitoSchema,
  tipoContrato: tipoContratoSchema,
  tipoCobranca: tipoCobrancaSchema,
  clienteId: z.number().int().positive('ID do cliente deve ser positivo'),
  poloCliente: poloProcessualSchema,

  // Campos opcionais
  parteContrariaId: z.number().int().positive('ID da parte contraria deve ser positivo').nullable().optional(),
  parteAutora: z.array(parteContratoSchema).nullable().optional(),
  parteRe: z.array(parteContratoSchema).nullable().optional(),
  qtdeParteAutora: z.number().int().positive('Quantidade deve ser positiva').optional().default(1),
  qtdeParteRe: z.number().int().positive('Quantidade deve ser positiva').optional().default(1),
  status: statusContratoSchema.optional().default('em_contratacao'),
  dataContratacao: z.string().optional(), // ISO date, default sera aplicado no repository
  dataAssinatura: z.string().nullable().optional(),
  dataDistribuicao: z.string().nullable().optional(),
  dataDesistencia: z.string().nullable().optional(),
  responsavelId: z.number().int().positive('ID do responsavel deve ser positivo').nullable().optional(),
  createdBy: z.number().int().positive('ID do criador deve ser positivo').nullable().optional(),
  observacoes: z.string().max(5000, 'Observacoes muito longas').nullable().optional(),
});

/**
 * Schema para atualizacao de contrato
 * Todos os campos sao opcionais (partial update)
 */
export const updateContratoSchema = z.object({
  areaDireito: areaDireitoSchema.optional(),
  tipoContrato: tipoContratoSchema.optional(),
  tipoCobranca: tipoCobrancaSchema.optional(),
  clienteId: z.number().int().positive('ID do cliente deve ser positivo').optional(),
  poloCliente: poloProcessualSchema.optional(),
  parteContrariaId: z.number().int().positive('ID da parte contraria deve ser positivo').nullable().optional(),
  parteAutora: z.array(parteContratoSchema).nullable().optional(),
  parteRe: z.array(parteContratoSchema).nullable().optional(),
  qtdeParteAutora: z.number().int().positive('Quantidade deve ser positiva').optional(),
  qtdeParteRe: z.number().int().positive('Quantidade deve ser positiva').optional(),
  status: statusContratoSchema.optional(),
  dataContratacao: z.string().nullable().optional(),
  dataAssinatura: z.string().nullable().optional(),
  dataDistribuicao: z.string().nullable().optional(),
  dataDesistencia: z.string().nullable().optional(),
  responsavelId: z.number().int().positive('ID do responsavel deve ser positivo').nullable().optional(),
  observacoes: z.string().max(5000, 'Observacoes muito longas').nullable().optional(),
});

// =============================================================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================================================

export type CreateContratoInput = z.infer<typeof createContratoSchema>;
export type UpdateContratoInput = z.infer<typeof updateContratoSchema>;

// =============================================================================
// PARAMETROS DE LISTAGEM
// =============================================================================

/**
 * Campos para ordenacao de contratos
 */
export type ContratoSortBy =
  | 'id'
  | 'data_contratacao'
  | 'status'
  | 'area_direito'
  | 'tipo_contrato'
  | 'created_at'
  | 'updated_at';

/**
 * Ordem de ordenacao
 */
export type Ordem = 'asc' | 'desc';

/**
 * Parametros para listar contratos
 */
export interface ListarContratosParams {
  pagina?: number;
  limite?: number;
  busca?: string; // Busca em observacoes
  areaDireito?: AreaDireito;
  tipoContrato?: TipoContrato;
  tipoCobranca?: TipoCobranca;
  status?: StatusContrato;
  clienteId?: number;
  parteContrariaId?: number;
  responsavelId?: number;
  ordenarPor?: ContratoSortBy;
  ordem?: Ordem;
}

// =============================================================================
// CONSTANTES
// =============================================================================

/**
 * Labels para exibicao das areas de direito
 */
export const AREA_DIREITO_LABELS: Record<AreaDireito, string> = {
  trabalhista: 'Trabalhista',
  civil: 'Civil',
  previdenciario: 'Previdenciário',
  criminal: 'Criminal',
  empresarial: 'Empresarial',
  administrativo: 'Administrativo',
};

/**
 * Labels para exibicao dos tipos de contrato
 */
export const TIPO_CONTRATO_LABELS: Record<TipoContrato, string> = {
  ajuizamento: 'Ajuizamento',
  defesa: 'Defesa',
  ato_processual: 'Ato Processual',
  assessoria: 'Assessoria',
  consultoria: 'Consultoria',
  extrajudicial: 'Extrajudicial',
  parecer: 'Parecer',
};

/**
 * Labels para exibicao dos tipos de cobranca
 */
export const TIPO_COBRANCA_LABELS: Record<TipoCobranca, string> = {
  pro_exito: 'Pró-Êxito',
  pro_labore: 'Pró-Labore',
};

/**
 * Labels para exibicao dos status
 */
export const STATUS_CONTRATO_LABELS: Record<StatusContrato, string> = {
  em_contratacao: 'Em Contratação',
  contratado: 'Contratado',
  distribuido: 'Distribuído',
  desistencia: 'Desistência',
};

/**
 * Labels para exibicao dos polos processuais
 */
export const POLO_PROCESSUAL_LABELS: Record<PoloProcessual, string> = {
  autor: 'Autor',
  re: 'Réu',
};
