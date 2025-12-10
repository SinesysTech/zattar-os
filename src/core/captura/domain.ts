/**
 * CAPTURA DOMAIN - Entidades e Interfaces Genéricas
 *
 * Interfaces genéricas que funcionam para qualquer tribunal/sistema judicial.
 * Não contém lógica específica de TRT, TJSP, etc.
 */

import type { TipoAcessoTribunal } from '@/backend/types/captura/trt-types';
import type { GrauProcesso } from '@/core/partes';

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
  // Metadados adicionais (opcionais, preenchidos pela factory)
  tribunalCodigo?: string;
  tribunalNome?: string;
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

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

/**
 * Mapeia tipoAcesso para GrauProcesso
 * 
 * Centraliza a lógica de conversão entre tipo_acesso_tribunal e grau_processo
 * para manter consistência entre níveis lógicos.
 * 
 * @param tipoAcesso - Tipo de acesso ao tribunal
 * @returns Grau do processo correspondente
 */
export function mapearTipoAcessoParaGrau(tipoAcesso: TipoAcessoTribunal): GrauProcesso {
  switch (tipoAcesso) {
    case 'primeiro_grau':
      return 'primeiro_grau';
    case 'segundo_grau':
      return 'segundo_grau';
    case 'unificado':
      // Para acesso unificado, usar primeiro_grau como padrão
      // O sistema PJE permite navegar entre graus após autenticação
      return 'primeiro_grau';
    case 'unico':
      // Para acesso único (tribunais superiores), usar tribunal_superior
      return 'tribunal_superior';
    default:
      // Fallback seguro
      return 'primeiro_grau';
  }
}

/**
 * Mapeia tipoCaptura para origem do processo
 * 
 * Determina a origem do processo no acervo baseado no tipo de captura.
 * 
 * @param tipoCaptura - Tipo de captura executada
 * @returns Origem do processo no acervo
 */
export function mapearTipoCapturaParaOrigem(tipoCaptura: TipoCaptura): 'acervo_geral' | 'arquivado' {
  switch (tipoCaptura) {
    case 'acervo_geral':
      return 'acervo_geral';
    case 'arquivados':
      return 'arquivado';
    case 'audiencias_designadas':
    case 'audiencias_realizadas':
    case 'audiencias_canceladas':
    case 'expedientes_no_prazo':
    case 'expedientes_sem_prazo':
      // Todos os outros tipos de captura são considerados acervo geral
      return 'acervo_geral';
    default:
      return 'acervo_geral';
  }
}
