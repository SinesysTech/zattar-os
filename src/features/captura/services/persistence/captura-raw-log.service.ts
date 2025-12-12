import type { CapturaRawLogCreate, CapturaRawLogDocument, StatusCapturaRaw } from '@/lib/types/captura-log';
import { getCapturaRawLogsCollection } from '@/lib/mongodb/collections';

export interface RegistrarCapturaRawLogParams extends Omit<CapturaRawLogCreate, 'status' | 'criado_em' | 'atualizado_em'> {
  status?: StatusCapturaRaw;
}

/**
 * Sanitiza um objeto para ser inserido no MongoDB
 * Remove tipos incompatíveis como BigInt, funções, símbolos
 * Converte BigInt para number ou string
 */
function sanitizarParaMongoDB<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // BigInt -> string (para não perder precisão)
  if (typeof obj === 'bigint') {
    return obj.toString() as unknown as T;
  }

  // Função ou Symbol -> undefined (será removido)
  if (typeof obj === 'function' || typeof obj === 'symbol') {
    return undefined as unknown as T;
  }

  // Array
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizarParaMongoDB(item)) as unknown as T;
  }

  // Objeto simples
  if (typeof obj === 'object') {
    // Date, Buffer, ObjectId - manter como está
    if (obj instanceof Date || Buffer.isBuffer(obj)) {
      return obj;
    }

    const resultado: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const valorSanitizado = sanitizarParaMongoDB(value);
      if (valorSanitizado !== undefined) {
        resultado[key] = valorSanitizado;
      }
    }
    return resultado as T;
  }

  return obj;
}

/**
 * Persiste o JSON bruto e metadados da captura no MongoDB
 * @param params Parâmetros para criar o documento
 * @returns Objeto com sucesso, ID do MongoDB e erro opcional
 */
export async function registrarCapturaRawLog(
  params: RegistrarCapturaRawLogParams
): Promise<{ success: boolean; mongodbId: string | null; erro?: string }> {
  try {
    // Validações antes de inserir
    if (params.captura_log_id !== -1 && params.captura_log_id <= 0) {
      const erro = `captura_log_id inválido: ${params.captura_log_id}. Deve ser > 0 ou -1 para erros especiais.`;
      console.error(`❌ [CapturaRawLog] ${erro}`);
      return { success: false, mongodbId: null, erro };
    }

    // Validar campos obrigatórios conforme novos tipos
    if (!params.tipo_captura || !params.advogado_id || !params.credencial_id || !params.trt || !params.grau) {
      const erro = `Campos obrigatórios ausentes: tipo_captura=${params.tipo_captura}, advogado_id=${params.advogado_id}, credencial_id=${params.credencial_id}, trt=${params.trt}, grau=${params.grau}`;
      console.error(`❌ [CapturaRawLog] ${erro}`);
      return { success: false, mongodbId: null, erro };
    }

    // Logar warning se payload_bruto é null mas status é 'success' (inconsistência)
    if (params.payload_bruto === null && params.status === 'success') {
      console.warn(`⚠️ [CapturaRawLog] Inconsistência: payload_bruto é null mas status é 'success' para captura_log_id=${params.captura_log_id}`);
    }

    const collection = await getCapturaRawLogsCollection();

    // Sanitizar campos que podem conter tipos incompatíveis com MongoDB (BigInt, funções, etc.)
    const documento: CapturaRawLogCreate = {
      captura_log_id: params.captura_log_id,
      tipo_captura: params.tipo_captura,
      advogado_id: params.advogado_id,
      credencial_id: params.credencial_id,
      credencial_ids: params.credencial_ids,
      trt: params.trt,
      grau: params.grau,
      status: params.status || 'success',
      requisicao: sanitizarParaMongoDB(params.requisicao),
      payload_bruto: sanitizarParaMongoDB(params.payload_bruto),
      resultado_processado: sanitizarParaMongoDB(params.resultado_processado),
      logs: params.logs,
      erro: params.erro,
      criado_em: new Date(),
      atualizado_em: new Date(),
    };

    const result = await collection.insertOne(documento as CapturaRawLogCreate);
    return { success: true, mongodbId: result.insertedId.toString() };
  } catch (error) {
    // Logar contexto completo
    const contexto = {
      captura_log_id: params.captura_log_id,
      tipo_captura: params.tipo_captura,
      trt: params.trt,
      grau: params.grau,
      processo_id: params.requisicao?.processo_id || 'N/A',
    };
    console.error(`❌ [CapturaRawLog] Erro ao persistir log bruto da captura:`, contexto, error);
    return { success: false, mongodbId: null, erro: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

/**
 * Busca todos os documentos MongoDB de uma captura específica
 * @param capturaLogId ID do log de captura no PostgreSQL
 * @returns Array de documentos CapturaRawLogDocument
 */
export async function buscarLogsBrutoPorCapturaId(capturaLogId: number): Promise<CapturaRawLogDocument[]> {
  try {
    const collection = await getCapturaRawLogsCollection();
    const documentos = await collection.find({ captura_log_id: capturaLogId }).sort({ criado_em: -1 }).toArray();
    return documentos;
  } catch (error) {
    console.error(`❌ [CapturaRawLog] Erro ao buscar logs brutos para captura_log_id=${capturaLogId}:`, error);
    return [];
  }
}

/**
 * Conta logs brutos por status para uma captura específica
 * @param capturaLogId ID do log de captura no PostgreSQL
 * @returns Contadores de status
 */
export async function contarLogsBrutoPorStatus(capturaLogId: number): Promise<{ success: number; error: number; total: number }> {
  try {
    const collection = await getCapturaRawLogsCollection();
    const pipeline = [
      { $match: { captura_log_id: capturaLogId } },
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
      return { success: result[0].success, error: result[0].error, total: result[0].total };
    }
    return { success: 0, error: 0, total: 0 };
  } catch (error) {
    console.error(`❌ [CapturaRawLog] Erro ao contar logs brutos para captura_log_id=${capturaLogId}:`, error);
    return { success: 0, error: 0, total: 0 };
  }
}