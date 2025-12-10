/**
 * CAPTURA DOMAIN - Entidades e Interfaces Genéricas
 */

import type { TipoAcessoTribunal } from '@/backend/types/captura/trt-types';
import type { GrauProcesso } from '@/core/partes';

// =============================================================================
// INTERFACES GENÉRICAS
// =============================================================================

export interface Credencial {
  cpf: string;
  senha: string;
}

export interface CustomTimeouts {
  login?: number;
  redirect?: number;
  networkIdle?: number;
  api?: number;
}

export interface ConfigTribunal {
  tribunalId: string;
  sistema: string;
  tipoAcesso: TipoAcessoTribunal;
  loginUrl: string;
  baseUrl: string;
  apiUrl: string;
  customTimeouts?: CustomTimeouts;
  tribunalCodigo?: string;
  tribunalNome?: string;
}

export interface ProcessoCapturado {
  idPje: number;
  numeroProcesso: string;
  classeJudicial: string;
  orgaoJulgador: string;
  parteAutora: string;
  parteRe: string;
  dataAutuacao: string;
  status: string;
}

export interface AudienciaCapturada {
  idProcesso: number;
  numeroProcesso: string;
  dataAudiencia: string;
  tipoAudiencia: string;
  situacao: string;
  sala?: string;
}

export interface MovimentacaoCapturada {
  idProcesso: number;
  numeroProcesso: string;
  dataMovimentacao: string;
  tipoMovimentacao: string;
  descricao: string;
  dadosCompletos?: Record<string, unknown>;
}

export interface PeriodoAudiencias {
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
}

export interface BuscarProcessosParams {
  tipo: TipoCaptura;
  periodo?: PeriodoAudiencias;
  filtros?: Record<string, unknown>;
}

export type TipoCaptura =
  | 'audiencias_designadas'
  | 'audiencias_realizadas'
  | 'audiencias_canceladas'
  | 'expedientes_no_prazo'
  | 'expedientes_sem_prazo'
  | 'acervo_geral'
  | 'arquivados';

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

export type SistemaJudicialSuportado = 'PJE' | 'ESAJ' | 'EPROC' | 'PROJUDI';

// =============================================================================
// FUNÇÕES UTILITÁRIAS
// =============================================================================

export function mapearTipoAcessoParaGrau(tipoAcesso: TipoAcessoTribunal): GrauProcesso {
  switch (tipoAcesso) {
    case 'primeiro_grau':
      return 'primeiro_grau';
    case 'segundo_grau':
      return 'segundo_grau';
    case 'unificado':
      return 'primeiro_grau';
    case 'unico':
      return 'tribunal_superior';
    default:
      return 'primeiro_grau';
  }
}

export function mapearTipoCapturaParaOrigem(tipoCaptura: TipoCaptura): 'acervo_geral' | 'arquivado' {
  switch (tipoCaptura) {
    case 'acervo_geral':
      return 'acervo_geral';
    case 'arquivados':
      return 'arquivado';
    default:
      return 'acervo_geral';
  }
}
