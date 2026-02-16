/**
 * Domain Logic and Constants for Advogados Feature
 */

import { z } from 'zod';

// Placeholder for domain constraints or enums
export const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const TRIBUNAIS_ATIVOS = [
  'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8', 'TRT9', 'TRT10',
  'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15', 'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20',
  'TRT21', 'TRT22', 'TRT23', 'TRT24'
];

// ============================================================================
// Shared Types
// ============================================================================

export type CodigoTRT = string; // e.g. TRT1, TRT2...
export type GrauCredencial = '1' | '2';

// ============================================================================
// Advogado Types
// ============================================================================

/**
 * Entrada de OAB (número + UF)
 * Um advogado pode ter múltiplas inscrições na OAB (uma por estado)
 */
export interface OabEntry {
  numero: string;
  uf: string;
}

/**
 * Dados de um advogado
 */
export interface Advogado {
  id: number;
  nome_completo: string;
  cpf: string;
  oabs: OabEntry[];
  created_at: string;
  updated_at: string;
}

/**
 * Dados para criar um novo advogado
 */
export interface CriarAdvogadoParams {
  nome_completo: string;
  cpf: string;
  oabs: OabEntry[];
}

/**
 * Dados para atualizar um advogado
 */
export interface AtualizarAdvogadoParams {
  nome_completo?: string;
  cpf?: string;
  oabs?: OabEntry[];
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
  grau: GrauCredencial;
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
  advogado_oabs: OabEntry[];
}

/**
 * Dados para criar uma nova credencial
 */
export interface CriarCredencialParams {
  advogado_id: number;
  tribunal: CodigoTRT;
  grau: GrauCredencial;
  usuario?: string; // Login do PJE (se diferente do CPF do advogado)
  senha: string;
  active?: boolean;
}

/**
 * Dados para atualizar uma credencial
 */
export interface AtualizarCredencialParams {
  tribunal?: CodigoTRT;
  grau?: GrauCredencial;
  usuario?: string | null; // Login do PJE (null para usar CPF do advogado)
  senha?: string;
  active?: boolean;
}

export interface ListarCredenciaisParams {
  /**
   * Quando informado, lista apenas credenciais do advogado.
   * Quando omitido, lista credenciais de todos os advogados (respeitando permissões).
   */
  advogado_id?: number;
  active?: boolean;
  tribunal?: CodigoTRT;
  grau?: GrauCredencial;
}


// ============================================================================
// Zod Schemas
// ============================================================================

export const oabEntrySchema = z.object({
  numero: z.string().min(1, 'Número OAB obrigatório'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres').refine(
    (uf) => UFS_BRASIL.includes(uf.toUpperCase()),
    'UF inválida'
  ),
});

export const criarAdvogadoSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido'),
  oabs: z.array(oabEntrySchema).min(1, 'Pelo menos uma OAB obrigatória'),
});

export const atualizarAdvogadoSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
  cpf: z.string().min(11, 'CPF inválido').optional(),
  oabs: z.array(oabEntrySchema).min(1, 'Pelo menos uma OAB obrigatória').optional(),
});

export const criarCredencialSchema = z.object({
  advogado_id: z.number(),
  tribunal: z.string(),
  grau: z.enum(['1', '2']),
  usuario: z.string().optional(), // Login do PJE (se diferente do CPF)
  senha: z.string().min(1, 'Senha obrigatória'),
  active: z.boolean().optional().default(true),
});

export const atualizarCredencialSchema = criarCredencialSchema.partial();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Obtem a OAB principal (primeira do array)
 */
export function getPrimaryOab(advogado: Advogado): OabEntry | null {
  return advogado.oabs[0] || null;
}

/**
 * Formata OABs para exibição (ex: "12345/SP, 67890/MG")
 */
export function formatOabs(oabs: OabEntry[]): string {
  return oabs.map((oab) => `${oab.numero}/${oab.uf}`).join(', ');
}

/**
 * Formata uma única OAB para exibição (ex: "12345/SP")
 */
