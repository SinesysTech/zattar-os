/**
 * CONTRATOS FEATURE - Tipos e Schemas de Validação
 *
 * Módulo para gerenciamento de contratos jurídicos.
 * Mapeia todos os campos da tabela contratos do banco de dados.
 *
 * CONVENÇÕES:
 * - Prefixar schemas de criação com "create" (ex: createContratoSchema)
 * - Prefixar schemas de atualização com "update" (ex: updateContratoSchema)
 * - Interfaces espelham estrutura do banco em camelCase
 */

import { z } from 'zod';

// =============================================================================
// TIPOS BASE (ENUMS)
// =============================================================================

/**
 * Área de direito do contrato
 */
export type AreaDireito =
  | 'trabalhista'
  | 'civil'
  | 'previdenciario'
  | 'criminal'
  | 'empresarial'
  | 'administrativo';

/**
 * Tipo de contrato jurídico
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
 * Tipo de cobrança do contrato
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
 * Contrato jurídico - mapeamento completo da tabela contratos
 *
 * Campos obrigatórios:
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
  /** @deprecated Usar segmentoId */
  areaDireito: AreaDireito;
  segmentoId: number | null;
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
  nome: z.string().min(1, 'Nome da parte é obrigatório'),
});

/**
 * Schema de área de direito
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
 * Schema de tipo de cobrança
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
 * Schema para criação de contrato
 *
 * Campos obrigatórios:
 * - areaDireito, tipoContrato, tipoCobranca, clienteId, poloCliente
 *
 * Campos opcionais com defaults:
 * - status: default 'em_contratacao'
 * - dataContratacao: default data atual
 * - qtdeParteAutora, qtdeParteRe: default 1
 */
export const createContratoSchema = z.object({
  // Campos obrigatórios
  areaDireito: areaDireitoSchema.optional(), // Temporariamente opcional para transição
  segmentoId: z.number().int().positive('ID do segmento deve ser positivo').nullable().optional(),
  tipoContrato: tipoContratoSchema,
  tipoCobranca: tipoCobrancaSchema,
  clienteId: z.number().int().positive('ID do cliente deve ser positivo'),
  poloCliente: poloProcessualSchema,

  // Campos opcionais
  parteContrariaId: z.number().int().positive('ID da parte contrária deve ser positivo').nullable().optional(),
  parteAutora: z.array(parteContratoSchema).nullable().optional(),
  parteRe: z.array(parteContratoSchema).nullable().optional(),
  qtdeParteAutora: z.number().int().positive('Quantidade deve ser positiva').optional().default(1),
  qtdeParteRe: z.number().int().positive('Quantidade deve ser positiva').optional().default(1),
  status: statusContratoSchema.optional().default('em_contratacao'),
  dataContratacao: z.string().optional(), // ISO date, default será aplicado no repository
  dataAssinatura: z.string().nullable().optional(),
  dataDistribuicao: z.string().nullable().optional(),
  dataDesistencia: z.string().nullable().optional(),
  responsavelId: z.number().int().positive('ID do responsável deve ser positivo').nullable().optional(),
  createdBy: z.number().int().positive('ID do criador deve ser positivo').nullable().optional(),
  observacoes: z.string().max(5000, 'Observações muito longas').nullable().optional(),
});

/**
 * Schema para atualização de contrato
 * Todos os campos são opcionais (partial update)
 */
export const updateContratoSchema = z.object({
  areaDireito: areaDireitoSchema.optional(),
  segmentoId: z.number().int().positive('ID do segmento deve ser positivo').nullable().optional(),
  tipoContrato: tipoContratoSchema.optional(),
  tipoCobranca: tipoCobrancaSchema.optional(),
  clienteId: z.number().int().positive('ID do cliente deve ser positivo').optional(),
  poloCliente: poloProcessualSchema.optional(),
  parteContrariaId: z.number().int().positive('ID da parte contrária deve ser positivo').nullable().optional(),
  parteAutora: z.array(parteContratoSchema).nullable().optional(),
  parteRe: z.array(parteContratoSchema).nullable().optional(),
  qtdeParteAutora: z.number().int().positive('Quantidade deve ser positiva').optional(),
  qtdeParteRe: z.number().int().positive('Quantidade deve ser positiva').optional(),
  status: statusContratoSchema.optional(),
  dataContratacao: z.string().nullable().optional(),
  dataAssinatura: z.string().nullable().optional(),
  dataDistribuicao: z.string().nullable().optional(),
  dataDesistencia: z.string().nullable().optional(),
  responsavelId: z.number().int().positive('ID do responsável deve ser positivo').nullable().optional(),
  observacoes: z.string().max(5000, 'Observações muito longas').nullable().optional(),
});

// =============================================================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================================================

export type CreateContratoInput = z.infer<typeof createContratoSchema>;
export type UpdateContratoInput = z.infer<typeof updateContratoSchema>;

// =============================================================================
// PARÂMETROS DE LISTAGEM
// =============================================================================

/**
 * Campos para ordenação de contratos
 */
export type ContratoSortBy =
  | 'id'
  | 'data_contratacao'
  | 'status'
  | 'area_direito'
  | 'segmento_id'
  | 'tipo_contrato'
  | 'created_at'
  | 'updated_at';

/**
 * Ordem de ordenação
 */
export type Ordem = 'asc' | 'desc';

/**
 * Parâmetros para listar contratos
 */
export interface ListarContratosParams {
  pagina?: number;
  limite?: number;
  busca?: string; // Busca em observações
  areaDireito?: AreaDireito;
  segmentoId?: number;
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
// CONSTANTES (LABELS)
// =============================================================================

/**
 * Labels para exibição das áreas de direito
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
 * Labels para exibição dos tipos de contrato
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
 * Labels para exibição dos tipos de cobrança
 */
export const TIPO_COBRANCA_LABELS: Record<TipoCobranca, string> = {
  pro_exito: 'Pró-Êxito',
  pro_labore: 'Pró-Labore',
};

/**
 * Labels para exibição dos status
 */
export const STATUS_CONTRATO_LABELS: Record<StatusContrato, string> = {
  em_contratacao: 'Em Contratação',
  contratado: 'Contratado',
  distribuido: 'Distribuído',
  desistencia: 'Desistência',
};

/**
 * Labels para exibição dos polos processuais
 */
export const POLO_PROCESSUAL_LABELS: Record<PoloProcessual, string> = {
  autor: 'Autor',
  re: 'Réu',
};

// =============================================================================
// TIPOS FRONTEND (API Response, Filtros)
// =============================================================================

/**
 * Resposta da API de contratos (formato padrão)
 */
export interface ContratosApiResponse {
  success: boolean;
  data: {
    contratos: Contrato[];
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

/**
 * Parâmetros para buscar contratos (frontend)
 */
export interface BuscarContratosParams extends Partial<ListarContratosParams> {
  pagina?: number;
  limite?: number;
  busca?: string;
  areaDireito?: AreaDireito;
  tipoContrato?: TipoContrato;
  tipoCobranca?: TipoCobranca;
  status?: StatusContrato;
  clienteId?: number;
  parteContrariaId?: number;
  responsavelId?: number;
}

/**
 * Estado de filtros da página de contratos
 */
export interface ContratosFilters {
  areaDireito?: AreaDireito;
  tipoContrato?: TipoContrato;
  tipoCobranca?: TipoCobranca;
  status?: StatusContrato;
  clienteId?: number;
  parteContrariaId?: number;
  responsavelId?: number;
}

/**
 * Informações de paginação
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Info básica de cliente/parte para selects
 */
export interface ClienteInfo {
  id: number;
  nome: string;
}
