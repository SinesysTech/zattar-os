import type { TipoPessoa } from './common';

// #region Tipos de Pessoa

/**
 * Campos base comuns a uma pessoa (PF ou PJ).
 */
export interface PessoaBase {
  id: number;
  tipo_pessoa: TipoPessoa;
  nome: string;
  nome_social_fantasia: string | null;
  emails: string[] | null;
  ddd_celular: string | null;
  numero_celular: string | null;
  ddd_residencial: string | null;
  numero_residencial: string | null;
  ddd_comercial: string | null;
  numero_comercial: string | null;
  tipo_documento: string | null;
  status_pje: string | null;
  situacao_pje: string | null;
  login_pje: string | null;
  autoridade: boolean | null;
  observacoes: string | null;
  dados_anteriores: Record<string, unknown> | null;
  endereco_id: number | null;
  ativo: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Representa uma pessoa do tipo Pessoa Física.
 */
export interface PessoaFisica extends PessoaBase {
  tipo_pessoa: 'pf';
  cpf: string;
  cnpj: null;
  rg: string | null;
  data_nascimento: string | null;
  genero: string | null;
  estado_civil: string | null;
  nacionalidade: string | null;
  sexo: string | null;
  nome_genitora: string | null;
  naturalidade_id_pje: number | null;
  naturalidade_municipio: string | null;
  naturalidade_estado_id_pje: number | null;
  naturalidade_estado_sigla: string | null;
  uf_nascimento_id_pje: number | null;
  uf_nascimento_sigla: string | null;
  uf_nascimento_descricao: string | null;
  pais_nascimento_id_pje: number | null;
  pais_nascimento_codigo: string | null;
  pais_nascimento_descricao: string | null;
  escolaridade_codigo: number | null;
  situacao_cpf_receita_id: number | null;
  situacao_cpf_receita_descricao: string | null;
  pode_usar_celular_mensagem: boolean | null;
}

/**
 * Representa uma pessoa do tipo Pessoa Jurídica.
 */
export interface PessoaJuridica extends PessoaBase {
  tipo_pessoa: 'pj';
  cnpj: string;
  cpf: null;
  inscricao_estadual: string | null;
  data_abertura: string | null;
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
  ultima_atualizacao_pje: string | null;
}

/**
 * Tipo unificado para uma pessoa, que pode ser PF ou PJ.
 */
export type Pessoa = PessoaFisica | PessoaJuridica;

// #endregion
