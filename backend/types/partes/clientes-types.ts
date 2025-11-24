// Tipos e interfaces para o serviço de clientes

import type { GrauAcervo } from '@/backend/types/acervo/types';

/**
 * Tipo de pessoa (PF ou PJ)
 */
export type TipoPessoa = 'pf' | 'pj';

/**
 * Grau do processo (primeiro ou segundo grau)
 */
export type GrauCliente = GrauAcervo;

/**
 * Situação do registro no PJE
 */
export type SituacaoPJE = 'A' | 'I' | 'E' | 'H'; // A=Ativo, I=Inativo, E=Excluído, H=Histórico

/**
 * Campos base comuns a PF e PJ
 * NOTA: Clientes é uma tabela global - conexão com processo via processo_partes
 */
interface ClienteBase {
  id: number;
  id_pje: number | null;
  id_pessoa_pje: number | null; // Unique constraint
  tipo_pessoa: TipoPessoa;
  nome: string;
  nome_social: string | null;
  emails: string[] | null; // JSONB array
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_residencial: string | null;
  numero_residencial: string | null;
  ddd_comercial: string | null;
  numero_comercial: string | null;
  fax: string | null;
  situacao: SituacaoPJE | null;
  observacoes: string | null;
  dados_anteriores: Record<string, unknown> | null; // JSONB
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Campos específicos de Pessoa Física
 */
export interface ClientePessoaFisica extends ClienteBase {
  tipo_pessoa: 'pf';
  cpf: string; // Required para PF
  cnpj: null;
  tipo_documento: string | null;
  numero_rg: string | null;
  orgao_emissor_rg: string | null;
  uf_rg: string | null;
  data_expedicao_rg: string | null; // ISO date
  sexo: string | null;
  nome_genitora: string | null;
  data_nascimento: string | null; // ISO date
  nacionalidade: string | null;
  naturalidade: string | null;
  municipio_nascimento: string | null;
  uf_nascimento: string | null;
  pais_nacionalidade: string | null;
  profissao: string | null;
  estado_civil: string | null;
  grau_instrucao: string | null;
  necessidade_especial: string | null;
  // Campos que são null em PF (específicos de PJ)
  inscricao_estadual: null;
  inscricao_municipal: null;
  data_abertura: null;
  orgao_publico: null;
  ds_tipo_pessoa: null;
  ramo_atividade: null;
  porte_codigo: null;
  porte_descricao: null;
  qualificacao_responsavel: null;
  nome_fantasia: null;
  status_pje: null;
}

/**
 * Campos específicos de Pessoa Jurídica
 */
export interface ClientePessoaJuridica extends ClienteBase {
  tipo_pessoa: 'pj';
  cnpj: string; // Required para PJ
  cpf: null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  data_abertura: string | null; // ISO date
  orgao_publico: boolean | null;
  ds_tipo_pessoa: string | null;
  ramo_atividade: string | null;
  porte_codigo: string | null;
  porte_descricao: string | null;
  qualificacao_responsavel: string | null;
  capital_social: number | null;
  nome_fantasia: string | null;
  status_pje: string | null;
  // Campos que são null em PJ (específicos de PF)
  tipo_documento: null;
  numero_rg: null;
  orgao_emissor_rg: null;
  uf_rg: null;
  data_expedicao_rg: null;
  sexo: null;
  nome_genitora: null;
  data_nascimento: null;
  nacionalidade: null;
  naturalidade: null;
  municipio_nascimento: null;
  uf_nascimento: null;
  pais_nacionalidade: null;
  profissao: null;
  estado_civil: null;
  grau_instrucao: null;
  necessidade_especial: null;
}

/**
 * Cliente completo (Discriminated Union)
 */
export type Cliente = ClientePessoaFisica | ClientePessoaJuridica;

/**
 * Dados para criar cliente PF
 */
export interface CriarClientePFParams {
  id_pje?: number;
  id_pessoa_pje?: number;
  tipo_pessoa: 'pf';
  nome: string;
  cpf: string;
  nome_social?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
  ddd_comercial?: string;
  numero_comercial?: string;
  fax?: string;
  tipo_documento?: string;
  numero_rg?: string;
  orgao_emissor_rg?: string;
  uf_rg?: string;
  data_expedicao_rg?: string;
  sexo?: string;
  nome_genitora?: string;
  data_nascimento?: string;
  nacionalidade?: string;
  naturalidade?: string;
  municipio_nascimento?: string;
  uf_nascimento?: string;
  pais_nacionalidade?: string;
  profissao?: string;
  estado_civil?: string;
  grau_instrucao?: string;
  necessidade_especial?: string;
  situacao?: SituacaoPJE;
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
}

/**
 * Dados para criar cliente PJ
 */
export interface CriarClientePJParams {
  id_pje?: number;
  id_pessoa_pje?: number;
  tipo_pessoa: 'pj';
  nome: string;
  cnpj: string;
  nome_social?: string;
  nome_fantasia?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
  ddd_comercial?: string;
  numero_comercial?: string;
  fax?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  data_abertura?: string;
  orgao_publico?: boolean;
  ds_tipo_pessoa?: string;
  ramo_atividade?: string;
  porte_codigo?: string;
  porte_descricao?: string;
  qualificacao_responsavel?: string;
  capital_social?: number;
  status_pje?: string;
  situacao?: SituacaoPJE;
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
}

/**
 * Dados para criar cliente (união)
 */
export type CriarClienteParams = CriarClientePFParams | CriarClientePJParams;

/**
 * Dados para atualizar cliente PF
 */
export interface AtualizarClientePFParams {
  id: number;
  id_pje?: number;
  id_pessoa_pje?: number;
  tipo_pessoa?: 'pf';
  nome?: string;
  cpf?: string;
  nome_social?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
  ddd_comercial?: string;
  numero_comercial?: string;
  fax?: string;
  tipo_documento?: string;
  numero_rg?: string;
  orgao_emissor_rg?: string;
  uf_rg?: string;
  data_expedicao_rg?: string;
  sexo?: string;
  nome_genitora?: string;
  data_nascimento?: string;
  nacionalidade?: string;
  naturalidade?: string;
  municipio_nascimento?: string;
  uf_nascimento?: string;
  pais_nacionalidade?: string;
  profissao?: string;
  estado_civil?: string;
  grau_instrucao?: string;
  necessidade_especial?: string;
  situacao?: SituacaoPJE;
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
}

/**
 * Dados para atualizar cliente PJ
 */
export interface AtualizarClientePJParams {
  id: number;
  id_pje?: number;
  id_pessoa_pje?: number;
  tipo_pessoa?: 'pj';
  nome?: string;
  cnpj?: string;
  nome_social?: string;
  nome_fantasia?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
  ddd_comercial?: string;
  numero_comercial?: string;
  fax?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  data_abertura?: string;
  orgao_publico?: boolean;
  ds_tipo_pessoa?: string;
  ramo_atividade?: string;
  porte_codigo?: string;
  porte_descricao?: string;
  qualificacao_responsavel?: string;
  capital_social?: number;
  status_pje?: string;
  situacao?: SituacaoPJE;
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
}

/**
 * Dados para atualizar cliente (união)
 */
export type AtualizarClienteParams = AtualizarClientePFParams | AtualizarClientePJParams;

/**
 * Campos disponíveis para ordenação
 */
export type OrdenarPorCliente =
  | 'nome'
  | 'cpf'
  | 'cnpj'
  | 'tipo_pessoa'
  | 'created_at'
  | 'updated_at';

/**
 * Direção da ordenação
 */
export type OrdemCliente = 'asc' | 'desc';

/**
 * Parâmetros para listar clientes
 */
export interface ListarClientesParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Filtros básicos
  tipo_pessoa?: TipoPessoa;
  trt?: string;
  grau?: GrauCliente;

