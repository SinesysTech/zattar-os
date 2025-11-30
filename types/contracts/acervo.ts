import type {
  Acervo,
  AgrupamentoAcervo,
  ProcessoUnificado,
  OrigemAcervo,
} from '@/types/domain/acervo';
import type { GrauProcesso } from '@/types/domain/common';

/**
 * Campos disponíveis para ordenação de acervos.
 */
export type OrdenarPorAcervo =
  | 'data_autuacao'
  | 'numero_processo'
  | 'nome_parte_autora'
  | 'nome_parte_re'
  | 'data_arquivamento'
  | 'data_proxima_audiencia'
  | 'prioridade_processual'
  | 'created_at'
  | 'updated_at';

/**
 * Critérios para agrupar processos do acervo.
 */
export type AgruparPorAcervo =
  | 'trt'
  | 'grau'
  | 'origem'
  | 'responsavel_id'
  | 'classe_judicial'
  | 'codigo_status_processo'
  | 'orgao_julgador'
  | 'mes_autuacao'
  | 'ano_autuacao';

/**
 * Direção da ordenação (ascendente ou descendente).
 */
export type OrdemAcervo = 'asc' | 'desc';

/**
 * Parâmetros para a operação de listar processos do acervo.
 * Define filtros, paginação, ordenação e agrupamento.
 */
export interface ListarAcervoParams {
  pagina?: number;
  limite?: number;
  unified?: boolean;
  origem?: OrigemAcervo;
  trt?: string;
  grau?: GrauProcesso;
  responsavel_id?: number | 'null';
  sem_responsavel?: boolean;
  busca?: string;
  numero_processo?: string;
  nome_parte_autora?: string;
  nome_parte_re?: string;
  descricao_orgao_julgador?: string;
  classe_judicial?: string;
  codigo_status_processo?: string;
  segredo_justica?: boolean;
  juizo_digital?: boolean;
  tem_associacao?: boolean;
  data_autuacao_inicio?: string;
  data_autuacao_fim?: string;
  data_arquivamento_inicio?: string;
  data_arquivamento_fim?: string;
  data_proxima_audiencia_inicio?: string;
  data_proxima_audiencia_fim?: string;
  tem_proxima_audiencia?: boolean;
  ordenar_por?: OrdenarPorAcervo;
  ordem?: OrdemAcervo;
  agrupar_por?: AgruparPorAcervo;
  incluir_contagem?: boolean;
}

/**
 * Resultado da operação de listar processos do acervo (sem agrupamento).
 */
export interface ListarAcervoResult {
  processos: Acervo[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Resultado da operação de listar processos do acervo com agrupamento.
 */
export interface ListarAcervoAgrupadoResult {
  agrupamentos: AgrupamentoAcervo[];
  total: number;
}

/**
 * Resultado da operação de listar processos de forma unificada.
 */
export interface ListarAcervoUnificadoResult {
  processos: ProcessoUnificado[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}
