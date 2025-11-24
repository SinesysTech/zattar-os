/**
 * Tipos TypeScript para Representantes (Advogados)
 * Representantes legais que atuam em nome de partes em processos judiciais
 * Utiliza discriminated unions para type safety entre PF e PJ
 */

// ============================================================================
// Base Types
// ============================================================================

export type TipoPessoa = 'pf' | 'pj';
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
// Base Interface (Common Fields)
// ============================================================================

/**
 * NOTA: Representantes é uma tabela global - conexão com processo via processo_partes
 */
interface RepresentanteBase {
  // Identification
  id: number;
  id_pje: number | null;
  id_pessoa_pje: number;

  // Context (link to parte)
  parte_tipo: ParteTipo;
  parte_id: number;
  polo: Polo | null;
  trt: string;
  grau: string;
  numero_processo: string;

  // Common
  tipo_pessoa: TipoPessoa;
  nome: string;
  situacao: string | null;
  status: string | null;
  principal: boolean | null;
  endereco_desconhecido: boolean | null;

  // Lawyer-specific
  tipo: TipoRepresentante | null;
  id_tipo_parte: number | null;
  numero_oab: string | null;
  situacao_oab: SituacaoOAB | null;

  // Contact
  emails: string[];
  /** Telefone celular do representante */
  ddd_celular: string | null;
  numero_celular: string | null;
  /** Telefone residencial do representante */
  ddd_residencial: string | null;
  numero_residencial: string | null;
  /** Telefone comercial do representante */
  ddd_comercial: string | null;
  numero_comercial: string | null;
  email: string | null;

  // Metadata
  /** Estado anterior do registro para auditoria (não confundir com dados do PJE) */
  dados_anteriores: Record<string, unknown> | null;
  ordem: number | null;
  data_habilitacao: Date | null;
  endereco_id: number | null; // FK para tabela enderecos
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Discriminated Union Types (PF vs PJ)
// ============================================================================

export interface RepresentantePessoaFisica extends RepresentanteBase {
  tipo_pessoa: 'pf';

  // PF fields (populated)
  cpf: string;
  sexo: string | null;
  data_nascimento: Date | null;
  nome_mae: string | null;
  nome_pai: string | null;
  nacionalidade: string | null;
  estado_civil: string | null;
  uf_nascimento: string | null;
  municipio_nascimento: string | null;
  pais_nascimento: string | null;

  // PJ fields (always null for PF)
  cnpj: null;
  razao_social: null;
  nome_fantasia: null;
  inscricao_estadual: null;
  tipo_empresa: null;
}

export interface RepresentantePessoaJuridica extends RepresentanteBase {
  tipo_pessoa: 'pj';

  // PJ fields (populated)
  cnpj: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  inscricao_estadual: string | null;
  tipo_empresa: string | null;

  // PF fields (always null for PJ)
  cpf: null;
  sexo: null;
  data_nascimento: null;
  nome_mae: null;
  nome_pai: null;
  nacionalidade: null;
  estado_civil: null;
  uf_nascimento: null;
  municipio_nascimento: null;
  pais_nascimento: null;
}

/**
 * Representante union type - automatically discriminates between PF and PJ
 */
export type Representante = RepresentantePessoaFisica | RepresentantePessoaJuridica;

/**
 * Tipos com endereço populado (para queries com JOIN)
 */
import type { Endereco } from '@/backend/types/partes/enderecos-types';

export interface RepresentantePessoaFisicaComEndereco extends RepresentantePessoaFisica {
  endereco?: Endereco | null;
}

export interface RepresentantePessoaJuridicaComEndereco extends RepresentantePessoaJuridica {
  endereco?: Endereco | null;
}

export type RepresentanteComEndereco =
  | RepresentantePessoaFisicaComEndereco
  | RepresentantePessoaJuridicaComEndereco;

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
  grau: string;
  numero_processo: string;
  tipo_pessoa: TipoPessoa;
  nome: string;

  // Conditional required (based on tipo_pessoa)
  cpf?: string; // required if tipo_pessoa='pf'
  cnpj?: string; // required if tipo_pessoa='pj'

  // Optional fields
  id_pje?: number | null;
  polo?: Polo | null;
  situacao?: string | null;
  status?: string | null;
  principal?: boolean | null;
  endereco_desconhecido?: boolean | null;
  tipo?: TipoRepresentante | null;
  id_tipo_parte?: number | null;
  numero_oab?: string | null;
  situacao_oab?: SituacaoOAB | null;
  emails?: string[];
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  email?: string | null;

