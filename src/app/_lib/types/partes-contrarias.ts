/**
 * Tipos frontend para Partes Contrárias
 * Re-exporta tipos do backend para uso em componentes React
 */

// Re-exporta todos os tipos de partes contrárias do backend
export type {
  TipoPessoa,
  GrauParteContraria,
  SituacaoPJE,
  ParteContraria,
  ParteContrariaPessoaFisica,
  ParteContrariaPessoaJuridica,
  CriarParteContrariaParams,
  AtualizarParteContrariaParams,
  ListarPartesContrariasParams,
  ListarPartesContrariasResult,
  UpsertParteContrariaPorCPFParams,
  UpsertParteContrariaPorCNPJParams,
  UpsertParteContrariaPorDocumentoParams,
  OrdenarPorParteContraria,
  OrdemParteContraria,
} from '@/backend/types/partes/partes-contrarias-types';

// Tipos auxiliares para formulários
export interface ParteContrariaFormData {
  // Campos obrigatórios
  tipo_pessoa: 'pf' | 'pj';
  nome: string;
  trt: string;
  grau: 'primeiro_grau' | 'segundo_grau';
  numero_processo: string;

  // PF: CPF obrigatório
  cpf?: string;

  // PJ: CNPJ obrigatório
  cnpj?: string;

  // Campos opcionais comuns
  id_pje?: number;
  id_pessoa_pje?: number;
  nome_social?: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_telefone?: string;
  numero_telefone?: string;
  fax?: string;
  situacao?: 'A' | 'I' | 'E' | 'H';
  observacoes?: string;
  dados_pje_completo?: Record<string, unknown>;

  // Campos PF
  tipo_documento?: string;
  numero_rg?: string;
  orgao_emissor_rg?: string;
  uf_rg?: string;
  data_nascimento?: string;
  sexo?: string;
  nacionalidade?: string;
  estado_civil?: string;
  profissao?: string;
  nome_mae?: string;
  nome_pai?: string;
  carteira_trabalho?: string;
  serie_carteira_trabalho?: string;
  pis_pasep?: string;
  ctps?: string;
  serie_ctps?: string;
  uf_ctps?: string;
  data_expedicao_ctps?: string;
  titulo_eleitor?: string;
  zona_eleitoral?: string;
  secao_eleitoral?: string;
  carteira_oab?: string;
  uf_oab?: string;
  carteira_cnh?: string;
  categoria_cnh?: string;
  validade_cnh?: string;
  data_primeira_cnh?: string;

  // Campos PJ
  tipo_empresa?: string;
  razao_social?: string;
  nome_fantasia?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  cnae_principal?: string;
  data_constituicao?: string;
  capital_social?: number;
  porte_empresa?: string;
  nome_representante_legal?: string;
  cpf_representante_legal?: string;
}

/**
 * Valida se uma parte contrária é Pessoa Física
 */
export function isParteContrariaPessoaFisica(parte: { tipo_pessoa: string }): boolean {
  return parte.tipo_pessoa === 'pf';
}

/**
 * Valida se uma parte contrária é Pessoa Jurídica
 */
export function isParteContrariaPessoaJuridica(parte: { tipo_pessoa: string }): boolean {
  return parte.tipo_pessoa === 'pj';
}

/**
 * Formata CPF para exibição
 */
export function formatarCpf(cpf: string | null | undefined): string {
  if (!cpf) return '';
  const numeros = cpf.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ para exibição
 */
export function formatarCnpj(cnpj: string | null | undefined): string {
  if (!cnpj) return '';
  const numeros = cnpj.replace(/\D/g, '');
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata telefone para exibição
 */
export function formatarTelefone(ddd: string | null | undefined, numero: string | null | undefined): string {
  if (!ddd || !numero) return '';
  return `(${ddd}) ${numero}`;
}

/**
 * Retorna label de situação
 */
export function getSituacaoLabel(situacao: 'A' | 'I' | 'E' | 'H' | null | undefined): string {
  if (!situacao) return 'Desconhecido';
  const labels = {
    A: 'Ativo',
    I: 'Inativo',
    E: 'Excluído',
    H: 'Histórico',
  };
  return labels[situacao] || 'Desconhecido';
}

/**
 * Retorna cor da badge de situação
 */
export function getSituacaoColor(situacao: 'A' | 'I' | 'E' | 'H' | null | undefined): string {
  if (!situacao) return 'default';
  const colors = {
    A: 'green',
    I: 'yellow',
    E: 'red',
    H: 'gray',
  };
  return colors[situacao] || 'default';
}
