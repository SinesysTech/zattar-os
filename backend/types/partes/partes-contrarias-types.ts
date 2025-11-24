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
  id_pessoa_pje: number | null; // Unique constraint
  tipo_pessoa: TipoPessoa;
  nome: string;
  nome_social_fantasia: string | null; // Serve para PF (nome social) e PJ (nome fantasia)
  emails: string[] | null; // JSONB array
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_residencial: string | null;
  numero_residencial: string | null;
  ddd_comercial: string | null;
  numero_comercial: string | null;
  tipo_documento: string | null; // CPF ou CNPJ
  status_pje: string | null; // Status no PJE (A, I, E, H)
  situacao_pje: string | null; // Situação no PJE (Ativo, Inativo, etc)
  login_pje: string | null;
  autoridade: boolean | null;
  observacoes: string | null;
  dados_anteriores: Record<string, unknown> | null; // JSONB
  endereco_id: number | null; // FK para tabela enderecos
  ativo: boolean;
  created_by: number | null;
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
  rg: string | null;
  data_nascimento: string | null; // ISO date
  genero: string | null; // Enum: masculino, feminino, outro, prefiro_nao_informar
  estado_civil: string | null; // Enum: solteiro, casado, divorciado, viuvo, uniao_estavel, outro
  nacionalidade: string | null;
  sexo: string | null; // MASCULINO, FEMININO (texto do PJE)
  nome_genitora: string | null;
  // Naturalidade (estrutura completa do PJE)
  naturalidade_id_pje: number | null;
  naturalidade_municipio: string | null;
  naturalidade_estado_id_pje: number | null;
  naturalidade_estado_sigla: string | null;
  // UF Nascimento (estrutura completa do PJE)
  uf_nascimento_id_pje: number | null;
  uf_nascimento_sigla: string | null;
  uf_nascimento_descricao: string | null;
  // País Nascimento (estrutura completa do PJE)
  pais_nascimento_id_pje: number | null;
  pais_nascimento_codigo: string | null;
  pais_nascimento_descricao: string | null;
  // Escolaridade
  escolaridade_codigo: number | null;
  // Situação CPF Receita
  situacao_cpf_receita_id: number | null;
  situacao_cpf_receita_descricao: string | null;
  pode_usar_celular_mensagem: boolean | null;
  // Campos que são null em PF (específicos de PJ)
  inscricao_estadual: null;
  data_abertura: null;
  data_fim_atividade: null;
  orgao_publico: null;
  tipo_pessoa_codigo_pje: null;
  tipo_pessoa_label_pje: null;
  tipo_pessoa_validacao_receita: null;
  ds_tipo_pessoa: null;
  situacao_cnpj_receita_id: null;
  situacao_cnpj_receita_descricao: null;
  ramo_atividade: null;
  cpf_responsavel: null;
  oficial: null;
  ds_prazo_expediente_automatico: null;
  porte_codigo: null;
  porte_descricao: null;
  ultima_atualizacao_pje: null;
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
  data_fim_atividade: string | null;
  orgao_publico: boolean | null;
  tipo_pessoa_codigo_pje: string | null;
  tipo_pessoa_label_pje: string | null;
  tipo_pessoa_validacao_receita: string | null;
  ds_tipo_pessoa: string | null;
  situacao_cnpj_receita_id: number | null;
  situacao_cnpj_receita_descricao: string | null;
  ramo_atividade: string | null;
  cpf_responsavel: string | null;
  oficial: boolean | null;
  ds_prazo_expediente_automatico: string | null;
  porte_codigo: number | null; // INTEGER no banco
  porte_descricao: string | null;
  ultima_atualizacao_pje: string | null;
  // Campos que são null em PJ (específicos de PF)
  rg: null;
  data_nascimento: null;
  genero: null;
  estado_civil: null;
  nacionalidade: null;
  sexo: null;
  nome_genitora: null;
  naturalidade_id_pje: null;
  naturalidade_municipio: null;
  naturalidade_estado_id_pje: null;
  naturalidade_estado_sigla: null;
  uf_nascimento_id_pje: null;
  uf_nascimento_sigla: null;
  uf_nascimento_descricao: null;
  pais_nascimento_id_pje: null;
  pais_nascimento_codigo: null;
  pais_nascimento_descricao: null;
  escolaridade_codigo: null;
  situacao_cpf_receita_id: null;
  situacao_cpf_receita_descricao: null;
  pode_usar_celular_mensagem: null;
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
  id_pessoa_pje?: number | null;
  tipo_pessoa: 'pf';
  nome: string;
  cpf: string;
  nome_social_fantasia?: string | null;
  emails?: string[] | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  tipo_documento?: string | null;
  status_pje?: string | null;
  situacao_pje?: string | null;
  login_pje?: string | null;
  autoridade?: boolean | null;
  rg?: string | null;
  data_nascimento?: string | null;
  genero?: string | null;
  estado_civil?: string | null;
  nacionalidade?: string | null;
  sexo?: string | null;
  nome_genitora?: string | null;
  naturalidade_id_pje?: number | null;
  naturalidade_municipio?: string | null;
  naturalidade_estado_id_pje?: number | null;
  naturalidade_estado_sigla?: string | null;
  uf_nascimento_id_pje?: number | null;
  uf_nascimento_sigla?: string | null;
  uf_nascimento_descricao?: string | null;
  pais_nascimento_id_pje?: number | null;
  pais_nascimento_codigo?: string | null;
  pais_nascimento_descricao?: string | null;
  escolaridade_codigo?: number | null;
  situacao_cpf_receita_id?: number | null;
  situacao_cpf_receita_descricao?: string | null;
  pode_usar_celular_mensagem?: boolean | null;
  observacoes?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
  endereco_id?: number | null;
  ativo?: boolean;
  created_by?: number | null;
}

