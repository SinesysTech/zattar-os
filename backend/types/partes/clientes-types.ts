// Tipos e interfaces para o serviço de clientes

import type { GrauAcervo } from '@/backend/types/acervo/types';
import type { Endereco } from './enderecos-types';

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
export interface ClienteBase {
  id: number;
  /**
   * ID da pessoa no sistema PJE. Usado para deduplicação em capturas. UNIQUE constraint garante que não há duplicatas. Null para clientes criados manualmente.
   */
  id_pessoa_pje: number | null;
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
  /**
   * Estado anterior do registro antes da última atualização. Usado para auditoria. Null na criação, populado automaticamente no update.
   */
  dados_anteriores: Record<string, unknown> | null;
  endereco_id: number | null; // FK para tabela enderecos
  ativo: boolean;
  created_by: number | null;
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
export interface ClientePessoaJuridica extends ClienteBase {
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
 * Cliente completo (Discriminated Union)
 */
export type Cliente = ClientePessoaFisica | ClientePessoaJuridica;

/**
 * Cliente PF com endereço populado (JOIN)
 */
export interface ClientePessoaFisicaComEndereco extends ClientePessoaFisica {
  endereco?: Endereco | null;
}

/**
 * Cliente PJ com endereço populado (JOIN)
 */
export interface ClientePessoaJuridicaComEndereco extends ClientePessoaJuridica {
  endereco?: Endereco | null;
}

/**
 * Cliente com endereço populado (Discriminated Union)
 */
export type ClienteComEndereco = ClientePessoaFisicaComEndereco | ClientePessoaJuridicaComEndereco;

/**
 * Dados para criar cliente PF
 */
export interface CriarClientePFParams {
  id_pessoa_pje?: number | null;
  tipo_pessoa: 'pf';
  nome: string;
  cpf: string;
  nome_social_fantasia?: string | null; // Serve para nome social em PF
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
  /**
   * Dados completos brutos do PJE (JSON). Usado para capturar todos os campos disponíveis no sistema PJE.
   */
  dados_pje_completo?: Record<string, unknown> | null;
  endereco_id?: number | null;
  ativo?: boolean;
  created_by?: number | null;
}

/**
 * Dados para criar cliente PJ
 */
export interface CriarClientePJParams {
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
  /**
   * Dados completos brutos do PJE (JSON). Usado para capturar todos os campos disponíveis no sistema PJE.
   */
  dados_pje_completo?: Record<string, unknown> | null;
  endereco_id?: number | null;
  ativo?: boolean;
  created_by?: number | null;
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
 * Dados para atualizar cliente PJ
 */
export interface AtualizarClientePJParams {
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
  busca?: string; // Busca em nome, cpf, cnpj, nome_fantasia, emails

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
export interface UpsertClientePorIdPessoaPFParams extends CriarClientePFParams {
  id_pessoa_pje: number; // Required para upsert
}

/**
 * Método upsert por id_pessoa_pje para cliente PJ
 */
export interface UpsertClientePorIdPessoaPJParams extends CriarClientePJParams {
  id_pessoa_pje: number; // Required para upsert
}

/**
 * Método upsert por id_pessoa_pje (união)
 */
export type UpsertClientePorIdPessoaParams =
  | UpsertClientePorIdPessoaPFParams
  | UpsertClientePorIdPessoaPJParams;