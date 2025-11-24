// Tipos e interfaces para o serviço de partes contrárias

import type { GrauAcervo } from '@/backend/types/acervo/types';
import type { Endereco } from './enderecos-types';

/**
 * Tipo de pessoa (PF ou PJ)
 */
export type TipoPessoa = 'pf' | 'pj';

/**
 * Grau do processo (primeiro ou segundo grau)
 */
export type GrauParteContraria = GrauAcervo;

/**
 * Situação do registro no PJE
 */
export type SituacaoPJE = 'A' | 'I' | 'E' | 'H'; // A=Ativo, I=Inativo, E=Excluído, H=Histórico

/**
 * Campos base comuns a PF e PJ
 * NOTA: Partes Contrárias é uma tabela global - conexão com processo via processo_partes
 */
interface ParteContrariaBase {
  id: number;
  // id_pje removido
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
  situacao: SituacaoPJE | null;
  observacoes: string | null;
  dados_anteriores: Record<string, unknown> | null; // JSONB
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Campos específicos de Pessoa Física
 */
export interface ParteContrariaPessoaFisica extends ParteContrariaBase {
  tipo_pessoa: 'pf';
  cpf: string; // Required para PF
  cnpj: null;
  tipo_documento: string | null;
  numero_rg: string | null;
  orgao_emissor_rg: string | null;
  uf_rg: string | null;
  // data_expedicao_rg removido
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
export interface ParteContrariaPessoaJuridica extends ParteContrariaBase {
  tipo_pessoa: 'pj';
  cnpj: string; // Required para PJ
  cpf: null;
  inscricao_estadual: string | null;
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
  // data_expedicao_rg removido
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
 * Parte Contrária completa (Discriminated Union)
 */
export type ParteContraria = ParteContrariaPessoaFisica | ParteContrariaPessoaJuridica;

/**
 * Tipos com endereço populado (para queries com JOIN)
 */
export interface ParteContrariaPessoaFisicaComEndereco extends ParteContrariaPessoaFisica {
  endereco?: Endereco | null;
}

export interface ParteContrariaPessoaJuridicaComEndereco extends ParteContrariaPessoaJuridica {
  endereco?: Endereco | null;
}

export type ParteContrariaComEndereco =
  | ParteContrariaPessoaFisicaComEndereco
  | ParteContrariaPessoaJuridicaComEndereco;

/**
 * Dados para criar parte contrária PF
 */
export interface CriarParteContrariaPFParams {
  // id_pje removido
  id_pessoa_pje?: number | null;
  tipo_pessoa: 'pf';
  nome: string;
  cpf: string;
  nome_social?: string | null;
  emails?: string[] | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  tipo_documento?: string | null;
  numero_rg?: string | null;
  orgao_emissor_rg?: string | null;
  uf_rg?: string | null;
  // data_expedicao_rg removido
  sexo?: string | null;
  nome_genitora?: string | null;
  data_nascimento?: string | null;
  nacionalidade?: string | null;
  naturalidade?: string | null;
  municipio_nascimento?: string | null;
  uf_nascimento?: string | null;
  pais_nacionalidade?: string | null;
  profissao?: string | null;
  estado_civil?: string | null;
  grau_instrucao?: string | null;
  necessidade_especial?: string | null;
  situacao?: SituacaoPJE | null;
  observacoes?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
}

/**
 * Dados para criar parte contrária PJ
 */
export interface CriarParteContrariaPJParams {
  // id_pje removido
  id_pessoa_pje?: number | null;
  tipo_pessoa: 'pj';
  nome: string;
  cnpj: string;
  nome_social?: string | null;
  nome_fantasia?: string | null;
  emails?: string[] | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  inscricao_estadual?: string | null;
  data_abertura?: string | null;
  orgao_publico?: boolean | null;
  ds_tipo_pessoa?: string | null;
  ramo_atividade?: string | null;
  porte_codigo?: string | null;
  porte_descricao?: string | null;
  qualificacao_responsavel?: string | null;
  capital_social?: number | null;
  status_pje?: string | null;
  situacao?: SituacaoPJE | null;
  observacoes?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
}

/**
 * Dados para criar parte contrária (união)
 */
export type CriarParteContrariaParams =
  | CriarParteContrariaPFParams
  | CriarParteContrariaPJParams;

/**
 * Dados para atualizar parte contrária PF
 */
export interface AtualizarParteContrariaPFParams {
  id: number;
  // id_pje removido
  id_pessoa_pje?: number;
  tipo_pessoa?: 'pf';
  nome?: string;
  cpf?: string;
  nome_social?: string | null;
  emails?: string[] | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  tipo_documento?: string | null;
  numero_rg?: string | null;
  orgao_emissor_rg?: string | null;
  uf_rg?: string | null;
  // data_expedicao_rg removido
  sexo?: string | null;
  nome_genitora?: string | null;
  data_nascimento?: string | null;
  nacionalidade?: string | null;
  naturalidade?: string | null;
  municipio_nascimento?: string | null;
  uf_nascimento?: string | null;
  pais_nacionalidade?: string | null;
  profissao?: string | null;
  estado_civil?: string | null;
  grau_instrucao?: string | null;
  necessidade_especial?: string | null;
  situacao?: SituacaoPJE | null;
  observacoes?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
}

/**
 * Dados para atualizar parte contrária PJ
 */
export interface AtualizarParteContrariaPJParams {
  id: number;
  // id_pje removido
  id_pessoa_pje?: number;
  tipo_pessoa?: 'pj';
  nome?: string;
  cnpj?: string;
  nome_social?: string | null;
  nome_fantasia?: string | null;
  emails?: string[] | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  inscricao_estadual?: string | null;
  data_abertura?: string | null;
  orgao_publico?: boolean | null;
  ds_tipo_pessoa?: string | null;
  ramo_atividade?: string | null;
  porte_codigo?: string | null;
  porte_descricao?: string | null;
  qualificacao_responsavel?: string | null;
  capital_social?: number | null;
  status_pje?: string | null;
  situacao?: SituacaoPJE | null;
  observacoes?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
}

/**
 * Dados para atualizar parte contrária (união)
 */
export type AtualizarParteContrariaParams =
  | AtualizarParteContrariaPFParams
  | AtualizarParteContrariaPJParams;

/**
 * Campos disponíveis para ordenação
 */
export type OrdenarPorParteContraria =
  | 'nome'
  | 'cpf'
  | 'cnpj'
  | 'tipo_pessoa'
  | 'created_at'
  | 'updated_at';

/**
 * Direção da ordenação
 */
export type OrdemParteContraria = 'asc' | 'desc';

/**
 * Parâmetros para listar partes contrárias
 */
export interface ListarPartesContrariasParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Filtros básicos
  tipo_pessoa?: TipoPessoa;
  trt?: string;
  grau?: GrauParteContraria;

  // Busca textual
  busca?: string; // Busca em nome, cpf, cnpj, nome_social, emails

  // Filtros específicos
  nome?: string;
  cpf?: string;
  cnpj?: string;
  id_pessoa_pje?: number;
  numero_processo?: string;

  // Ordenação
  ordenar_por?: OrdenarPorParteContraria;
  ordem?: OrdemParteContraria;
}

/**
 * Resultado da listagem
 */
export interface ListarPartesContrariasResult {
  partesContrarias: ParteContraria[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Método upsert por id_pessoa_pje para parte contrária PF
 */
export interface UpsertParteContrariaPorIdPessoaPFParams extends CriarParteContrariaPFParams {
  id_pessoa_pje: number; // Required para upsert
}

/**
 * Método upsert por id_pessoa_pje para parte contrária PJ
 */
export interface UpsertParteContrariaPorIdPessoaPJParams extends CriarParteContrariaPJParams {
  id_pessoa_pje: number; // Required para upsert
}

/**
 * Método upsert por id_pessoa_pje (união)
 */
export type UpsertParteContrariaPorIdPessoaParams = UpsertParteContrariaPorIdPessoaPFParams | UpsertParteContrariaPorIdPessoaPJParams;