/**
 * Dados para criar parte contrária PJ
 */
export interface CriarParteContrariaPJParams {
  id_pessoa_pje?: number | null;
  tipo_pessoa: 'pj';
  nome: string;
  cnpj: string;
  nome_social_fantasia?: string | null;
  emails?: string[] | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  tipo_documento?: string | null;
  status_pje?: string | null;
  situacao_pje?: string | null;
  login_pje?: string | null;
  autoridade?: boolean | null;
  inscricao_estadual?: string | null;
  data_abertura?: string | null;
  data_fim_atividade?: string | null;
  orgao_publico?: boolean | null;
  tipo_pessoa_codigo_pje?: string | null;
  tipo_pessoa_label_pje?: string | null;
  tipo_pessoa_validacao_receita?: string | null;
  ds_tipo_pessoa?: string | null;
  situacao_cnpj_receita_id?: number | null;
  situacao_cnpj_receita_descricao?: string | null;
  ramo_atividade?: string | null;
  cpf_responsavel?: string | null;
  oficial?: boolean | null;
  ds_prazo_expediente_automatico?: string | null;
  porte_codigo?: number | null;
  porte_descricao?: string | null;
  ultima_atualizacao_pje?: string | null;
  observacoes?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
  endereco_id?: number | null;
  ativo?: boolean;
  created_by?: number | null;
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
  id_pessoa_pje?: number;
  tipo_pessoa?: 'pf';
  nome?: string;
  cpf?: string;
  nome_social_fantasia?: string | null;
  emails?: string[] | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  tipo_documento?: string | null;
  status_pje?: string | null;
  situacao_pje?: string | null;
  login_pje?: string | null;
  autoridade?: boolean | null;
  rg?: string | null;
  data_nascimento?: string | null;
  genero?: string | null;
  estado_civil?: string | null;
  nacionalidade?: string | null;
  sexo?: string | null;
  nome_genitora?: string | null;
  naturalidade_id_pje?: number | null;
  naturalidade_municipio?: string | null;
  naturalidade_estado_id_pje?: number | null;
  naturalidade_estado_sigla?: string | null;
  uf_nascimento_id_pje?: number | null;
  uf_nascimento_sigla?: string | null;
  uf_nascimento_descricao?: string | null;
  pais_nascimento_id_pje?: number | null;
  pais_nascimento_codigo?: string | null;
  pais_nascimento_descricao?: string | null;
  escolaridade_codigo?: number | null;
  situacao_cpf_receita_id?: number | null;
  situacao_cpf_receita_descricao?: string | null;
  pode_usar_celular_mensagem?: boolean | null;
  observacoes?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
  endereco_id?: number | null;
  ativo?: boolean;
}

/**
 * Dados para atualizar parte contrária PJ
 */
export interface AtualizarParteContrariaPJParams {
  id: number;
  id_pessoa_pje?: number;
  tipo_pessoa?: 'pj';
  nome?: string;
  cnpj?: string;
  nome_social_fantasia?: string | null;
  emails?: string[] | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  tipo_documento?: string | null;
  status_pje?: string | null;
  situacao_pje?: string | null;
  login_pje?: string | null;
  autoridade?: boolean | null;
  inscricao_estadual?: string | null;
  data_abertura?: string | null;
  data_fim_atividade?: string | null;
  orgao_publico?: boolean | null;
  tipo_pessoa_codigo_pje?: string | null;
  tipo_pessoa_label_pje?: string | null;
  tipo_pessoa_validacao_receita?: string | null;
  ds_tipo_pessoa?: string | null;
  situacao_cnpj_receita_id?: number | null;
  situacao_cnpj_receita_descricao?: string | null;
  ramo_atividade?: string | null;
  cpf_responsavel?: string | null;
  oficial?: boolean | null;
  ds_prazo_expediente_automatico?: string | null;
  porte_codigo?: number | null;
  porte_descricao?: string | null;
  ultima_atualizacao_pje?: string | null;
  observacoes?: string | null;
  dados_anteriores?: Record<string, unknown> | null;
  endereco_id?: number | null;
  ativo?: boolean;
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
  busca?: string; // Busca em nome, cpf, cnpj, nome_fantasia, emails

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
