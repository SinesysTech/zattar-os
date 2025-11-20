/**
 * Serviço de captura de timeline de processos do PJE-TRT
 * 
 * Responsabilidades:
 * 1. Autenticar no PJE
 * 2. Obter timeline completa do processo
 * 3. Filtrar documentos assinados
 * 4. Baixar PDFs dos documentos
 * 5. Retornar timeline + documentos baixados
 */

import type { Page } from 'playwright';
import { autenticarPJE, type AuthResult } from '../trt/trt-auth.service';
import { getTribunalConfig } from '../trt/config';
import { obterTimeline, obterDocumento, baixarDocumento } from '@/backend/api/pje-trt/timeline';
import type { 
  TimelineResponse, 
  TimelineItem, 
  DocumentoDetalhes,
  FiltroDocumentosTimeline 
} from '@/backend/types/pje-trt/timeline';
import type { TRTCodigo, Grau } from '@/backend/types/captura/config';

/**
 * Parâmetros para captura de timeline
 */
export interface CapturaTimelineParams {
  /** Código do TRT (ex: 'TRT3') */
  trtCodigo: TRTCodigo;
  /** Grau da instância */
  grau: Grau;
  /** ID do processo no PJE */
  processoId: string;
  /** ID do advogado (para obter credenciais) */
  advogadoId: number;
  /** Baixar PDFs dos documentos assinados */
  baixarDocumentos?: boolean;
  /** Filtro para documentos */
  filtroDocumentos?: FiltroDocumentosTimeline;
}

/**
 * Documento baixado
 */
export interface DocumentoBaixado {
  /** Detalhes do documento */
  detalhes: DocumentoDetalhes;
  /** Buffer do PDF (se foi baixado) */
  pdf?: Buffer;
  /** Erro ao baixar (se houver) */
  erro?: string;
}

/**
 * Resultado da captura de timeline
 */
export interface CapturaTimelineResult {
  /** Timeline completa */
  timeline: TimelineResponse;
  /** Total de itens na timeline */
  totalItens: number;
  /** Total de documentos */
  totalDocumentos: number;
  /** Total de movimentos */
  totalMovimentos: number;
  /** Documentos filtrados e baixados */
  documentosBaixados: DocumentoBaixado[];
  /** Total de documentos baixados com sucesso */
  totalBaixadosSucesso: number;
  /** Total de erros ao baixar */
  totalErros: number;
}

/**
 * Filtra documentos da timeline com base nos critérios
 */
function filtrarDocumentos(
  timeline: TimelineResponse,
  filtro: FiltroDocumentosTimeline = {}
): TimelineItem[] {
  const {
    apenasAssinados = true,
    apenasNaoSigilosos = true,
    tipos = [],
    dataInicial,
    dataFinal,
  } = filtro;

  return timeline.filter((item) => {
    // Apenas documentos (não movimentos)
    if (!item.documento) return false;

    // Filtro: apenas assinados
    if (apenasAssinados && !item.idSignatario) return false;

    // Filtro: apenas não sigilosos
    if (apenasNaoSigilosos && item.documentoSigiloso) return false;

    // Filtro: tipos específicos
    if (tipos.length > 0 && item.tipo && !tipos.includes(item.tipo)) return false;

    // Filtro: data inicial
    if (dataInicial && item.data < dataInicial) return false;

    // Filtro: data final
    if (dataFinal && item.data > dataFinal) return false;

    return true;
  });
}

/**
 * Captura a timeline de um processo do PJE-TRT
 */
