// Tipos e interfaces para o serviço de audiências

import type { GrauAcervo } from '@/backend/types/acervo/types';

/**
 * Grau do processo (mesmo tipo do acervo)
 */
export type GrauAudiencia = GrauAcervo;

/**
 * Campos disponíveis para ordenação
 */
export type OrdenarPorAudiencia =
  | 'data_inicio'
  | 'data_fim'
  | 'numero_processo'
  | 'polo_ativo_nome'
  | 'polo_passivo_nome'
  | 'status'
  | 'tipo_descricao'
  | 'created_at'
  | 'updated_at';

/**
 * Direção da ordenação
 */
export type OrdemAudiencia = 'asc' | 'desc';

/**
 * Status da audiência
 */
export type StatusAudiencia = 'M' | 'R' | 'C'; // M=Marcada, R=Realizada, C=Cancelada

/**
 * Registro de audiência completo baseado no schema do banco
 */
export interface Audiencia {
  id: number;
  id_pje: number;
  advogado_id: number;
  processo_id: number;
  orgao_julgador_id: number | null;
  trt: string;
  grau: GrauAudiencia;
  numero_processo: string;
  data_inicio: string; // ISO timestamp
  data_fim: string; // ISO timestamp
  sala_audiencia_nome: string | null;
  sala_audiencia_id: number | null;
  status: string;
  status_descricao: string | null;
  tipo_id: number | null;
  tipo_descricao: string | null;
  tipo_codigo: string | null;
  tipo_is_virtual: boolean;
  designada: boolean;
  em_andamento: boolean;
  documento_ativo: boolean;
  polo_ativo_nome: string | null;
  polo_ativo_cpf: string | null;
  polo_passivo_nome: string | null;
  polo_passivo_cnpj: string | null;
  url_audiencia_virtual: string | null;
  hora_inicial: string | null; // Time format HH:mm:ss
  hora_final: string | null; // Time format HH:mm:ss
  responsavel_id: number | null; // Adicionado via join com acervo
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Parâmetros para listar audiências
 */
export interface ListarAudienciasParams {
  // Paginação
  pagina?: number;
  limite?: number;

  // Filtros básicos
  trt?: string;
  grau?: GrauAudiencia;
  responsavel_id?: number | 'null'; // 'null' string para audiências sem responsável
  sem_responsavel?: boolean;

  // Busca textual
  busca?: string; // Busca em numero_processo, polo_ativo_nome, polo_passivo_nome

  // Filtros específicos
  numero_processo?: string;
  polo_ativo_nome?: string;
  polo_passivo_nome?: string;
  status?: StatusAudiencia | string; // Aceita string para flexibilidade
  tipo_descricao?: string;
  tipo_codigo?: string;
  tipo_is_virtual?: boolean;

  // Filtros de data
  data_inicio_inicio?: string; // ISO date
  data_inicio_fim?: string; // ISO date
  data_fim_inicio?: string; // ISO date
  data_fim_fim?: string; // ISO date

  // Ordenação
  ordenar_por?: OrdenarPorAudiencia;
  ordem?: OrdemAudiencia;
}

/**
 * Resultado da listagem
 */
export interface ListarAudienciasResult {
  audiencias: Audiencia[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

