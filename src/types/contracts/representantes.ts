// Contratos (DTOs e Parâmetros) para o módulo de Representantes

import type { Representante, InscricaoOAB } from '@/types/domain/representantes';
import type { Endereco } from '@/types/domain/enderecos';
import type { ProcessoRelacionado } from '@/types/domain/processo-relacionado';

// Re-export InscricaoOAB para uso em outros módulos
export type { InscricaoOAB };

/**
 * Campos disponíveis para ordenação de representantes.
 */
export type OrdenarPorRepresentante =
  | 'nome'
  | 'cpf'
  | 'created_at';

export type OrdemRepresentante = 'asc' | 'desc';

/**
 * Parâmetros para criar um novo representante.
 */
export interface CriarRepresentanteParams {
  cpf: string;
  nome: string;
  sexo?: string | null;
  tipo?: string | null;
  /** Array de inscrições na OAB */
  oabs?: InscricaoOAB[];
  emails?: string[] | null;
  email?: string | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  endereco_id?: number | null;
  dados_anteriores?: Record<string, unknown> | null;
}

/**
 * Parâmetros para atualizar um representante existente.
 */
export interface AtualizarRepresentanteParams {
  id: number;
  cpf?: string;
  nome?: string;
  sexo?: string | null;
  tipo?: string | null;
  /** Array de inscrições na OAB */
  oabs?: InscricaoOAB[];
  emails?: string[] | null;
  email?: string | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_residencial?: string | null;
  numero_residencial?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  endereco_id?: number | null;
  dados_anteriores?: Record<string, unknown> | null;
}

/**
 * Parâmetros para listar representantes com filtros e paginação.
 */
export interface ListarRepresentantesParams {
  pagina?: number;
  limite?: number;
  nome?: string;
  cpf?: string;
  /** Busca por número da OAB (em qualquer UF) */
  oab?: string;
  /** Filtra por UF da OAB */
  uf_oab?: string;
  busca?: string;
  ordenar_por?: OrdenarPorRepresentante;
  ordem?: 'asc' | 'desc';
}

/**
 * Resultado da listagem de representantes.
 */
export interface ListarRepresentantesResult {
  representantes: Representante[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Parâmetros para buscar representantes por número OAB.
 */
export interface BuscarRepresentantesPorOABParams {
  /** Número da OAB (com ou sem UF, ex: "MG128404" ou "128404") */
  oab: string;
  /** UF opcional para filtrar */
  uf?: string;
}

/**
 * Parâmetros para upsert (inserir ou atualizar) um representante por CPF.
 */
export interface UpsertRepresentantePorCPFParams extends CriarRepresentanteParams {
  cpf: string;
}

/**
 * Parâmetros para buscar um representante por CPF.
 */
export interface BuscarRepresentantePorCPFParams {
  cpf: string;
}

/**
 * Resultado padrão para operações de criação/atualização de representante.
 */
export interface OperacaoRepresentanteResult {
  sucesso: boolean;
  representante?: Representante;
  erro?: string;
}

/**
 * Representante com seu endereço populado.
 */
export interface RepresentanteComEndereco extends Representante {
  endereco?: Endereco | null;
}

/**
 * Representante com processos relacionados populados.
 */
export interface RepresentanteComProcessos extends Representante {
  processos_relacionados: ProcessoRelacionado[];
}

/**
 * Representante com endereço e processos relacionados populados.
 */
export interface RepresentanteComEnderecoEProcessos extends RepresentanteComEndereco {
  processos_relacionados: ProcessoRelacionado[];
}