  // Busca textual
  busca?: string; // Busca em nome, cpf, cnpj, nome_social, emails

  // Filtros específicos
  nome?: string;
  cpf?: string;
  cnpj?: string;
  id_pessoa_pje?: number;
  numero_processo?: string;

  // Ordenação
  ordenar_por?: OrdenarPorCliente;
  ordem?: OrdemCliente;
}

/**
 * Resultado da listagem
 */
export interface ListarClientesResult {
  clientes: Cliente[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Método upsert por id_pessoa_pje para cliente PF
 */
export interface UpsertClientePorIdPessoaPFParams {
  id_pessoa_pje: number; // Required para upsert
  id_pje?: number;
  tipo_pessoa: 'pf';
  nome: string;
  cpf: string;
  nome_social?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
  ddd_comercial?: string;
  numero_comercial?: string;
  fax?: string;
  tipo_documento?: string;
  numero_rg?: string;
  orgao_emissor_rg?: string;
  uf_rg?: string;
  data_expedicao_rg?: string;
  sexo?: string;
  nome_genitora?: string;
  data_nascimento?: string;
  nacionalidade?: string;
  naturalidade?: string;
  municipio_nascimento?: string;
  uf_nascimento?: string;
  pais_nacionalidade?: string;
  profissao?: string;
  estado_civil?: string;
  grau_instrucao?: string;
  necessidade_especial?: string;
  situacao?: SituacaoPJE;
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
}

/**
 * Método upsert por id_pessoa_pje para cliente PJ
 */
export interface UpsertClientePorIdPessoaPJParams {
  id_pessoa_pje: number; // Required para upsert
  id_pje?: number;
  tipo_pessoa: 'pj';
  nome: string;
  cnpj: string;
  nome_social?: string;
  nome_fantasia?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
  ddd_comercial?: string;
  numero_comercial?: string;
  fax?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  data_abertura?: string;
  orgao_publico?: boolean;
  ds_tipo_pessoa?: string;
  ramo_atividade?: string;
  porte_codigo?: string;
  porte_descricao?: string;
  qualificacao_responsavel?: string;
  capital_social?: number;
  status_pje?: string;
  situacao?: SituacaoPJE;
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
}

/**
 * Método upsert por id_pessoa_pje (união)
 */
export type UpsertClientePorIdPessoaParams = UpsertClientePorIdPessoaPFParams | UpsertClientePorIdPessoaPJParams;
