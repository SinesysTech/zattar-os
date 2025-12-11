/**
 * Types for Advogados Feature
 * Consolidates types from backend/types/advogados and backend/types/credenciais
 */

import { z } from 'zod';

// ============================================================================
// Shared Types (from trt-types)
// ============================================================================

// We need to import these or redefine them if we want to remove dependency on backend/types/captura
// Since capture feature is also being migrated, we should check where trt-types went.
// It should be in src/features/captura/types.ts.
// But we might not have migrated captura types yet or we can use strings for now and fix later.
// Let's assume we can import from types/domain/common or redefine.
// The code uses CodigoTRT and GrauTRT.

export type CodigoTRT = string; // e.g. TRT1, TRT2...
export type GrauTRT = '1' | '2'; // or 'primeiro_grau', 'segundo_grau'? Backend types say '1' | '2' usually for login credentials.

// ============================================================================
// Advogado Types
// ============================================================================

/**
 * Dados de um advogado
 */
export interface Advogado {
  id: number;
  nome_completo: string;
  cpf: string;
  oab: string;
  uf_oab: string;
  created_at: string;
  updated_at: string;
}

/**
 * Dados para criar um novo advogado
 */
export interface CriarAdvogadoParams {
  nome_completo: string;
  cpf: string;
  oab: string;
  uf_oab: string;
}

/**
 * Dados para atualizar um advogado
 */
export interface AtualizarAdvogadoParams {
  nome_completo?: string;
  cpf?: string;
  oab?: string;
  uf_oab?: string;
}

/**
 * Parâmetros para listar advogados
 */
export interface ListarAdvogadosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  oab?: string;
  uf_oab?: string;
  com_credenciais?: boolean;
}

/**
 * Resultado da listagem de advogados
 */
export interface ListarAdvogadosResult {
  advogados: Advogado[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

// ============================================================================
// Credencial Types
// ============================================================================

/**
 * Dados de uma credencial (sem senha para segurança)
 */
export interface Credencial {
  id: number;
  advogado_id: number;
  usuario?: string; // Sometimes needed for PJE login if different from auto-CPF
  tribunal: CodigoTRT;
  grau: GrauTRT;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Dados de uma credencial com informações do advogado
 */
export interface CredencialComAdvogado extends Credencial {
  advogado_nome: string;
  advogado_cpf: string;
  advogado_oab: string;
  advogado_uf_oab: string;
}

/**
 * Dados para criar uma nova credencial
 */
export interface CriarCredencialParams {
  advogado_id: number;
  tribunal: CodigoTRT;
  grau: GrauTRT;
  senha: string;
  active?: boolean;
}

/**
 * Dados para atualizar uma credencial
 */
export interface AtualizarCredencialParams {
  tribunal?: CodigoTRT;
  grau?: GrauTRT;
  senha?: string;
  active?: boolean;
}

export interface ListarCredenciaisParams {
  advogado_id: number;
  active?: boolean;
}


// ============================================================================
// Zod Schemas
// ============================================================================

export const criarAdvogadoSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido'), // Add detailed validation later if utils available
  oab: z.string().min(1, 'OAB obrigatória'),
  uf_oab: z.string().length(2, 'UF deve ter 2 caracteres'),
});

export const atualizarAdvogadoSchema = criarAdvogadoSchema.partial();

export const criarCredencialSchema = z.object({
  advogado_id: z.number(),
  tribunal: z.string(),
  grau: z.enum(['1', '2']),
  senha: z.string().min(1, 'Senha obrigatória'),
  active: z.boolean().optional().default(true),
});

export const atualizarCredencialSchema = criarCredencialSchema.partial();
