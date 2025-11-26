/**
 * Serviço para buscar dados complementares de processos do PJE-TRT
 * 
 * Este serviço aproveita uma sessão autenticada para buscar múltiplos dados
 * de processos em sequência, otimizando o uso da conexão.
 * 
 * Dados complementares incluem:
 * - Timeline (movimentos e documentos)
 * - Partes (autores, réus, terceiros, representantes)
 */

import type { Page } from 'playwright';
import type { CodigoTRT, GrauTRT } from './types';
import type { TimelineResponse, TimelineItem } from '@/backend/types/pje-trt/timeline';
import type { PartePJE } from '@/backend/api/pje-trt/partes/types';
import { obterTimeline } from '@/backend/api/pje-trt/timeline/obter-timeline';
import { obterPartesProcesso } from '@/backend/api/pje-trt/partes';

/**
 * Configurações para busca de dados complementares
 */
export interface DadosComplementaresOptions {
  /** Buscar timeline (movimentos + documentos) */
  buscarTimeline?: boolean;
  /** Buscar partes do processo */
  buscarPartes?: boolean;
  /** Código do TRT */
  trt: CodigoTRT;
  /** Grau da instância */
  grau: GrauTRT;
  /** Delay entre requisições em ms (rate limiting) */
  delayEntreRequisicoes?: number;
  /** Callback para progresso */
  onProgress?: (atual: number, total: number, processoId: number) => void;
}

/**
 * Dados complementares de um processo
 */
export interface DadosComplementaresProcesso {
  processoId: number;
  timeline?: TimelineResponse;
  partes?: PartePJE[];
  payloadBrutoPartes?: Record<string, unknown> | null;
  erros: Array<{ tipo: 'timeline' | 'partes'; erro: string }>;
}

/**
 * Resultado da busca de dados complementares
 */
export interface DadosComplementaresResult {
  /** Dados por processo (Map: processoId -> dados) */
  porProcesso: Map<number, DadosComplementaresProcesso>;
  /** Resumo da operação */
  resumo: {
    totalProcessos: number;
    timelinesObtidas: number;
    partesObtidas: number;
    erros: number;
  };
  /** Lista de erros detalhados */
  errosDetalhados: Array<{ processoId: number; tipo: string; erro: string }>;
}

/**
 * Delay entre requisições
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Busca dados complementares de múltiplos processos
 * Faz chamadas em sequência com delay para evitar rate limiting
 * 
 * @param page - Página autenticada do Playwright
 * @param processosIds - Lista de IDs de processos únicos
 * @param options - Opções de busca
 * @returns Dados complementares de todos os processos
 */
export async function buscarDadosComplementaresProcessos(
  page: Page,
  processosIds: number[],
  options: DadosComplementaresOptions
): Promise<DadosComplementaresResult> {
  const {
    buscarTimeline = true,
    buscarPartes = true,
    delayEntreRequisicoes = 300,
    onProgress,
  } = options;

  const porProcesso = new Map<number, DadosComplementaresProcesso>();
  const errosDetalhados: Array<{ processoId: number; tipo: string; erro: string }> = [];

  let timelinesObtidas = 0;
  let partesObtidas = 0;

  console.log(`🔄 [DadosComplementares] Iniciando busca para ${processosIds.length} processos...`, {
    buscarTimeline,
    buscarPartes,
    delayEntreRequisicoes,
  });

  for (let i = 0; i < processosIds.length; i++) {
    const processoId = processosIds[i];
    
    // Callback de progresso
    if (onProgress) {
      onProgress(i + 1, processosIds.length, processoId);
    }

    // Log de progresso a cada 10 processos ou no primeiro/último
    if (i === 0 || i === processosIds.length - 1 || (i + 1) % 10 === 0) {
      console.log(`📊 [DadosComplementares] Progresso: ${i + 1}/${processosIds.length} processos`);
    }

    const dadosProcesso: DadosComplementaresProcesso = {
      processoId,
      erros: [],
    };

    // Buscar timeline
    if (buscarTimeline) {
      try {
        const timeline = await obterTimeline(page, String(processoId), {
          somenteDocumentosAssinados: false,
          buscarMovimentos: true,
          buscarDocumentos: true,
        });
        dadosProcesso.timeline = timeline;
        timelinesObtidas++;
      } catch (e) {
        const erro = e instanceof Error ? e.message : String(e);
        dadosProcesso.erros.push({ tipo: 'timeline', erro });
        errosDetalhados.push({ processoId, tipo: 'timeline', erro });
        console.warn(`⚠️ [DadosComplementares] Erro ao buscar timeline do processo ${processoId}: ${erro}`);
      }

      // Delay entre requisições
      await delay(delayEntreRequisicoes);
    }

    // Buscar partes
    if (buscarPartes) {
      try {
        const resultado = await obterPartesProcesso(page, processoId);
        dadosProcesso.partes = resultado.partes;
        dadosProcesso.payloadBrutoPartes = resultado.payloadBruto;
        partesObtidas++;
      } catch (e) {
        const erro = e instanceof Error ? e.message : String(e);
        dadosProcesso.erros.push({ tipo: 'partes', erro });
        errosDetalhados.push({ processoId, tipo: 'partes', erro });
        console.warn(`⚠️ [DadosComplementares] Erro ao buscar partes do processo ${processoId}: ${erro}`);
      }

      // Delay entre requisições
      await delay(delayEntreRequisicoes);
    }

    porProcesso.set(processoId, dadosProcesso);
  }

  const resumo = {
    totalProcessos: processosIds.length,
    timelinesObtidas,
    partesObtidas,
    erros: errosDetalhados.length,
  };

  console.log(`✅ [DadosComplementares] Busca concluída:`, resumo);

  return {
    porProcesso,
    resumo,
    errosDetalhados,
  };
}

/**
 * Extrai IDs únicos de processos de uma lista de audiências
 */
export function extrairProcessosUnicos(audiencias: Array<{ idProcesso: number }>): number[] {
  const idsUnicos = [...new Set(audiencias.map(a => a.idProcesso))];
  console.log(`📋 [DadosComplementares] ${idsUnicos.length} processos únicos extraídos de ${audiencias.length} audiências`);
  return idsUnicos;
}

/**
 * Filtra documentos assinados da timeline
 */
export function filtrarDocumentosAssinados(timeline: TimelineResponse): TimelineItem[] {
  if (!Array.isArray(timeline)) {
    return [];
  }
  
  return timeline.filter(item => {
    // Verifica se é documento e está assinado
    return item.documento && item.assinado;
  });
}