export function formatOab(oab: OabEntry): string {
  return `${oab.numero}/${oab.uf}`;
}

/**
 * Verifica se advogado tem OAB em determinado estado
 */
export function hasOabInState(advogado: Advogado, uf: string): boolean {
  return advogado.oabs.some((oab) => oab.uf.toUpperCase() === uf.toUpperCase());
}

/**
 * Encontra OAB por estado
 */
export function findOabByState(advogado: Advogado, uf: string): OabEntry | undefined {
  return advogado.oabs.find((oab) => oab.uf.toUpperCase() === uf.toUpperCase());
}

// ============================================================================
// Credenciais em Lote - Types
// ============================================================================

/**
 * Modo de tratamento de duplicatas ao criar credenciais em lote
 */
export type ModoDuplicata = 'pular' | 'sobrescrever';

/**
 * Parâmetros para criar credenciais em lote
 */
export interface CriarCredenciaisEmLoteParams {
  advogado_id: number;
  tribunais: string[];
  graus: GrauCredencial[];
  senha: string;
  modo_duplicata?: ModoDuplicata;
}

/**
 * Resultado de uma credencial individual no lote
 */
export interface ResultadoCredencialLote {
  tribunal: string;
  grau: GrauCredencial;
  status: 'criada' | 'atualizada' | 'pulada' | 'erro';
  mensagem?: string;
  credencial_id?: number;
}

/**
 * Resumo da criação em lote
 */
export interface ResumoCriacaoEmLote {
  total: number;
  criadas: number;
  atualizadas: number;
  puladas: number;
  erros: number;
  detalhes: ResultadoCredencialLote[];
}

// ============================================================================
// Credenciais em Lote - Zod Schema
// ============================================================================

export const criarCredenciaisEmLoteSchema = z.object({
  advogado_id: z.number().positive('Advogado obrigatório'),
  tribunais: z.array(z.string()).min(1, 'Selecione pelo menos um tribunal'),
  graus: z.array(z.enum(['1', '2'])).min(1, 'Selecione pelo menos um grau'),
  senha: z.string().min(1, 'Senha obrigatória'),
  modo_duplicata: z.enum(['pular', 'sobrescrever']).optional().default('pular'),
});

// ============================================================================
// Labels para UI
// ============================================================================

/**
 * Labels amigáveis para tribunais
 */
export const TRIBUNAIS_LABELS: Record<string, string> = {
  TRT1: 'TRT1 - Rio de Janeiro',
  TRT2: 'TRT2 - São Paulo',
  TRT3: 'TRT3 - Minas Gerais',
  TRT4: 'TRT4 - Rio Grande do Sul',
  TRT5: 'TRT5 - Bahia',
  TRT6: 'TRT6 - Pernambuco',
  TRT7: 'TRT7 - Ceará',
  TRT8: 'TRT8 - Pará/Amapá',
  TRT9: 'TRT9 - Paraná',
  TRT10: 'TRT10 - DF/Tocantins',
  TRT11: 'TRT11 - Amazonas/Roraima',
  TRT12: 'TRT12 - Santa Catarina',
  TRT13: 'TRT13 - Paraíba',
  TRT14: 'TRT14 - Rondônia/Acre',
  TRT15: 'TRT15 - Campinas',
  TRT16: 'TRT16 - Maranhão',
  TRT17: 'TRT17 - Espírito Santo',
  TRT18: 'TRT18 - Goiás',
  TRT19: 'TRT19 - Alagoas',
  TRT20: 'TRT20 - Sergipe',
  TRT21: 'TRT21 - Rio Grande do Norte',
  TRT22: 'TRT22 - Piauí',
  TRT23: 'TRT23 - Mato Grosso',
  TRT24: 'TRT24 - Mato Grosso do Sul',
};

/**
 * Labels amigáveis para graus
 */
export const GRAUS_LABELS: Record<GrauCredencial, string> = {
  '1': '1° Grau',
  '2': '2° Grau',
};
