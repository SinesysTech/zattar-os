/**
 * Serviço de Recuperação de Capturas
 *
 * PROPÓSITO:
 * Fornece funções para listar, buscar e consultar logs de captura
 * armazenados no MongoDB para fins de recuperação e re-persistência.
 */

import { ObjectId, type Filter, type Sort } from 'mongodb';
import { getCapturaRawLogsCollection } from '@/backend/utils/mongodb/collections';
import type { CapturaRawLogDocument } from '@/backend/types/mongodb/captura-log';
import type {
  ListarLogsRecoveryParams,
  ListarLogsRecoveryResult,
  LogRecoverySumario,
} from './types';

// ============================================================================
// Constantes
// ============================================================================

const DEFAULT_LIMITE = 50;
const MAX_LIMITE = 100;

// ============================================================================
// Funções de Listagem
// ============================================================================

/**
 * Lista logs de captura do MongoDB com filtros e paginação
 *
 * @param params - Parâmetros de filtro e paginação
 * @returns Lista paginada de logs (sem payload_bruto para performance)
 */
export async function listarLogsRecovery(
  params: ListarLogsRecoveryParams = {}
): Promise<ListarLogsRecoveryResult> {
  const {
    pagina = 1,
    limite = DEFAULT_LIMITE,
    capturaLogId,
    tipoCaptura,
    status,
    trt,
    grau,
    advogadoId,
    dataInicio,
    dataFim,
  } = params;

  // Validar e ajustar limite
  const limiteAjustado = Math.min(Math.max(1, limite), MAX_LIMITE);
  const paginaAjustada = Math.max(1, pagina);
  const skip = (paginaAjustada - 1) * limiteAjustado;

  try {
    const collection = await getCapturaRawLogsCollection();

    // Construir filtro
    const filter: Filter<CapturaRawLogDocument> = {};

    if (capturaLogId !== undefined) {
      filter.captura_log_id = capturaLogId;
    }

    if (tipoCaptura) {
      filter.tipo_captura = tipoCaptura;
    }

    if (status) {
      filter.status = status;
    }

    if (trt) {
      filter.trt = trt;
    }

    if (grau) {
      filter.grau = grau;
    }

    if (advogadoId !== undefined) {
      filter.advogado_id = advogadoId;
    }

    // Filtro de período
    if (dataInicio || dataFim) {
      filter.criado_em = {};
      if (dataInicio) {
        filter.criado_em.$gte = new Date(dataInicio);
      }
      if (dataFim) {
        filter.criado_em.$lte = new Date(dataFim);
      }
    }

    // Contar total
    const total = await collection.countDocuments(filter);

    // Buscar documentos (sem payload_bruto para performance)
    const projection = {
      _id: 1,
      captura_log_id: 1,
      tipo_captura: 1,
      status: 1,
      trt: 1,
      grau: 1,
      advogado_id: 1,
      criado_em: 1,
      erro: 1,
      requisicao: 1,
      // Excluir campos pesados
      payload_bruto: 0,
      resultado_processado: 0,
      logs: 0,
    };

    const sort: Sort = { criado_em: -1 };

    const documentos = await collection
      .find(filter, { projection })
      .sort(sort)
      .skip(skip)
      .limit(limiteAjustado)
      .toArray();

    // Mapear para formato de sumário
    const logs: LogRecoverySumario[] = documentos.map((doc) => ({
      mongoId: doc._id!.toString(),
      capturaLogId: doc.captura_log_id,
      tipoCaptura: doc.tipo_captura,
      status: doc.status,
      trt: doc.trt,
      grau: doc.grau,
      advogadoId: doc.advogado_id,
      criadoEm: doc.criado_em,
      numeroProcesso: doc.requisicao?.numero_processo as string | undefined,
      processoIdPje: doc.requisicao?.processo_id_pje as number | undefined,
      erro: doc.erro,
    }));

    const totalPaginas = Math.ceil(total / limiteAjustado);

    return {
      logs,
      total,
      pagina: paginaAjustada,
      limite: limiteAjustado,
      totalPaginas,
    };
  } catch (error) {
    console.error('[CapturaRecovery] Erro ao listar logs:', error);
    throw new Error(
      `Erro ao listar logs de recovery: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

// ============================================================================
// Funções de Busca Individual
// ============================================================================

/**
 * Busca um log de captura pelo ID do MongoDB
 *
 * @param mongoId - ID do documento no MongoDB (ObjectId string)
 * @returns Documento completo ou null se não encontrado
 */
export async function buscarLogPorMongoId(
  mongoId: string
): Promise<CapturaRawLogDocument | null> {
  try {
    // Validar formato do ObjectId
    if (!ObjectId.isValid(mongoId)) {
      console.warn(`[CapturaRecovery] ID MongoDB inválido: ${mongoId}`);
      return null;
    }

    const collection = await getCapturaRawLogsCollection();
    const documento = await collection.findOne({ _id: new ObjectId(mongoId) });

    return documento;
  } catch (error) {
    console.error(`[CapturaRecovery] Erro ao buscar log ${mongoId}:`, error);
    throw new Error(
      `Erro ao buscar log: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

/**
 * Busca logs de captura por ID do log no PostgreSQL
 *
 * @param capturaLogId - ID do log na tabela capturas_log
 * @returns Array de documentos do MongoDB
 */
export async function buscarLogsPorCapturaLogId(
  capturaLogId: number
): Promise<CapturaRawLogDocument[]> {
  try {
    const collection = await getCapturaRawLogsCollection();
    const documentos = await collection
      .find({ captura_log_id: capturaLogId })
      .sort({ criado_em: -1 })
      .toArray();

    return documentos;
  } catch (error) {
    console.error(
      `[CapturaRecovery] Erro ao buscar logs para captura_log_id=${capturaLogId}:`,
      error
    );
    throw new Error(
      `Erro ao buscar logs: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

// ============================================================================
// Funções de Estatísticas
// ============================================================================

/**
 * Conta logs por status para um período específico
 *
 * @param params - Parâmetros de filtro
 * @returns Contadores por status
 */
export async function contarLogsPorStatus(params: {
  dataInicio?: string;
  dataFim?: string;
  tipoCaptura?: string;
  trt?: string;
}): Promise<{ success: number; error: number; total: number }> {
  try {
    const collection = await getCapturaRawLogsCollection();

    const matchStage: Record<string, unknown> = {};

    if (params.tipoCaptura) {
      matchStage.tipo_captura = params.tipoCaptura;
    }

    if (params.trt) {
      matchStage.trt = params.trt;
    }

    if (params.dataInicio || params.dataFim) {
      matchStage.criado_em = {};
      if (params.dataInicio) {
        (matchStage.criado_em as Record<string, Date>).$gte = new Date(params.dataInicio);
      }
      if (params.dataFim) {
        (matchStage.criado_em as Record<string, Date>).$lte = new Date(params.dataFim);
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          error: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ];

    const result = await collection.aggregate(pipeline).toArray();

    if (result.length > 0) {
      return {
        success: result[0].success,
        error: result[0].error,
        total: result[0].total,
      };
    }

    return { success: 0, error: 0, total: 0 };
  } catch (error) {
    console.error('[CapturaRecovery] Erro ao contar logs por status:', error);
    return { success: 0, error: 0, total: 0 };
  }
}

/**
 * Obtém estatísticas agregadas por TRT
 *
 * @param params - Parâmetros de filtro
 * @returns Estatísticas por TRT
 */
export async function estatisticasPorTrt(params: {
  dataInicio?: string;
  dataFim?: string;
  tipoCaptura?: string;
}): Promise<
  Array<{
    trt: string;
    total: number;
    success: number;
    error: number;
  }>
> {
  try {
    const collection = await getCapturaRawLogsCollection();

    const matchStage: Record<string, unknown> = {};

    if (params.tipoCaptura) {
      matchStage.tipo_captura = params.tipoCaptura;
    }

    if (params.dataInicio || params.dataFim) {
      matchStage.criado_em = {};
      if (params.dataInicio) {
        (matchStage.criado_em as Record<string, Date>).$gte = new Date(params.dataInicio);
      }
      if (params.dataFim) {
        (matchStage.criado_em as Record<string, Date>).$lte = new Date(params.dataFim);
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$trt',
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          error: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const result = await collection.aggregate(pipeline).toArray();

    return result.map((r) => ({
      trt: r._id as string,
      total: r.total as number,
      success: r.success as number,
      error: r.error as number,
    }));
  } catch (error) {
    console.error('[CapturaRecovery] Erro ao obter estatísticas por TRT:', error);
    return [];
  }
}

// ============================================================================
// Funções Auxiliares
// ============================================================================

/**
 * Verifica se um log possui payload_bruto disponível para re-processamento
 *
 * @param mongoId - ID do documento no MongoDB
 * @returns true se payload está disponível, false caso contrário
 */
export async function verificarPayloadDisponivel(mongoId: string): Promise<boolean> {
  try {
    if (!ObjectId.isValid(mongoId)) {
      return false;
    }

    const collection = await getCapturaRawLogsCollection();
    const documento = await collection.findOne(
      { _id: new ObjectId(mongoId) },
      { projection: { payload_bruto: 1 } }
    );

    return documento?.payload_bruto !== null && documento?.payload_bruto !== undefined;
  } catch (error) {
    console.error(`[CapturaRecovery] Erro ao verificar payload ${mongoId}:`, error);
    return false;
  }
}

/**
 * Extrai payload bruto de um documento MongoDB
 *
 * @param mongoId - ID do documento no MongoDB
 * @returns Payload bruto ou null se não disponível
 */
export async function extrairPayloadBruto(
  mongoId: string
): Promise<unknown | null> {
  try {
    const documento = await buscarLogPorMongoId(mongoId);
    return documento?.payload_bruto ?? null;
  } catch (error) {
    console.error(`[CapturaRecovery] Erro ao extrair payload ${mongoId}:`, error);
    return null;
  }
}

