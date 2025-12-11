/**
 * Arquivo: timeline/obter-timeline.ts
 * 
 * PROPÓSITO:
 * Obtém a timeline (linha do tempo) completa de um processo no PJE.
 * A timeline contém movimentos processuais e documentos associados ao processo.
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório) - Instância da página do navegador autenticada no PJE
 * - processoId: string (obrigatório) - ID do processo no sistema PJE
 * - somenteDocumentosAssinados: boolean (opcional, padrão: true) - Retornar apenas documentos assinados
 * - buscarMovimentos: boolean (opcional, padrão: true) - Incluir movimentos na timeline
 * - buscarDocumentos: boolean (opcional, padrão: true) - Incluir documentos na timeline
 * 
 * RETORNO:
 * Promise<TimelineResponse> - Timeline completa do processo com movimentos e documentos
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/processos/id/{processoId}/timeline?somenteDocumentosAssinados={boolean}&buscarMovimentos={boolean}&buscarDocumentos={boolean}
 * 
 * EXEMPLO DE USO:
 * const timeline = await obterTimeline(page, '2887163', true, true, true);
 * console.log(`Movimentos: ${timeline.movimentos?.length || 0}`);
 * console.log(`Documentos: ${timeline.documentos?.length || 0}`);
 */

import type { Page } from 'playwright';
import { fetchPJEAPI } from '../shared/fetch';
import type { TimelineResponse, ObterTimelineOptions } from '@/lib/api/pje-trt/types';

/**
 * Função: obterTimeline
 * 
 * Obtém a timeline completa de um processo específico no PJE.
 */
export async function obterTimeline(
  page: Page,
  processoId: string,
  options: ObterTimelineOptions = {}
): Promise<TimelineResponse> {
  const {
    somenteDocumentosAssinados = true,
    buscarMovimentos = true,
    buscarDocumentos = true,
  } = options;

  const params = {
    somenteDocumentosAssinados,
    buscarMovimentos,
    buscarDocumentos,
  };

  console.log('🌐 [obterTimeline] Chamando API:', {
    endpoint: `/pje-comum-api/api/processos/id/${processoId}/timeline`,
    params,
  });

  try {
    const resultado = await fetchPJEAPI<TimelineResponse>(
      page,
      `/pje-comum-api/api/processos/id/${processoId}/timeline`,
      params
    );

    console.log('✅ [obterTimeline] Timeline recebida com sucesso');

    return resultado;
  } catch (error) {
    console.error('❌ [obterTimeline] Erro na chamada da API:', error);
    throw error;
  }
}
