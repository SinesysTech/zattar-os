/**
 * CAPTURA DOMAIN - Entidades e Interfaces Genéricas
 *
 * Interfaces genéricas que funcionam para qualquer tribunal/sistema judicial.
 * Não contém lógica específica de TRT, TJSP, etc.
 */

import type { TipoAcessoTribunal } from '@/backend/types/captura/trt-types';
import type { GrauProcesso } from '@/types/domain/common';

// =============================================================================
// INTERFACES GENÉRICAS
// =============================================================================

/**
 * Credenciais de acesso a um tribunal
 */
export interface Credencial {
  cpf: string;
  senha: string;
}

/**
 * Timeouts customizados para um tribunal específico
 */
export interface CustomTimeouts {
  login?: number; // Timeout para login SSO (ms)
  redirect?: number; // Timeout para redirects (ms)
  networkIdle?: number; // Timeout para página estabilizar (ms)
  api?: number; // Timeout para chamadas de API (ms)
}

/**
 * Configuração de um tribunal vinda do banco (tribunais_config)
 */
export interface ConfigTribunal {
  tribunalId: string;
  sistema: string; // 'PJE', 'ESAJ', 'EPROC', 'PROJUDI'
  tipoAcesso: TipoAcessoTribunal;
  loginUrl: string;
  baseUrl: string;
  apiUrl: string;
  customTimeouts?: CustomTimeouts;
}

/**
 * Processo capturado (formato genérico)
 */
export interface ProcessoCapturado {
  idPje: number;
  numeroProcesso: string;
  classeJudicial: string;
  orgaoJulgador: string;
  parteAutora: string;
  parteRe: string;
  dataAutuacao: string;
  status: string;
  // Campos adicionais podem ser incluídos conforme necessário
}

/**
 * Audiência capturada
 */
export interface AudienciaCapturada {
  idProcesso: number;
  numeroProcesso: string;
  dataAudiencia: string;
  tipoAudiencia: string;
  situacao: string;
  sala?: string;
}

/**
 * Movimentação capturada (timeline)
 */
export interface MovimentacaoCapturada {
  idProcesso: number;
  numeroProcesso: string;
  dataMovimentacao: string;
  tipoMovimentacao: string;
  descricao: string;
  dadosCompletos?: Record<string, unknown>;
}

/**
 * Período para buscar audiências
 */
export interface PeriodoAudiencias {
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
}

/**
 * Parâmetros para buscar processos
 */
export interface BuscarProcessosParams {
  tipo: TipoCaptura;
  periodo?: PeriodoAudiencias;
  filtros?: Record<string, unknown>;
}

/**
 * Tipo de captura
 */
export type TipoCaptura =
  | 'audiencias_designadas'
  | 'audiencias_realizadas'
  | 'audiencias_canceladas'
  | 'expedientes_no_prazo'
  | 'expedientes_sem_prazo'
  | 'acervo_geral'
  | 'arquivados';

/**
 * Resultado de uma captura
 */
export interface ResultadoCaptura {
  processos: ProcessoCapturado[];
  audiencias?: AudienciaCapturada[];
  movimentacoes?: MovimentacaoCapturada[];
  metadados: {
    tribunal: string;
    sistema: string;
    grau: GrauProcesso;
    dataCaptura: string;
    duracaoMs: number;
  };
}

/**
 * Sistema judicial suportado
 */
export type SistemaJudicialSuportado = 'PJE' | 'ESAJ' | 'EPROC' | 'PROJUDI';
