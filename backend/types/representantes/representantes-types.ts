/**
 * Tipos TypeScript para Representantes (Advogados)
 * Representantes legais que atuam em nome de partes em processos judiciais
 *
 * NOTA: Representantes são sempre pessoas físicas (advogados) na API do PJE.
 * Os campos disponíveis são limitados comparados às partes.
 *
 * MUDANÇA DE PARADIGMA: Representantes agora são únicos por CPF, e o vínculo com processos é feito via processo_partes.
 * A tabela representantes tem UM registro por pessoa (CPF único), ao invés de um registro por (representante, processo).
 * Campos de contexto de processo (trt, grau, numero_processo, etc.) foram removidos.
 * O id_pessoa_pje foi movido para a tabela cadastros_pje, pois não é globalmente único.
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
  | 'cpf'
  | 'numero_oab'
  | 'uf_oab'
  | 'situacao_oab'
  | 'created_at';

// ============================================================================
// Main Interface
// ============================================================================

/**
 * Representante (Advogado) - estrutura deduplicada por CPF
 * Representantes são sempre pessoas físicas
 *
 * Constraint UNIQUE em CPF garante que existe apenas um registro por pessoa.
 * Campos de contexto de processo foram removidos após deduplicação.
 * id_pessoa_pje foi movido para cadastros_pje.
 */
export interface Representante {
  // Identification
  id: number;

  // Basic info
  cpf: string;
  nome: string;
  sexo: string | null;

  // Lawyer-specific
  tipo: string | null;
  numero_oab: string | null;
  uf_oab: string | null;
  situacao_oab: string | null;

  // Contact
  emails: string[] | null;
  email: string | null;
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_residencial: string | null;
  numero_residencial: string | null;
  ddd_comercial: string | null;
  numero_comercial: string | null;

  // Address & Metadata
  endereco_id: number | null;
  dados_anteriores: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
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
 * Simplificado para apenas dados da pessoa, sem contexto de processo.
 */
export interface CriarRepresentanteParams {
  // Required fields
  cpf: string;
  nome: string;

  // Optional fields
  sexo?: string | null;
  tipo?: string | null;
  numero_oab?: string | null;
  uf_oab?: string | null;
  situacao_oab?: string | null;
  emails?: string[] | null;
  email?: string | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  endereco_id?: number | null;
  dados_anteriores?: Record<string, unknown> | null;
}

/**
 * Parâmetros para atualizar representante existente
 */
export interface AtualizarRepresentanteParams {
  id: number;

  // Updatable fields (all optional)
  cpf?: string;
  nome?: string;
  sexo?: string | null;
  tipo?: string | null;
  numero_oab?: string | null;
  uf_oab?: string | null;
  situacao_oab?: string | null;
  emails?: string[] | null;
  email?: string | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  endereco_id?: number | null;
  dados_anteriores?: Record<string, unknown> | null;
}

/**
 * Parâmetros para listar representantes com filtros e paginação
 */
export interface ListarRepresentantesParams {
  // Pagination
  pagina?: number;
  limite?: number;

  // Filters
  nome?: string;
  cpf?: string;
  numero_oab?: string;
  uf_oab?: string;
  situacao_oab?: string;
  busca?: string;

  // Sorting
  ordenar_por?: OrdenarPorRepresentante;
  ordem?: 'asc' | 'desc';
}

// ============================================================================
// Helper Query Types
// ============================================================================

export interface BuscarRepresentantesPorOABParams {
  numero_oab: string;
}

/**
 * Upsert representante por CPF
 */
export interface UpsertRepresentantePorCPFParams extends CriarRepresentanteParams {
  cpf: string;
}

/**
 * Buscar representante por CPF
 */
export interface BuscarRepresentantePorCPFParams {
  cpf: string;
}

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