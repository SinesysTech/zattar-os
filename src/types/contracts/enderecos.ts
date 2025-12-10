import type { Endereco, EntidadeTipoEndereco, SituacaoEndereco } from '@/types/domain/enderecos';
import type { GrauProcesso } from '@/types/domain/common';

/**
 * Campos disponíveis para ordenação de endereços.
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
 * Direção da ordenação (ascendente ou descendente).
 */
export type OrdemEndereco = 'asc' | 'desc';

/**
 * Parâmetros para a operação de criar um novo endereço.
 */
export interface CriarEnderecoParams {
  id_pje?: number;
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
  trt?: string;
  grau?: GrauProcesso;
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
  classificacoes_endereco?: { codigo?: string; descricao?: string }[];
  correspondencia?: boolean;
  situacao?: SituacaoEndereco;
  dados_pje_completo?: Record<string, unknown>;
  id_usuario_cadastrador_pje?: number;
  data_alteracao_pje?: string;
  ativo?: boolean;
}

/**
 * Parâmetros para a operação de atualizar um endereço existente.
 */
export interface AtualizarEnderecoParams {
  id: number;
  id_pje?: number;
  entidade_tipo?: EntidadeTipoEndereco;
  entidade_id?: number;
  trt?: string;
  grau?: GrauProcesso;
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
  classificacoes_endereco?: { codigo?: string; descricao?: string }[];
  correspondencia?: boolean;
  situacao?: SituacaoEndereco;
  dados_pje_completo?: Record<string, unknown>;
  id_usuario_cadastrador_pje?: number;
  data_alteracao_pje?: string;
  ativo?: boolean;
}

/**
 * Parâmetros para a operação de listar endereços.
 */
export interface ListarEnderecosParams {
  pagina?: number;
  limite?: number;
  entidade_tipo?: EntidadeTipoEndereco;
  entidade_id?: number;
  trt?: string;
  grau?: GrauProcesso;
  numero_processo?: string;
  busca?: string;
  municipio?: string;
  estado_sigla?: string;
  estado?: string;
  pais_codigo?: string;
  pais?: string;
  cep?: string;
  correspondencia?: boolean;
  situacao?: SituacaoEndereco;
  ativo?: boolean;
  ordenar_por?: OrdenarPorEndereco;
  ordem?: OrdemEndereco;
}

/**
 * Resultado da operação de listar endereços.
 */
export interface ListarEnderecosResult {
  enderecos: Endereco[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Parâmetros para buscar todos os endereços de uma entidade específica.
 */
export interface BuscarEnderecosPorEntidadeParams {
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
}

/**
 * Parâmetros para definir um endereço como o principal de uma entidade.
 */
export interface DefinirEnderecoPrincipalParams {
  id: number;
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
}
