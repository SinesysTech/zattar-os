// Serviço para baixar expediente pendente de manifestação
// Gerencia a lógica de negócio para baixar um expediente

import { baixarExpediente as baixarExpedienteDb } from './persistence/baixa-expediente-persistence.service';
import { registrar_baixa_expediente } from './persistence/registrar-baixa-log.service';
import { invalidatePendentesCache } from '@/lib/redis/invalidation';

export interface BaixarExpedienteParams {
  expedienteId: number;
  protocoloId?: string | null;
  justificativa?: string | null;
  usuarioId: number;
}

export interface BaixarExpedienteResult {
  success: boolean;
  data?: {
    id: number;
    baixado_em: string;
    protocolo_id: string | null;
    justificativa_baixa: string | null;
  };
  error?: string;
}

/**
 * Baixa um expediente pendente de manifestação
 * 
 * Fluxo:
 * 1. Valida que protocoloId OU justificativa está preenchido
 * 2. Atualiza o expediente no banco
 * 3. Registra a baixa nos logs
 */
export async function baixarExpediente(
  params: BaixarExpedienteParams
): Promise<BaixarExpedienteResult> {
  // Validação: protocoloId OU justificativa deve estar preenchido
  if (!params.protocoloId && (!params.justificativa || params.justificativa.trim() === '')) {
    return {
      success: false,
      error: 'É necessário informar o ID do protocolo ou a justificativa da baixa',
    };
  }

  try {
    // Baixar expediente no banco
    const resultado = await baixarExpedienteDb({
      expedienteId: params.expedienteId,
      protocoloId: params.protocoloId ?? null,
      justificativa: params.justificativa?.trim() || null,
    });

    if (!resultado.success) {
      return resultado;
    }

    // Registrar nos logs
    await registrar_baixa_expediente({
      expedienteId: params.expedienteId,
      usuarioId: params.usuarioId,
      protocoloId: params.protocoloId ?? null,
      justificativa: params.justificativa?.trim() || null,
    });

    // Invalidar cache de pendentes após baixa bem-sucedida
    await invalidatePendentesCache();

    return {
      success: true,
      data: resultado.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao baixar expediente';
    return {
      success: false,
      error: errorMessage,
    };
  }
}