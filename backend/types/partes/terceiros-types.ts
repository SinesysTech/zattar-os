// Tipos e interfaces para o serviço de terceiros (peritos, MP, assistentes, etc.)

/**
 * Tipo de pessoa (PF ou PJ)
 */
export type TipoPessoa = 'pf' | 'pj';

/**
 * Tipo de parte terceira no processo
 */
export type TipoParteTerceiro =
  | 'PERITO'
  | 'MINISTERIO_PUBLICO'
  | 'ASSISTENTE'
  | 'TESTEMUNHA'
  | 'CUSTOS_LEGIS'
  | 'AMICUS_CURIAE'
  | 'OUTRO';

/**
 * Polo processual
 */
export type PoloTerceiro = 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO';

/**
 * Situação do registro no PJE
 */
export type SituacaoPJE = 'A' | 'I' | 'E' | 'H'; // A=Ativo, I=Inativo, E=Excluído, H=Histórico

/**
 * Campos base comuns a PF e PJ
 * NOTA: Terceiros é uma tabela global - conexão com processo via processo_partes.
 * O campo id_pessoa_pje foi movido para a tabela cadastros_pje, pois não é globalmente único.
 */
interface TerceiroBase {
  id: number;
  id_tipo_parte: number | null;
  tipo_parte: TipoParteTerceiro;
  polo: PoloTerceiro;
  tipo_pessoa: TipoPessoa;
  nome: string;
  nome_fantasia: string | null;
  emails: string[] | null; // JSONB array
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_residencial: string | null;
  numero_residencial: string | null;
  ddd_comercial: string | null;
  numero_comercial: string | null;
  // Flags
  principal: boolean | null;
  autoridade: boolean | null;
  endereco_desconhecido: boolean | null;
  // Status PJE
  status_pje: string | null;
  situacao_pje: string | null;
  login_pje: string | null;
  ordem: number | null;
  // Controle
  observacoes: string | null;
  dados_anteriores: Record<string, unknown> | null; // JSONB
  ativo: boolean | null;
  endereco_id: number | null; // FK para tabela enderecos
  ultima_atualizacao_pje: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Campos específicos de Pessoa Física
 * Inclui campos detalhados do PJE (naturalidade, UF nascimento, país nascimento, etc.)
 */
export interface TerceiroPessoaFisica extends TerceiroBase {
  tipo_pessoa: 'pf';
  cpf: string; // Required para PF
  cnpj: null;
  tipo_documento: string | null;
  rg: string | null;
  sexo: string | null;
  nome_genitora: string | null;
  data_nascimento: string | null; // ISO date
  genero: string | null;
  estado_civil: string | null;
  nacionalidade: string | null;
  // Campos detalhados do PJE - UF Nascimento
  uf_nascimento_id_pje: number | null;
  uf_nascimento_sigla: string | null;
  uf_nascimento_descricao: string | null;
  // Campos detalhados do PJE - Naturalidade
  naturalidade_id_pje: number | null;
  naturalidade_municipio: string | null;
  naturalidade_estado_id_pje: number | null;
  naturalidade_estado_sigla: string | null;
  // Campos detalhados do PJE - País Nascimento
  pais_nascimento_id_pje: number | null;
  pais_nascimento_codigo: string | null;
  pais_nascimento_descricao: string | null;
  // Outros campos do PJE
  escolaridade_codigo: number | null;
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
}

/**
 * Campos específicos de Pessoa Jurídica
 * Inclui campos detalhados do PJE (tipo pessoa, situação CNPJ, etc.)
 */
export interface TerceiroPessoaJuridica extends TerceiroBase {
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
  porte_codigo: number | null;
  porte_descricao: string | null;
  // Campos que são null em PJ (específicos de PF)
  tipo_documento: null;
  rg: null;
  sexo: null;
  nome_genitora: null;
  data_nascimento: null;
  genero: null;
  estado_civil: null;
  nacionalidade: null;
  uf_nascimento_id_pje: null;
  uf_nascimento_sigla: null;
  uf_nascimento_descricao: null;
  naturalidade_id_pje: null;
  naturalidade_municipio: null;
  naturalidade_estado_id_pje: null;
  naturalidade_estado_sigla: null;
  pais_nascimento_id_pje: null;
  pais_nascimento_codigo: null;
  pais_nascimento_descricao: null;
  escolaridade_codigo: null;
  situacao_cpf_receita_id: null;
  situacao_cpf_receita_descricao: null;
  pode_usar_celular_mensagem: null;
}

/**
 * Terceiro completo (Discriminated Union)
 */
export type Terceiro = TerceiroPessoaFisica | TerceiroPessoaJuridica;

/**
 * Tipos com endereço populado (para queries com JOIN)
 */
import type { Endereco } from '@/backend/types/partes/enderecos-types';

export interface TerceiroPessoaFisicaComEndereco extends TerceiroPessoaFisica {
  endereco?: Endereco | null;
}

export interface TerceiroPessoaJuridicaComEndereco extends TerceiroPessoaJuridica {
  endereco?: Endereco | null;
}

export type TerceiroComEndereco =
  | TerceiroPessoaFisicaComEndereco
  | TerceiroPessoaJuridicaComEndereco;

/**
 * Dados para criar terceiro PF
 * NOTA: Terceiros é uma tabela GLOBAL - campos de processo (trt, grau, numero_processo)
 * vão para processo_partes, não para esta tabela. Deduplicação agora por CPF/CNPJ.
 */
export interface CriarTerceiroPFParams {
  tipo_parte: TipoParteTerceiro | string;
  polo: PoloTerceiro | string;
  tipo_pessoa: 'pf';
  nome: string;
  cpf: string;
  nome_fantasia?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
  ddd_comercial?: string;
  numero_comercial?: string;
  tipo_documento?: string;
  rg?: string;
  sexo?: string;
  nome_genitora?: string;
  data_nascimento?: string;
  genero?: string;
  estado_civil?: string;
  nacionalidade?: string;
  // Campos detalhados do PJE - UF Nascimento
  uf_nascimento_id_pje?: number;
  uf_nascimento_sigla?: string;
  uf_nascimento_descricao?: string;
  // Campos detalhados do PJE - Naturalidade
  naturalidade_id_pje?: number;
  naturalidade_municipio?: string;
  naturalidade_estado_id_pje?: number;
  naturalidade_estado_sigla?: string;
  // Campos detalhados do PJE - País Nascimento
  pais_nascimento_id_pje?: number;
  pais_nascimento_codigo?: string;
  pais_nascimento_descricao?: string;
  // Outros campos do PJE
  escolaridade_codigo?: number;
  situacao_cpf_receita_id?: number;
  situacao_cpf_receita_descricao?: string;
  pode_usar_celular_mensagem?: boolean;
  // Flags e status
  principal?: boolean;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  status_pje?: string;
  situacao_pje?: string;
  login_pje?: string;
  ordem?: number;
  // Controle
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
  ativo?: boolean;
  endereco_id?: number;
}

/**
 * Dados para criar terceiro PJ
 * NOTA: Terceiros é uma tabela GLOBAL - campos de processo (trt, grau, numero_processo)
 * vão para processo_partes, não para esta tabela. Deduplicação agora por CPF/CNPJ.
 */
export interface CriarTerceiroPJParams {
  tipo_parte: TipoParteTerceiro | string;
  polo: PoloTerceiro | string;
  tipo_pessoa: 'pj';
  nome: string;
  cnpj: string;
  nome_fantasia?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
  ddd_comercial?: string;
  numero_comercial?: string;
  inscricao_estadual?: string;
  data_abertura?: string;
  data_fim_atividade?: string;
  orgao_publico?: boolean;
  tipo_pessoa_codigo_pje?: string;
  tipo_pessoa_label_pje?: string;
  tipo_pessoa_validacao_receita?: string;
  ds_tipo_pessoa?: string;
  situacao_cnpj_receita_id?: number;
  situacao_cnpj_receita_descricao?: string;
  ramo_atividade?: string;
  cpf_responsavel?: string;
  oficial?: boolean;
  ds_prazo_expediente_automatico?: string;
  porte_codigo?: number;
  porte_descricao?: string;
  // Flags e status
  principal?: boolean;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  status_pje?: string;
  situacao_pje?: string;
  login_pje?: string;
  ordem?: number;
  // Controle
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
  ativo?: boolean;
  endereco_id?: number;
}

/**
 * Dados para criar terceiro (união)
 */
export type CriarTerceiroParams = CriarTerceiroPFParams | CriarTerceiroPJParams;

/**
 * Dados para atualizar terceiro PF
 */
export interface AtualizarTerceiroPFParams {
  id: number;
  tipo_parte?: TipoParteTerceiro | string;
  polo?: PoloTerceiro | string;
  tipo_pessoa?: 'pf';
  nome?: string;
  cpf?: string;
  nome_fantasia?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
  ddd_comercial?: string;
  numero_comercial?: string;
  tipo_documento?: string;
  rg?: string;
  sexo?: string;
  nome_genitora?: string;
  data_nascimento?: string;
  genero?: string;
  estado_civil?: string;
  nacionalidade?: string;
  // Campos detalhados do PJE - UF Nascimento
  uf_nascimento_id_pje?: number;
  uf_nascimento_sigla?: string;
  uf_nascimento_descricao?: string;
  // Campos detalhados do PJE - Naturalidade
  naturalidade_id_pje?: number;
  naturalidade_municipio?: string;
  naturalidade_estado_id_pje?: number;
  naturalidade_estado_sigla?: string;
  // Campos detalhados do PJE - País Nascimento
  pais_nascimento_id_pje?: number;
  pais_nascimento_codigo?: string;
  pais_nascimento_descricao?: string;
  // Outros campos do PJE
  escolaridade_codigo?: number;
  situacao_cpf_receita_id?: number;
  situacao_cpf_receita_descricao?: string;
  pode_usar_celular_mensagem?: boolean;
  // Flags e status
  principal?: boolean;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  status_pje?: string;
  situacao_pje?: string;
  login_pje?: string;
  ordem?: number;
  // Controle
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
  ativo?: boolean;
  endereco_id?: number;
}

/**
 * Dados para atualizar terceiro PJ
 */
export interface AtualizarTerceiroPJParams {
  id: number;
  tipo_parte?: TipoParteTerceiro | string;
  polo?: PoloTerceiro | string;
  tipo_pessoa?: 'pj';
  nome?: string;
  cnpj?: string;
  nome_fantasia?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
  ddd_comercial?: string;
  numero_comercial?: string;
  inscricao_estadual?: string;
  data_abertura?: string;
  data_fim_atividade?: string;
  orgao_publico?: boolean;
  tipo_pessoa_codigo_pje?: string;
  tipo_pessoa_label_pje?: string;
  tipo_pessoa_validacao_receita?: string;
  ds_tipo_pessoa?: string;
  situacao_cnpj_receita_id?: number;
  situacao_cnpj_receita_descricao?: string;
  ramo_atividade?: string;
  cpf_responsavel?: string;
  oficial?: boolean;
  ds_prazo_expediente_automatico?: string;
  porte_codigo?: number;
  porte_descricao?: string;
  // Flags e status
  principal?: boolean;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  status_pje?: string;
  situacao_pje?: string;
  login_pje?: string;
  ordem?: number;
  // Controle
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
  ativo?: boolean;
  endereco_id?: number;
}

/**
 * Dados para atualizar terceiro (união)
 */
export type AtualizarTerceiroParams = AtualizarTerceiroPFParams | AtualizarTerceiroPJParams;

/**
 * Campos disponíveis para ordenação
 */
export type OrdenarPorTerceiro =
  | 'nome'
  | 'cpf'
  | 'cnpj'
  | 'tipo_pessoa'
  | 'tipo_parte'
  | 'polo'
  | 'created_at'
  | 'updated_at';

/**
 * Direção da ordenação
 */
export type OrdemTerceiro = 'asc' | 'desc';

/**
 * Parâmetros para listar terceiros
 * NOTA: Terceiros é tabela global. Para filtrar por processo, use processo_partes.
 */
export interface ListarTerceirosParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Filtros básicos
  tipo_pessoa?: TipoPessoa;
  tipo_parte?: TipoParteTerceiro;
  polo?: PoloTerceiro;

