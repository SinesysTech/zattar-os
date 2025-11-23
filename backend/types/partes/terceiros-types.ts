// Tipos e interfaces para o serviço de terceiros (peritos, MP, assistentes, etc.)

import type { GrauAcervo } from '@/backend/types/acervo/types';

/**
 * Tipo de pessoa (PF ou PJ)
 */
export type TipoPessoa = 'pf' | 'pj';

/**
 * Grau do processo (primeiro ou segundo grau)
 */
export type GrauTerceiro = GrauAcervo;

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
 */
interface TerceiroBase {
  id: number;
  id_pje: number;
  id_pessoa_pje: number;
  processo_id: number;
  tipo_parte: TipoParteTerceiro;
  polo: PoloTerceiro;
  trt: string;
  grau: GrauTerceiro;
  numero_processo: string;
  tipo_pessoa: TipoPessoa;
  nome: string;
  nome_social: string | null;
  emails: string[] | null; // JSONB array
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_telefone: string | null;
  numero_telefone: string | null;
  fax: string | null;
  situacao: SituacaoPJE | null;
  observacoes: string | null;
  dados_pje_completo: Record<string, unknown> | null; // JSONB
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Campos específicos de Pessoa Física
 */
export interface TerceiroPessoaFisica extends TerceiroBase {
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
  cartao_nacional_saude: string | null;
  certificado_militar: string | null;
  numero_titulo_eleitor: string | null;
  zona_titulo_eleitor: string | null;
  secao_titulo_eleitor: string | null;
  tipo_sanguineo: string | null;
  raca_cor: string | null;
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
  capital_social: null;
  nome_fantasia: null;
  status_pje: null;
}

/**
 * Campos específicos de Pessoa Jurídica
 */
export interface TerceiroPessoaJuridica extends TerceiroBase {
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
  cartao_nacional_saude: null;
  certificado_militar: null;
  numero_titulo_eleitor: null;
  zona_titulo_eleitor: null;
  secao_titulo_eleitor: null;
  tipo_sanguineo: null;
  raca_cor: null;
  estado_civil: null;
  grau_instrucao: null;
  necessidade_especial: null;
}

/**
 * Terceiro completo (Discriminated Union)
 */
export type Terceiro = TerceiroPessoaFisica | TerceiroPessoaJuridica;

/**
 * Dados para criar terceiro PF
 */
export interface CriarTerceiroPFParams {
  id_pje: number;
  id_pessoa_pje: number;
  processo_id: number;
  tipo_parte: TipoParteTerceiro;
  polo: PoloTerceiro;
  trt: string;
  grau: GrauTerceiro;
  numero_processo: string;
  tipo_pessoa: 'pf';
  nome: string;
  cpf: string;
  nome_social?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_telefone?: string;
  numero_telefone?: string;
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
  cartao_nacional_saude?: string;
  certificado_militar?: string;
  numero_titulo_eleitor?: string;
  zona_titulo_eleitor?: string;
  secao_titulo_eleitor?: string;
  tipo_sanguineo?: string;
  raca_cor?: string;
  estado_civil?: string;
  grau_instrucao?: string;
  necessidade_especial?: string;
  situacao?: SituacaoPJE;
  observacoes?: string;
  dados_pje_completo?: Record<string, unknown>;
}

/**
 * Dados para criar terceiro PJ
 */
export interface CriarTerceiroPJParams {
  id_pje: number;
  id_pessoa_pje: number;
  processo_id: number;
  tipo_parte: TipoParteTerceiro;
  polo: PoloTerceiro;
  trt: string;
  grau: GrauTerceiro;
  numero_processo: string;
  tipo_pessoa: 'pj';
  nome: string;
  cnpj: string;
  nome_social?: string;
  nome_fantasia?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_telefone?: string;
  numero_telefone?: string;
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
  dados_pje_completo?: Record<string, unknown>;
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
  id_pje?: number;
  id_pessoa_pje?: number;
  processo_id?: number;
  tipo_parte?: TipoParteTerceiro;
  polo?: PoloTerceiro;
  trt?: string;
  grau?: GrauTerceiro;
  numero_processo?: string;
  tipo_pessoa?: 'pf';
  nome?: string;
  cpf?: string;
  nome_social?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_telefone?: string;
  numero_telefone?: string;
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
  cartao_nacional_saude?: string;
  certificado_militar?: string;
  numero_titulo_eleitor?: string;
  zona_titulo_eleitor?: string;
  secao_titulo_eleitor?: string;
  tipo_sanguineo?: string;
  raca_cor?: string;
  estado_civil?: string;
  grau_instrucao?: string;
  necessidade_especial?: string;
  situacao?: SituacaoPJE;
  observacoes?: string;
  dados_pje_completo?: Record<string, unknown>;
}

/**
 * Dados para atualizar terceiro PJ
 */
export interface AtualizarTerceiroPJParams {
  id: number;
  id_pje?: number;
  id_pessoa_pje?: number;
  processo_id?: number;
  tipo_parte?: TipoParteTerceiro;
  polo?: PoloTerceiro;
  trt?: string;
  grau?: GrauTerceiro;
  numero_processo?: string;
  tipo_pessoa?: 'pj';
  nome?: string;
  cnpj?: string;
  nome_social?: string;
  nome_fantasia?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_telefone?: string;
  numero_telefone?: string;
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
  dados_pje_completo?: Record<string, unknown>;
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
 */
export interface ListarTerceirosParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Filtros básicos
  tipo_pessoa?: TipoPessoa;
  tipo_parte?: TipoParteTerceiro;
  polo?: PoloTerceiro;
  processo_id?: number;
  trt?: string;
  grau?: GrauTerceiro;

  // Busca textual
  busca?: string; // Busca em nome, cpf, cnpj, nome_social, emails

  // Filtros específicos
  nome?: string;
  cpf?: string;
  cnpj?: string;
  id_pessoa_pje?: number;
  numero_processo?: string;

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
 * Método upsert por id_pessoa_pje
 */
export interface UpsertTerceiroPorIdPessoaParams extends CriarTerceiroParams {
  id_pessoa_pje: number; // Required para upsert
}

/**
 * Parâmetros para buscar terceiros de um processo
 */
export interface BuscarTerceirosPorProcessoParams {
  processo_id: number;
  tipo_parte?: TipoParteTerceiro;
}