export async function capturarTimeline(
  params: CapturaTimelineParams
): Promise<CapturaTimelineResult> {
  const {
    trtCodigo,
    grau,
    processoId,
    advogadoId,
    baixarDocumentos = true,
    filtroDocumentos = {},
  } = params;

  console.log('📋 [capturarTimeline] Iniciando captura', {
    trtCodigo,
    grau,
    processoId,
    advogadoId,
    baixarDocumentos,
  });

  let authResult: AuthResult | null = null;

  try {
    // 1. Obter configuração do tribunal
    const config = getTribunalConfig(trtCodigo, grau);
    if (!config) {
      throw new Error(`Configuração não encontrada para ${trtCodigo} - ${grau}`);
    }

    // 2. Obter credenciais do advogado
    // TODO: Implementar getCredenciais quando necessário
    // Por enquanto, usar credenciais padrão
    const cpf = '07529294610';
    const senha = '12345678A@';

    console.log('🔑 [capturarTimeline] Autenticando...');

    // 3. Autenticar no PJE
    authResult = await autenticarPJE({
      credential: { cpf, senha },
      config,
      headless: true,
    });

    const { page } = authResult;

    console.log('✅ [capturarTimeline] Autenticado com sucesso');

    // 4. Obter timeline completa
    console.log('📥 [capturarTimeline] Obtendo timeline...');
    const timeline = await obterTimeline(page, processoId, {
      somenteDocumentosAssinados: false, // Obter tudo, filtrar depois
      buscarMovimentos: true,
      buscarDocumentos: true,
    });

    const totalItens = timeline.length;
    const totalDocumentos = timeline.filter((item) => item.documento).length;
    const totalMovimentos = timeline.filter((item) => !item.documento).length;

    console.log('✅ [capturarTimeline] Timeline obtida', {
      totalItens,
      totalDocumentos,
      totalMovimentos,
    });

    // 5. Filtrar documentos
    const documentosFiltrados = filtrarDocumentos(timeline, filtroDocumentos);

    console.log('🔍 [capturarTimeline] Documentos filtrados', {
      total: documentosFiltrados.length,
      filtros: filtroDocumentos,
    });

    // 6. Baixar documentos (se solicitado)
    const documentosBaixados: DocumentoBaixado[] = [];
    let totalBaixadosSucesso = 0;
    let totalErros = 0;

    if (baixarDocumentos && documentosFiltrados.length > 0) {
      console.log('📥 [capturarTimeline] Iniciando download de documentos...');

      for (const itemTimeline of documentosFiltrados) {
        const documentoId = String(itemTimeline.id);

        try {
          console.log(`📄 [capturarTimeline] Baixando documento ${documentoId}...`);

          // Obter detalhes do documento
          const detalhes = await obterDocumento(page, processoId, documentoId, {
            incluirAssinatura: true,
            incluirAnexos: false,
            grau: grau === 'primeiro_grau' ? 1 : 2,
          });

          // Baixar PDF
          const pdf = await baixarDocumento(page, processoId, documentoId, {
            incluirCapa: false,
            incluirAssinatura: true,
            grau: grau === 'primeiro_grau' ? 1 : 2,
          });

          documentosBaixados.push({
            detalhes,
            pdf,
          });

          totalBaixadosSucesso++;

          console.log(`✅ [capturarTimeline] Documento ${documentoId} baixado`, {
            titulo: detalhes.titulo,
            tamanho: pdf.length,
          });
        } catch (error) {
          const mensagemErro = error instanceof Error ? error.message : String(error);

          console.error(`❌ [capturarTimeline] Erro ao baixar documento ${documentoId}:`, mensagemErro);

          documentosBaixados.push({
            detalhes: {
              id: itemTimeline.id,
              titulo: itemTimeline.titulo,
            } as DocumentoDetalhes,
            erro: mensagemErro,
          });

          totalErros++;
        }

        // Delay entre downloads para não sobrecarregar
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log('✅ [capturarTimeline] Downloads concluídos', {
        sucesso: totalBaixadosSucesso,
        erros: totalErros,
      });
    }

    // 7. Retornar resultado
    const resultado: CapturaTimelineResult = {
      timeline,
      totalItens,
      totalDocumentos,
      totalMovimentos,
      documentosBaixados,
      totalBaixadosSucesso,
      totalErros,
    };

    console.log('✅ [capturarTimeline] Captura concluída com sucesso');

    return resultado;
  } catch (error) {
    console.error('❌ [capturarTimeline] Erro durante captura:', error);
    throw error;
  } finally {
    // Limpar recursos
    if (authResult?.browser) {
      await authResult.browser.close();
      console.log('🔒 [capturarTimeline] Navegador fechado');
    }
  }
}
