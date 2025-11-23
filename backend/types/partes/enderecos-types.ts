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
  trt: string;
  grau: GrauEndereco;
  numero_processo: string;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  estado: string | null;
  pais: string | null;
  cep: string | null;
  classificacoes_endereco: ClassificacaoEndereco[] | null; // JSONB array
  correspondencia: boolean | null;
  situacao: SituacaoEndereco | null;
  dados_pje_completo: Record<string, unknown> | null; // JSONB
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
  trt: string;
  grau: GrauEndereco;
  numero_processo: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  estado?: string;
  pais?: string;
  cep?: string;
  classificacoes_endereco?: ClassificacaoEndereco[];
  correspondencia?: boolean;
  situacao?: SituacaoEndereco;
  dados_pje_completo?: Record<string, unknown>;
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
  grau?: GrauEndereco;
  numero_processo?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  estado?: string;
  pais?: string;
  cep?: string;
  classificacoes_endereco?: ClassificacaoEndereco[];
  correspondencia?: boolean;
  situacao?: SituacaoEndereco;
  dados_pje_completo?: Record<string, unknown>;
}

/**
 * Campos disponíveis para ordenação
 */
export type OrdenarPorEndereco =
  | 'logradouro'
  | 'municipio'
  | 'estado'
  | 'cep'
  | 'correspondencia'
  | 'situacao'
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

  // Filtros básicos
  trt?: string;
  grau?: GrauEndereco;
  numero_processo?: string;

  // Busca textual
  busca?: string; // Busca em logradouro, bairro, municipio, estado

  // Filtros específicos
  municipio?: string;
  estado?: string;
  pais?: string;
  cep?: string;
  correspondencia?: boolean;
  situacao?: SituacaoEndereco;

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
