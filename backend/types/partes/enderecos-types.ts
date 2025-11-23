// Tipos e interfaces para o serviço de endereços

import type { GrauAcervo } from '@/backend/types/acervo/types';

/**
 * Tipo de entidade proprietária do endereço
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
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
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
  pais_id_pje: number | null;
  pais_codigo: string | null;
  pais_descricao: string | null;
  cep: string | null;
  classificacoes_endereco: ClassificacaoEndereco[] | null; // JSONB array
  correspondencia: boolean | null;
  situacao: SituacaoEndereco | null;
  id_usuario_cadastrador_pje: number | null;
  data_alteracao_pje: string | null; // ISO timestamp
  ativo: boolean | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Dados para criar endereço
 */
export interface CriarEnderecoParams {
  id_pje?: number;
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
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
  pais_id_pje?: number;
  pais_codigo?: string;
  pais_descricao?: string;
  cep?: string;
  classificacoes_endereco?: ClassificacaoEndereco[];
  correspondencia?: boolean;
  situacao?: SituacaoEndereco;
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
  pais_id_pje?: number;
  pais_codigo?: string;
  pais_descricao?: string;
  cep?: string;
  classificacoes_endereco?: ClassificacaoEndereco[];
  correspondencia?: boolean;
  situacao?: SituacaoEndereco;
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

  // Busca textual
  busca?: string; // Busca em logradouro, bairro, municipio, estado

  // Filtros específicos
  municipio?: string;
  estado_sigla?: string;
  pais_codigo?: string;
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
 * Parâmetros para definir endereço como principal
 */
export interface DefinirEnderecoPrincipalParams {
  id: number;
  entidade_tipo: EntidadeTipoEndereco;
  entidade_id: number;
}
