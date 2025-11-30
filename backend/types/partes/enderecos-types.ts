// Tipos e interfaces para o serviço de endereços

import type { GrauAcervo } from '@/backend/types/acervo/types';

/**
 * Tipo de entidade proprietária do endereço (relação polimórfica)
 * 
 * IMPORTANTE: Representantes NÃO usam esta tabela diretamente.
 * Eles possuem FK endereco_id que aponta para endereços de suas partes.
 * 
 * @see enderecos table schema
 */
export type EntidadeTipoEndereco = 'cliente' | 'parte_contraria' | 'terceiro';

/**
 * Grau do processo (primeiro ou segundo grau)
 */
export type GrauEndereco = GrauAcervo;

/**
 * Situação do endereço no PJE
 */
export type SituacaoEndereco = 'A' | 'I' | 'P' | 'H'; // A=Ativo, I=Inativo, P=Principal, H=Histórico

/** Situações de endereço válidas */
export const SITUACOES_ENDERECO = ['A', 'I', 'P', 'H'] as const;

/** Campos mínimos para endereço válido (pelo menos um deve estar presente) */
export const CAMPOS_MINIMOS_ENDERECO = ['logradouro', 'municipio', 'cep'] as const;

/**
 * Classificação de endereço
 */
export interface ClassificacaoEndereco {
  codigo?: string;
  descricao?: string;
}

/**
 * Registro de endereço completo baseado no schema do banco
 */
export interface Endereco {
  id: number;
  id_pje: number | null;
  // Tipo da entidade dona do endereço (não inclui 'representante')
  entidade_tipo: EntidadeTipoEndereco;
  // ID da entidade na tabela correspondente (clientes.id, partes_contrarias.id, terceiros.id)
  entidade_id: number;
  trt: string | null;
  grau: GrauAcervo | null;
  numero_processo: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  id_municipio_pje: number | null;
  municipio: string | null;
  municipio_ibge: string | null;
  estado_id_pje: number | null;
  estado_sigla: string | null;
  estado_descricao: string | null;
  // Nome completo do estado (ex: 'Minas Gerais') - campo adicional ao estado_sigla
  estado: string | null;
  pais_id_pje: number | null;
  pais_codigo: string | null;
  pais_descricao: string | null;
  // Nome completo do país (ex: 'Brasil') - campo adicional ao pais_codigo
  pais: string | null;
  cep: string | null;
  classificacoes_endereco: ClassificacaoEndereco[] | null; // JSONB array
  correspondencia: boolean | null;
  situacao: SituacaoEndereco | null;
  dados_pje_completo: Record<string, unknown> | null;
  id_usuario_cadastrador_pje: number | null;
  data_alteracao_pje: string | null; // ISO timestamp
  ativo: boolean | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Dados para criar endereço
 * 
 * Campos opcionais, mas recomenda-se preencher ao menos logradouro, municipio ou cep
 */
export interface CriarEnderecoParams {
  id_pje?: number;
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
  trt?: string;
  grau?: GrauAcervo;
  numero_processo?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  id_municipio_pje?: number;
  municipio?: string;
  municipio_ibge?: string;
  estado_id_pje?: number;
  estado_sigla?: string;
  estado_descricao?: string;
  estado?: string;
  pais_id_pje?: number;
  pais_codigo?: string;
  pais_descricao?: string;
  pais?: string;
  cep?: string;
  classificacoes_endereco?: ClassificacaoEndereco[];
  correspondencia?: boolean;
  situacao?: SituacaoEndereco;
  // OBRIGATÓRIO para endereços capturados do PJE (auditoria)
  dados_pje_completo?: Record<string, unknown>;
  id_usuario_cadastrador_pje?: number;
  data_alteracao_pje?: string;
  ativo?: boolean;
}

/**
 * Dados para atualizar endereço
 */
export interface AtualizarEnderecoParams {
  id: number;
  id_pje?: number;
  entidade_tipo?: EntidadeTipoEndereco;
  entidade_id?: number;
  trt?: string;
  grau?: GrauAcervo;
  numero_processo?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  id_municipio_pje?: number;
  municipio?: string;
  municipio_ibge?: string;
  estado_id_pje?: number;
  estado_sigla?: string;
  estado_descricao?: string;
  estado?: string;
  pais_id_pje?: number;
  pais_codigo?: string;
  pais_descricao?: string;
  pais?: string;
  cep?: string;
  classificacoes_endereco?: ClassificacaoEndereco[];
  correspondencia?: boolean;
  situacao?: SituacaoEndereco;
  dados_pje_completo?: Record<string, unknown>;
  id_usuario_cadastrador_pje?: number;
  data_alteracao_pje?: string;
  ativo?: boolean;
}

/**
 * Campos disponíveis para ordenação
 */
export type OrdenarPorEndereco =
  | 'logradouro'
  | 'municipio'
  | 'estado_sigla'
  | 'cep'
  | 'correspondencia'
  | 'situacao'
  | 'ativo'
  | 'created_at'
  | 'updated_at';

/**
 * Direção da ordenação
 */
export type OrdemEndereco = 'asc' | 'desc';

/**
 * Parâmetros para listar endereços
 */
export interface ListarEnderecosParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Filtros por entidade
  entidade_tipo?: EntidadeTipoEndereco;
  entidade_id?: number;

  // Filtros por processo
  trt?: string;
  grau?: GrauAcervo;
  numero_processo?: string;

  // Busca textual
  busca?: string; // Busca em logradouro, bairro, municipio, estado

  // Filtros específicos
  municipio?: string;
  estado_sigla?: string;
  estado?: string;
  pais_codigo?: string;
  pais?: string;
  cep?: string;
  correspondencia?: boolean;
  situacao?: SituacaoEndereco;
  ativo?: boolean;

  // Ordenação
  ordenar_por?: OrdenarPorEndereco;
  ordem?: OrdemEndereco;
}

/**
 * Resultado da listagem
 */
export interface ListarEnderecosResult {
  enderecos: Endereco[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Parâmetros para buscar endereços de uma entidade específica
 */
export interface BuscarEnderecosPorEntidadeParams {
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
}

/**
 * Resultado de validação de endereço
 */
export interface ValidacaoEnderecoResult {
  valido: boolean;
  avisos: string[];
}

/**
 * Parâmetros para definir endereço como principal
 */
export interface DefinirEnderecoPrincipalParams {
  id: number;
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
}
