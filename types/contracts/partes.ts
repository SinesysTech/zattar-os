import type {
  Cliente,
  ParteContraria,
  Terceiro,
  TipoParteTerceiro,
  PoloTerceiro,
} from '@/types/domain/partes';
import type { GrauProcesso, TipoPessoa } from '@/types/domain/common';

// Re-exporta tipos de domínio usados frequentemente com contratos
export type {
  TipoParteTerceiro,
  PoloTerceiro,
} from '@/types/domain/partes';

export type {
  EntidadeTipoProcessoParte,
  TipoParteProcesso,
  PoloProcessoParte,
} from '@/types/domain/processo-partes';

export type {
  EntidadeTipoEndereco,
  SituacaoEndereco,
} from '@/types/domain/enderecos';

// #region Contratos de Cliente
export interface CriarClientePFParams {
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
  endereco_id?: number | null;
  ativo?: boolean;
  created_by?: number | null;
}
export interface CriarClientePJParams {
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
  endereco_id?: number | null;
  ativo?: boolean;
  created_by?: number | null;
}
export type CriarClienteParams = CriarClientePFParams | CriarClientePJParams;
export interface AtualizarClientePFParams {
  id: number;
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
export interface AtualizarClientePJParams {
  id: number;
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
export type AtualizarClienteParams = AtualizarClientePFParams | AtualizarClientePJParams;
export type OrdenarPorCliente = 'nome' | 'cpf' | 'cnpj' | 'tipo_pessoa' | 'created_at' | 'updated_at';
export type OrdemCliente = 'asc' | 'desc';
export interface ListarClientesParams {
  pagina?: number;
  limite?: number;
  tipo_pessoa?: TipoPessoa;
  trt?: string;
  grau?: GrauProcesso;
  busca?: string;
  nome?: string;
  cpf?: string;
  cnpj?: string;
  ordenar_por?: OrdenarPorCliente;
  ordem?: OrdemCliente;
  numero_processo?: string;
}
export interface ListarClientesResult {
  clientes: Cliente[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}
export interface UpsertClientePorCPFParams extends CriarClientePFParams {
  cpf: string;
}
export interface UpsertClientePorCNPJParams extends CriarClientePJParams {
  cnpj: string;
}
export type UpsertClientePorDocumentoParams = UpsertClientePorCPFParams | UpsertClientePorCNPJParams;

import type { Endereco } from '@/types/domain/enderecos';
export interface ClienteComEndereco extends Cliente {
  endereco?: Endereco | null;
}
// #endregion

// #region Contratos de Parte Contrária
export interface CriarParteContrariaPFParams {
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
  endereco_id?: number | null;
  ativo?: boolean;
  created_by?: number | null;
}
export interface CriarParteContrariaPJParams {
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
  endereco_id?: number | null;
  ativo?: boolean;
  created_by?: number | null;
}
export type CriarParteContrariaParams = CriarParteContrariaPFParams | CriarParteContrariaPJParams;
export interface AtualizarParteContrariaPFParams {
  id: number;
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
export interface AtualizarParteContrariaPJParams {
  id: number;
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
export type AtualizarParteContrariaParams = AtualizarParteContrariaPFParams | AtualizarParteContrariaPJParams;
export type OrdenarPorParteContraria = 'nome' | 'cpf' | 'cnpj' | 'tipo_pessoa' | 'created_at' | 'updated_at';
export type OrdemParteContraria = 'asc' | 'desc';
export interface ListarPartesContrariasParams {
  pagina?: number;
  limite?: number;
  tipo_pessoa?: TipoPessoa;
  trt?: string;
  grau?: GrauProcesso;
  busca?: string;
  nome?: string;
  cpf?: string;
  cnpj?: string;
  ordenar_por?: OrdenarPorParteContraria;
  ordem?: OrdemParteContraria;
  numero_processo?: string;
}
export interface ListarPartesContrariasResult {
  partesContrarias: ParteContraria[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}
export interface UpsertParteContrariaPorCPFParams extends CriarParteContrariaPFParams {
  cpf: string;
}
export interface UpsertParteContrariaPorCNPJParams extends CriarParteContrariaPJParams {
  cnpj: string;
}
export type UpsertParteContrariaPorDocumentoParams = UpsertParteContrariaPorCPFParams | UpsertParteContrariaPorCNPJParams;



// #region Contratos de Terceiro
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
  uf_nascimento_id_pje?: number;
  uf_nascimento_sigla?: string;
  uf_nascimento_descricao?: string;
  naturalidade_id_pje?: number;
  naturalidade_municipio?: string;
  naturalidade_estado_id_pje?: number;
  naturalidade_estado_sigla?: string;
  pais_nascimento_id_pje?: number;
  pais_nascimento_codigo?: string;
  pais_nascimento_descricao?: string;
  escolaridade_codigo?: number;
  situacao_cpf_receita_id?: number;
  situacao_cpf_receita_descricao?: string;
  pode_usar_celular_mensagem?: boolean;
  principal?: boolean;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  status_pje?: string;
  situacao_pje?: string;
  login_pje?: string;
  ordem?: number;
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
  ativo?: boolean;
  endereco_id?: number;
}
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
  principal?: boolean;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  status_pje?: string;
  situacao_pje?: string;
  login_pje?: string;
  ordem?: number;
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
  ativo?: boolean;
  endereco_id?: number;
}
export type CriarTerceiroParams = CriarTerceiroPFParams | CriarTerceiroPJParams;
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
  uf_nascimento_id_pje?: number;
  uf_nascimento_sigla?: string;
  uf_nascimento_descricao?: string;
  naturalidade_id_pje?: number;
  naturalidade_municipio?: string;
  naturalidade_estado_id_pje?: number;
  naturalidade_estado_sigla?: string;
  pais_nascimento_id_pje?: number;
  pais_nascimento_codigo?: string;
  pais_nascimento_descricao?: string;
  escolaridade_codigo?: number;
  situacao_cpf_receita_id?: number;
  situacao_cpf_receita_descricao?: string;
  pode_usar_celular_mensagem?: boolean;
  principal?: boolean;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  status_pje?: string;
  situacao_pje?: string;
  login_pje?: string;
  ordem?: number;
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
  ativo?: boolean;
  endereco_id?: number;
}
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
  principal?: boolean;
  autoridade?: boolean;
  endereco_desconhecido?: boolean;
  status_pje?: string;
  situacao_pje?: string;
  login_pje?: string;
  ordem?: number;
  observacoes?: string;
  dados_anteriores?: Record<string, unknown>;
  ativo?: boolean;
  endereco_id?: number;
}
export type AtualizarTerceiroParams = AtualizarTerceiroPFParams | AtualizarTerceiroPJParams;
export type OrdenarPorTerceiro = 'nome' | 'cpf' | 'cnpj' | 'tipo_pessoa' | 'tipo_parte' | 'polo' | 'created_at' | 'updated_at';
export type OrdemTerceiro = 'asc' | 'desc';
export interface ListarTerceirosParams {
  pagina?: number;
  limite?: number;
  tipo_pessoa?: TipoPessoa;
  tipo_parte?: TipoParteTerceiro;
  polo?: PoloTerceiro;
  busca?: string;
  nome?: string;
  cpf?: string;
  cnpj?: string;
  ordenar_por?: OrdenarPorTerceiro;
  ordem?: OrdemTerceiro;
}
export interface ListarTerceirosResult {
  terceiros: Terceiro[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}
export interface UpsertTerceiroPorCPFParams extends CriarTerceiroPFParams {
  cpf: string;
}
export interface UpsertTerceiroPorCNPJParams extends CriarTerceiroPJParams {
  cnpj: string;
}
export type UpsertTerceiroPorDocumentoParams = UpsertTerceiroPorCPFParams | UpsertTerceiroPorCNPJParams;
export interface UpsertTerceiroPorIdPessoaParams {
  id_pessoa_pje: number;
  tipo_parte: TipoParteTerceiro;
  polo: PoloTerceiro;
  tipo_pessoa: 'pf' | 'pj';
  nome: string;
  cpf?: string;
  cnpj?: string;
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
// #endregion
