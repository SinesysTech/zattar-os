/**
 * Tipos para gerenciamento de agendamentos de captura
 */

import type { TipoCaptura } from '@/backend/types/captura/capturas-log-types';

/**
 * Tipo de periodicidade do agendamento
 */
export type Periodicidade = 'diario' | 'a_cada_N_dias';

/**
 * Dados de um agendamento de captura
 */
export interface Agendamento {
  id: number;
  tipo_captura: TipoCaptura;
  advogado_id: number;
  credencial_ids: number[];
  periodicidade: Periodicidade;
  dias_intervalo: number | null; // Número de dias (usado quando periodicidade = 'a_cada_N_dias')
  horario: string; // HH:mm format
  ativo: boolean;
  parametros_extras: {
    dataInicio?: string; // Para audiências (YYYY-MM-DD)
    dataFim?: string; // Para audiências (YYYY-MM-DD)
    filtroPrazo?: 'no_prazo' | 'sem_prazo'; // Para pendentes
  } | null;
  ultima_execucao: string | null; // ISO timestamp
  proxima_execucao: string; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Dados para criar um novo agendamento
 */
export interface CriarAgendamentoParams {
  tipo_captura: TipoCaptura;
  advogado_id: number;
  credencial_ids: number[];
  periodicidade: Periodicidade;
  dias_intervalo?: number; // Obrigatório se periodicidade = 'a_cada_N_dias'
  horario: string; // HH:mm format
  ativo?: boolean; // Default: true
  parametros_extras?: {
    dataInicio?: string;
    dataFim?: string;
    filtroPrazo?: 'no_prazo' | 'sem_prazo';
  };
}

/**
 * Dados para atualizar um agendamento
 */
export interface AtualizarAgendamentoParams {
  tipo_captura?: TipoCaptura;
  advogado_id?: number;
  credencial_ids?: number[];
  periodicidade?: Periodicidade;
  dias_intervalo?: number | null;
  horario?: string;
  ativo?: boolean;
  parametros_extras?: {
    dataInicio?: string;
    dataFim?: string;
    filtroPrazo?: 'no_prazo' | 'sem_prazo';
  } | null;
}

/**
 * Parâmetros para listar agendamentos
 */
export interface ListarAgendamentosParams {
  pagina?: number;
  limite?: number;
  advogado_id?: number;
  tipo_captura?: TipoCaptura;
  ativo?: boolean;
  proxima_execucao_min?: string; // ISO date string
  proxima_execucao_max?: string; // ISO date string
  ordenar_por?: 'proxima_execucao' | 'created_at' | 'ultima_execucao';
  ordem?: 'asc' | 'desc';
}

