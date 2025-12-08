/**
 * Tipos compartilhados entre as entidades Sinesys
 * @module types/sinesys/common
 */

import { z } from 'zod';

/**
 * Tipo base de resposta das APIs Sinesys
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Status de sincronização de timeline
 */
export type TimelineStatus = 'disponivel' | 'sincronizando' | 'indisponivel';

/**
 * Papel do cliente em um processo
 */
export type PapelCliente = 'Reclamante' | 'Reclamado' | 'Autor' | 'Réu';

/**
 * Modalidade de audiência
 */
export type ModalidadeAudiencia = 'Virtual' | 'Presencial' | 'Híbrida';

/**
 * Status de audiência
 */
export type StatusAudiencia = 'Designada' | 'Realizada' | 'Cancelada' | 'Adiada';

/**
 * Tipo de local de audiência
 */
export type TipoLocalAudiencia = 'virtual' | 'presencial' | 'hibrido';

/**
 * Status de contrato
 */
export type StatusContrato = 'ativo' | 'encerrado' | 'suspenso';

/**
 * Tipo de acordo/condenação
 */
export type TipoAcordo = 'acordo' | 'condenacao';

/**
 * Direção do acordo (recebimento ou pagamento)
 */
export type DirecaoAcordo = 'recebimento' | 'pagamento';

/**
 * Forma de pagamento do acordo
 */
export type FormaPagamento = 'unica' | 'parcelada';

/**
 * Modalidade de pagamento
 */
export type ModalidadePagamento = 'judicial' | 'extrajudicial';

/**
 * Status de parcela
 */
export type StatusParcela = 'pendente' | 'paga' | 'vencida';

// ========== SCHEMAS ZOD PARA VALIDAÇÃO ==========

/**
 * Schema Zod para PapelCliente
 */
export const PapelClienteSchema = z.enum(['Reclamante', 'Reclamado', 'Autor', 'Réu']);

/**
 * Schema Zod para ModalidadeAudiencia
 */
export const ModalidadeAudienciaSchema = z.enum(['Virtual', 'Presencial', 'Híbrida']);

/**
 * Schema Zod para StatusAudiencia
 */
export const StatusAudienciaSchema = z.enum(['Designada', 'Realizada', 'Cancelada', 'Adiada']);

/**
 * Schema Zod para TipoLocalAudiencia
 */
export const TipoLocalAudienciaSchema = z.enum(['virtual', 'presencial', 'hibrido']);

/**
 * Schema Zod para TimelineStatus
 */
export const TimelineStatusSchema = z.enum(['disponivel', 'sincronizando', 'indisponivel']);

/**
 * Schema Zod para StatusContrato
 */
export const StatusContratoSchema = z.enum(['ativo', 'encerrado', 'suspenso']);

/**
 * Schema Zod para TipoAcordo
 */
export const TipoAcordoSchema = z.enum(['acordo', 'condenacao']);

/**
 * Schema Zod para DirecaoAcordo
 */
export const DirecaoAcordoSchema = z.enum(['recebimento', 'pagamento']);

/**
 * Schema Zod para FormaPagamento
 */
export const FormaPagamentoSchema = z.enum(['unica', 'parcelada']);

/**
 * Schema Zod para ModalidadePagamento
 */
export const ModalidadePagamentoSchema = z.enum(['judicial', 'extrajudicial']);

/**
 * Schema Zod para StatusParcela
 */
export const StatusParcelaSchema = z.enum(['pendente', 'paga', 'vencida']);
