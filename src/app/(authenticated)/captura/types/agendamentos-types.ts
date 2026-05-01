/**
 * Tipos para gerenciamento de agendamentos de captura
 */

import type { TipoCaptura } from '../types';

/**
 * Tipo de periodicidade do agendamento
 */
export type Periodicidade = 'diario' | 'a_cada_N_dias' | 'a_cada_N_horas';

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
    // Audiências: período fixo (YYYY-MM-DD) ou relativo ao dia de execução
    dataInicio?: string;
    dataFim?: string;
    dataRelativa?: 'hoje'; // quando 'hoje', usa a data do dia de execução para dataInicio e dataFim
    codigoSituacao?: 'M' | 'C' | 'F'; // M = marcada, C = cancelada, F = realizada (ata)
    // Pendentes
    filtroPrazo?: 'no_prazo' | 'sem_prazo'; // filtro único (legado)
    filtrosPrazo?: Array<'no_prazo' | 'sem_prazo'>; // múltiplos filtros
    // Janela de execução para periodicidade horária (HH:mm Brasília)
    // Fora dessa janela, proxima_execucao pula para inicio do dia seguinte
    janela_execucao?: {
      inicio: string; // ex: '09:00'
      fim: string;    // ex: '18:00'
    };
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
    dataRelativa?: 'hoje';
    codigoSituacao?: 'M' | 'C' | 'F';
    filtroPrazo?: 'no_prazo' | 'sem_prazo';
    filtrosPrazo?: Array<'no_prazo' | 'sem_prazo'>;
    janela_execucao?: {
      inicio: string;
      fim: string;
    };
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
    dataRelativa?: 'hoje';
    codigoSituacao?: 'M' | 'C' | 'F';
    filtroPrazo?: 'no_prazo' | 'sem_prazo';
    filtrosPrazo?: Array<'no_prazo' | 'sem_prazo'>;
    janela_execucao?: {
      inicio: string;
      fim: string;
    };
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

