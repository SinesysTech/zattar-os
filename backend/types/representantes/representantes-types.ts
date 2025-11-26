/**
 * Tipos TypeScript para Representantes (Advogados)
 * Representantes legais que atuam em nome de partes em processos judiciais
 *
 * NOTA: Representantes são sempre pessoas físicas (advogados) na API do PJE.
 * Os campos disponíveis são limitados comparados às partes.
 */

// ============================================================================
// Base Types
// ============================================================================

export type ParteTipo = 'cliente' | 'parte_contraria' | 'terceiro';
export type Grau = '1' | '2';
export type Polo = 'ativo' | 'passivo' | 'outros';

// ============================================================================
// Enum Types
// ============================================================================

export type TipoRepresentante =
  | 'ADVOGADO'
  | 'PROCURADOR'
  | 'DEFENSOR_PUBLICO'
  | 'ADVOGADO_DATIVO'
  | 'OUTRO';

export type SituacaoOAB =
  | 'REGULAR'
  | 'SUSPENSO'
  | 'CANCELADO'
  | 'LICENCIADO'
  | 'FALECIDO';

export type OrdenarPorRepresentante =
  | 'nome'
  | 'numero_oab'
  | 'situacao_oab'
  | 'created_at'
  | 'data_habilitacao';

// ============================================================================
// Main Interface
// ============================================================================

/**
 * Representante (Advogado) - campos disponíveis na API do PJE
 * Representantes são sempre pessoas físicas
 */
export interface Representante {
  // Identification
  id: number;
  id_pje: number | null;
  id_pessoa_pje: number;

  // Context (link to parte and processo)
  parte_tipo: ParteTipo;
  parte_id: number;
  polo: string | null;
  trt: string;
  grau: Grau;
  numero_processo: string;

  // Basic info
  nome: string;
  cpf: string | null;
  sexo: string | null;
  situacao: string | null;
  status: string | null;
  principal: boolean | null;
  endereco_desconhecido: boolean | null;

  // Lawyer-specific
  tipo: string | null;
  id_tipo_parte: number | null;
  numero_oab: string | null;
  situacao_oab: string | null;

  // Contact
  emails: string[];
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_residencial: string | null;
  numero_residencial: string | null;
  ddd_comercial: string | null;
  numero_comercial: string | null;
  email: string | null;

  // Metadata
  dados_anteriores: Record<string, unknown> | null;
  ordem: number | null;
  data_habilitacao: Date | null;
  endereco_id: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Tipos com endereço populado (para queries com JOIN)
 */
import type { Endereco } from '@/backend/types/partes/enderecos-types';

export interface RepresentanteComEndereco extends Representante {
  endereco?: Endereco | null;
}

// ============================================================================
// CRUD Parameter Types
// ============================================================================

/**
 * Parâmetros para criar novo representante
 */
export interface CriarRepresentanteParams {
  // Required fields
  id_pessoa_pje: number;
  parte_tipo: ParteTipo;
  parte_id: number;
  trt: string;
  grau: Grau;
  numero_processo: string;
  nome: string;

  // Optional fields
  id_pje?: number | null;
  cpf?: string | null;
  polo?: string | null;
  sexo?: string | null;
  situacao?: string | null;
  status?: string | null;
  principal?: boolean | null;
  endereco_desconhecido?: boolean | null;
  tipo?: string | null;
  id_tipo_parte?: number | null;
  numero_oab?: string | null;
  situacao_oab?: string | null;
  emails?: string[];
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  email?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
  ordem?: number | null;
  data_habilitacao?: Date | string | null;
  endereco_id?: number | null;
}

/**
 * Parâmetros para atualizar representante existente
 */
export interface AtualizarRepresentanteParams {
  id: number;

  // Updatable fields (all optional)
  nome?: string;
  cpf?: string | null;
  sexo?: string | null;
  situacao?: string | null;
  status?: string | null;
  principal?: boolean | null;
  endereco_desconhecido?: boolean | null;
  polo?: string | null;
  tipo?: string | null;
  numero_oab?: string | null;
  situacao_oab?: string | null;
  emails?: string[];
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  email?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
  ordem?: number | null;
  data_habilitacao?: Date | string | null;
  endereco_id?: number | null;
}

/**
 * Parâmetros para listar representantes com filtros e paginação
 */
export interface ListarRepresentantesParams {
  // Pagination
  pagina?: number;
  limite?: number;

  // Filters
  parte_tipo?: ParteTipo;
  parte_id?: number;
  trt?: string;
  grau?: Grau;
  numero_processo?: string;
  nome?: string;
  id_pessoa_pje?: number;
  numero_oab?: string;
  situacao_oab?: string;
  busca?: string;

  // Sorting
  ordenar_por?: OrdenarPorRepresentante;
  ordem?: 'asc' | 'desc';
}

// ============================================================================
// Helper Query Types
// ============================================================================

export interface BuscarRepresentantesPorParteParams {
  parte_tipo: ParteTipo;
  parte_id: number;
  trt?: string;
  grau?: Grau;
  numero_processo?: string;
}

export interface BuscarRepresentantesPorOABParams {
  numero_oab: string;
  trt?: string;
  grau?: Grau;
  numero_processo?: string;
}

export interface BuscarRepresentantesPorProcessoParams {
  trt: string;
  grau: Grau;
  numero_processo: string;
}

/**
 * Upsert representante por id_pessoa_pje + context
 */
export interface UpsertRepresentantePorIdPessoaParams extends CriarRepresentanteParams {}

// ============================================================================
// Result Types
// ============================================================================

export interface ListarRepresentantesResult {
  representantes: Representante[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface OperacaoRepresentanteResult {
  sucesso: boolean;
  representante?: Representante;
  erro?: string;
}