  // Busca textual
  busca?: string; // Busca em nome, cpf, cnpj, nome_fantasia, emails

  // Filtros específicos
  nome?: string;
  cpf?: string;
  cnpj?: string;

  // Ordenação
  ordenar_por?: OrdenarPorTerceiro;
  ordem?: OrdemTerceiro;
}

/**
 * Resultado da listagem
 */
export interface ListarTerceirosResult {
  terceiros: Terceiro[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Upsert terceiro PF por CPF (deduplicação por CPF)
 */
export interface UpsertTerceiroPorCPFParams extends CriarTerceiroPFParams {
  cpf: string; // Required para upsert
}

/**
 * Upsert terceiro PJ por CNPJ (deduplicação por CNPJ)
 */
export interface UpsertTerceiroPorCNPJParams extends CriarTerceiroPJParams {
  cnpj: string; // Required para upsert
}

/**
 * Upsert terceiro por documento (união)
 */
export type UpsertTerceiroPorDocumentoParams = UpsertTerceiroPorCPFParams | UpsertTerceiroPorCNPJParams;

/**
 * Upsert terceiro por id_pessoa_pje (tabela global)
 * Usado para captura de terceiros do PJE onde id_pessoa_pje é o identificador único
 */
export interface UpsertTerceiroPorIdPessoaParams {
  id_pessoa_pje: number;
  tipo_parte: TipoParteTerceiro;
  polo: PoloTerceiro;
  tipo_pessoa: 'pf' | 'pj';
  nome: string;
  cpf?: string;
  cnpj?: string;
  // Campos opcionais comuns
  nome_fantasia?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
  ddd_comercial?: string;
  numero_comercial?: string;
  observacoes?: string;
}

/**
 * Parâmetros para buscar terceiros de um processo
 */
export interface BuscarTerceirosPorProcessoParams {
  processo_id: number;
  tipo_parte?: TipoParteTerceiro;
}
