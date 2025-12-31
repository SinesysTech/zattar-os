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

import { autenticarPJE, type AuthResult } from '../trt/trt-auth.service';
import { getTribunalConfig } from '../trt/config';
import type { CodigoTRT, GrauTRT } from '../trt/types';
import type { ConfigTRT } from '../../types/trt-types';
import { obterTimeline, obterDocumento, baixarDocumento } from '@/features/captura/pje-trt/timeline';
import { uploadDocumentoTimeline } from '../backblaze/upload-documento-timeline.service';
import { salvarTimeline, salvarTimelineNoMongoDB, atualizarTimelineMongoIdNoAcervo } from './timeline-persistence.service';
import type {
  TimelineResponse,
  TimelineItem,
  DocumentoDetalhes,
  FiltroDocumentosTimeline,
  TimelineItemEnriquecido,
  BackblazeB2Info,
} from '@/types/contracts/pje-trt';

/**
 * Parâmetros para captura de timeline
 */
export interface CapturaTimelineParams {
  /** Código do TRT (ex: 'TRT3') */
  trtCodigo: CodigoTRT;
  /** Grau da instância */
  grau: GrauTRT;
  /** ID do processo no PJE */
  processoId: string;
  /** Número do processo (ex: 0010702-80.2025.5.03.0111) */
  numeroProcesso: string;
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
  /** ID do documento MongoDB (se salvo) */
  mongoId?: string;
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
    numeroProcesso,
    advogadoId,
    baixarDocumentos = true,
    filtroDocumentos = {},
  } = params;

  console.log('📋 [capturarTimeline] Iniciando captura', {
    trtCodigo,
    grau,
    processoId,
    numeroProcesso,
    advogadoId,
    baixarDocumentos,
  });

  let authResult: AuthResult | null = null;

  try {
    // 1. Obter configuração do tribunal
    let config: ConfigTRT;
    try {
      config = await getTribunalConfig(trtCodigo, grau);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ [capturarTimeline] Erro ao obter configuração do tribunal: ${errorMessage}`);
      throw new Error(
        `Configuração do tribunal não encontrada para ${trtCodigo} (${grau}). ` +
        `Verifique se existe registro na tabela tribunais_config. Erro original: ${errorMessage}`
      );
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
    const timelineEnriquecida: TimelineItemEnriquecido[] = [...timeline];

    if (baixarDocumentos && documentosFiltrados.length > 0) {
      console.log('📥 [capturarTimeline] Iniciando download de documentos...');

      for (let i = 0; i < documentosFiltrados.length; i++) {
        const itemTimeline = documentosFiltrados[i];
        const documentoId = String(itemTimeline.id);

        try {
          console.log(`📄 [capturarTimeline] Baixando documento ${i + 1}/${documentosFiltrados.length}: ${documentoId}...`);

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

          // Upload para Backblaze B2
          const backblazeResult = await uploadDocumentoTimeline({
            pdfBuffer: pdf,
            numeroProcesso,
            documentoId,
          });

          // Enriquecer item da timeline com informações do Backblaze B2
          const backblazeInfo: BackblazeB2Info = {
            url: backblazeResult.url,
            key: backblazeResult.key,
            bucket: backblazeResult.bucket,
            fileName: backblazeResult.fileName,
            uploadedAt: backblazeResult.uploadedAt,
          };

          // Encontrar o item na timeline enriquecida e adicionar backblaze
          const indexNaTimeline = timelineEnriquecida.findIndex(item => item.id === itemTimeline.id);
          if (indexNaTimeline !== -1) {
            timelineEnriquecida[indexNaTimeline] = {
              ...timelineEnriquecida[indexNaTimeline],
              backblaze: backblazeInfo,
            };
          }

          documentosBaixados.push({
            detalhes,
            pdf,
          });

          totalBaixadosSucesso++;

          console.log(`✅ [capturarTimeline] Documento ${documentoId} baixado e enviado para Backblaze B2`, {
            titulo: detalhes.titulo,
            tamanho: pdf.length,
            url: backblazeResult.url,
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

    // 7. Salvar timeline enriquecida no PostgreSQL
    let mongoId: string | undefined;

    try {
      const persistenceResult = await salvarTimeline({
        processoId,
        trtCodigo,
        grau,
        timeline: timelineEnriquecida,
        advogadoId,
      });

      mongoId = persistenceResult.mongoId; // Temporário, será removido na Fase 6

      console.log(`🏛️ [capturarTimeline] Timeline salva no PostgreSQL (JSONB)`, {
        totalItens: persistenceResult.totalItens,
      });

    } catch (error) {
      console.error('❌ [capturarTimeline] Erro ao salvar no PostgreSQL:', error);
      // Não falhar a captura por erro de persistência, apenas logar
    }

    // 9. Retornar resultado
    const resultado: CapturaTimelineResult = {
      timeline,
      totalItens,
      totalDocumentos,
      totalMovimentos,
      documentosBaixados,
      totalBaixadosSucesso,
      totalErros,
      mongoId,
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
