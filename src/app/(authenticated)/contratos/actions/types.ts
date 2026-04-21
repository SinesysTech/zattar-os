/**
 * Contratos Actions — Tipos compartilhados (sem "use server").
 */

import type { Contrato } from "../domain";

// ============================================================================
// Resultado padrão de Server Actions
// ============================================================================

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | {
      success: false;
      error: string;
      errors?: Record<string, string[]>;
      message: string;
    };

// ============================================================================
// Segmentos (segmentos-actions.ts)
// ============================================================================

export interface Segmento {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSegmentoInput {
  nome: string;
  slug: string;
  descricao?: string | null;
}

export interface UpdateSegmentoInput {
  nome?: string;
  slug?: string;
  descricao?: string | null;
  ativo?: boolean;
}

// ============================================================================
// Contrato Completo (contratos-actions.ts)
// ============================================================================

export interface ClienteDetalhado {
  id: number;
  nome: string;
  tipoPessoa: "pf" | "pj";
  cpfCnpj: string | null;
  emails: string[] | null;
  dddCelular: string | null;
  numeroCelular: string | null;
  endereco: {
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    municipio: string | null;
    estadoSigla: string | null;
  } | null;
}

export interface ResponsavelDetalhado {
  id: number;
  nome: string;
}

export interface SegmentoDetalhado {
  id: number;
  nome: string;
}

export interface ContratoCompletoStats {
  totalPartes: number;
  totalProcessos: number;
  totalDocumentos: number;
  totalLancamentos: number;
}

export interface ContratoCompleto {
  contrato: Contrato;
  cliente: ClienteDetalhado | null;
  responsavel: ResponsavelDetalhado | null;
  segmento: SegmentoDetalhado | null;
  stats: ContratoCompletoStats;
}

// ============================================================================
// Pulse Stats (KPI Strip)
// ============================================================================

export interface ContratosPulseStats {
  ativos: number;
  valorTotal: number;
  vencendo30d: number;
  novosMes: number;
  semResponsavel: number;
  porStatus: Record<string, number>;
  trendMensal: number[];
}