  // PF optional fields
  sexo?: string | null;
  data_nascimento?: Date | null;
  nome_mae?: string | null;
  nome_pai?: string | null;
  nacionalidade?: string | null;
  estado_civil?: string | null;
  uf_nascimento?: string | null;
  municipio_nascimento?: string | null;
  pais_nascimento?: string | null;

  // PJ optional fields
  razao_social?: string | null;
  nome_fantasia?: string | null;
  inscricao_estadual?: string | null;
  tipo_empresa?: string | null;

  // Metadata optional
  dados_anteriores?: Record<string, unknown> | null;
  ordem?: number | null;
  data_habilitacao?: Date | null;
  endereco_id?: number | null;
}

/**
 * Parâmetros para atualizar representante existente
 * Todos os campos são opcionais exceto id
 * Campos imutáveis (tipo_pessoa, parte_tipo, parte_id) não devem ser incluídos
 */
export interface AtualizarRepresentanteParams {
  id: number; // Required - representante to update

  // Updatable fields (all optional)
  nome?: string;
  situacao?: string | null;
  status?: string | null;
  principal?: boolean | null;
  endereco_desconhecido?: boolean | null;
  polo?: Polo | null;
  tipo?: TipoRepresentante | null;
  numero_oab?: string | null;
  situacao_oab?: SituacaoOAB | null;
  emails?: string[];
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  email?: string | null;

  // PF fields (only if tipo_pessoa='pf')
  sexo?: string | null;
  data_nascimento?: Date | null;
  nome_mae?: string | null;
  nome_pai?: string | null;
  nacionalidade?: string | null;
  estado_civil?: string | null;
  uf_nascimento?: string | null;
  municipio_nascimento?: string | null;
  pais_nascimento?: string | null;

  // PJ fields (only if tipo_pessoa='pj')
  razao_social?: string | null;
  nome_fantasia?: string | null;
  inscricao_estadual?: string | null;
  tipo_empresa?: string | null;

  // Metadata
  dados_anteriores?: Record<string, unknown> | null;
  ordem?: number | null;
  data_habilitacao?: Date | null;
  endereco_id?: number | null;
}

/**
 * Parâmetros para listar representantes com filtros e paginação
 */
export interface ListarRepresentantesParams {
  // Pagination
  pagina?: number; // default 1
  limite?: number; // default 50

  // Filters
  parte_tipo?: ParteTipo;
  parte_id?: number;
  trt?: string;
  grau?: string;
  numero_processo?: string;
  nome?: string;
  id_pessoa_pje?: number;
  numero_oab?: string;
  situacao_oab?: SituacaoOAB;
  tipo_pessoa?: TipoPessoa;
  busca?: string; // search in nome, cpf, cnpj, email

  // Sorting
  ordenar_por?: OrdenarPorRepresentante;
  ordem?: 'asc' | 'desc';
}

// ============================================================================
// Helper Query Types
// ============================================================================

/**
 * Buscar representantes por parte específica
 */
export interface BuscarRepresentantesPorParteParams {
  parte_tipo: ParteTipo;
  parte_id: number;
  trt?: string;
  grau?: string;
  numero_processo?: string;
}

/**
 * Buscar representantes por número OAB
 */
export interface BuscarRepresentantesPorOABParams {
  numero_oab: string;
  trt?: string;
  grau?: string;
  numero_processo?: string;
}

/**
 * Buscar representantes por processo
 */
export interface BuscarRepresentantesPorProcessoParams {
  trt: string;
  grau: string;
  numero_processo: string;
}

/**
 * Upsert representante por id_pessoa_pje + context
 * Create if not exists, update if exists
 */
export interface UpsertRepresentantePorIdPessoaParams extends CriarRepresentanteParams {
  // Inherits all fields from CriarRepresentanteParams
  // Upsert logic based on composite key: (id_pessoa_pje, parte_id, parte_tipo)
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Resultado de listagem com paginação
 */
export interface ListarRepresentantesResult {
  representantes: Representante[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Resultado de operação CRUD
 */
export interface OperacaoRepresentanteResult {
  sucesso: boolean;
  representante?: Representante;
  erro?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard para verificar se representante é Pessoa Física
 */
export function isRepresentantePessoaFisica(
  representante: Representante
): representante is RepresentantePessoaFisica {
  return representante.tipo_pessoa === 'pf';
}

/**
 * Type guard para verificar se representante é Pessoa Jurídica
 */
export function isRepresentantePessoaJuridica(
  representante: Representante
): representante is RepresentantePessoaJuridica {
  return representante.tipo_pessoa === 'pj';
}