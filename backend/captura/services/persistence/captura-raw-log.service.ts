import type { CapturaRawLogCreate, StatusCapturaRaw } from '@/backend/types/mongodb/captura-log';
import { getCapturaRawLogsCollection } from '@/backend/utils/mongodb/collections';

export interface RegistrarCapturaRawLogParams extends Omit<CapturaRawLogCreate, 'status' | 'criado_em' | 'atualizado_em'> {
  status?: StatusCapturaRaw;
}

/**
 * Persiste o JSON bruto e metadados da captura no MongoDB
 * @returns MongoDB _id (string) do documento inserido, ou null em caso de erro
 */
export async function registrarCapturaRawLog(
  params: RegistrarCapturaRawLogParams
): Promise<string | null> {
  try {
    const collection = await getCapturaRawLogsCollection();

    const documento: CapturaRawLogCreate = {
      captura_log_id: params.captura_log_id,
      tipo_captura: params.tipo_captura,
      advogado_id: params.advogado_id,
      credencial_id: params.credencial_id,
      credencial_ids: params.credencial_ids,
      trt: params.trt,
      grau: params.grau,
      status: params.status || 'success',
      requisicao: params.requisicao,
      payload_bruto: params.payload_bruto,
      resultado_processado: params.resultado_processado,
      logs: params.logs,
      erro: params.erro,
      criado_em: new Date(),
      atualizado_em: new Date(),
    };

    const result = await collection.insertOne(documento);
    return result.insertedId.toString();
  } catch (error) {
    console.error('❌ [CapturaRawLog] Erro ao persistir log bruto da captura:', error);
    return null;
  }
}

