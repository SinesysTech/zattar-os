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
export type StatusAudiencia = 'M' | 'F' | 'C'; // M=Designada, F=Realizada, C=Cancelada

/**
 * Registro de audiência completo baseado no schema do banco
 */
export interface Audiencia {
  id: number;
  id_pje: number;
  advogado_id: number;
  processo_id: number;
  orgao_julgador_id: number | null;
  orgao_julgador_descricao: string | null; // Descrição do órgão julgador via JOIN
  trt: string;
  grau: GrauAudiencia;
  numero_processo: string;
  classe_judicial: string | null; // Descrição da classe judicial via JOIN
  classe_judicial_id: number | null; // FK para classe_judicial
  data_inicio: string; // ISO timestamp
  data_fim: string; // ISO timestamp
  sala_audiencia_nome: string | null; // Cache desnormalizado (histórico)
  sala_audiencia_id: number | null; // FK para sala_audiencia
  status: string;
  status_descricao: string | null;
  tipo_audiencia_id: number | null; // FK para tipo_audiencia
  tipo_descricao: string | null; // Via JOIN com tipo_audiencia
  tipo_codigo: string | null; // Via JOIN com tipo_audiencia
  tipo_is_virtual: boolean; // Via JOIN com tipo_audiencia
  designada: boolean;
  em_andamento: boolean;
  documento_ativo: boolean;
  polo_ativo_nome: string | null;
  polo_passivo_nome: string | null;
  url_audiencia_virtual: string | null;
  endereco_presencial: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    pais?: string;
    cep?: string;
  } | null;
  responsavel_id: number | null;
  observacoes: string | null;
  dados_anteriores: Record<string, unknown> | null; // jsonb
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

/**
 * Parâmetros para criar uma nova audiência manualmente
 */
export interface CriarAudienciaParams {
  processo_id: number;
  advogado_id: number;
  data_inicio: string; // ISO timestamp
  data_fim: string; // ISO timestamp
  tipo_audiencia_id?: number;
  sala_audiencia_id?: number;
  url_audiencia_virtual?: string;
  endereco_presencial?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    pais?: string;
    cep?: string;
  };
  observacoes?: string;
  responsavel_id?: number;
}

