// Serviço para reverter baixa de expediente pendente de manifestação
// Gerencia a lógica de negócio para reverter a baixa de um expediente

import { reverterBaixa as reverterBaixaDb } from './persistence/reverter-baixa-persistence.service';
import {
  registrar_reversao_baixa_expediente,
} from './persistence/registrar-baixa-log.service';
import { invalidatePendentesCache } from '@/lib/redis/invalidation';

export interface ReverterBaixaParams {
  expedienteId: number;
  usuarioId: number;
}

export interface ReverterBaixaResult {
  success: boolean;
  data?: {
    id: number;
    baixado_em: null;
    protocolo_id: null;
    justificativa_baixa: null;
  };
  error?: string;
}

/**
 * Reverte a baixa de um expediente pendente de manifestação
 * 
 * Fluxo:
 * 1. Busca dados anteriores do expediente (protocolo_id e justificativa)
 * 2. Reverte a baixa no banco (limpa campos)
 * 3. Registra a reversão nos logs com dados anteriores
 */
export async function reverterBaixa(
  params: ReverterBaixaParams
): Promise<ReverterBaixaResult> {
  try {
    // Buscar dados anteriores antes de reverter
    const supabase = (await import('@/backend/utils/supabase/service-client')).createServiceClient();
    const { data: expedienteAnterior } = await supabase
      .from('pendentes_manifestacao')
      .select('protocolo_id, justificativa_baixa')
      .eq('id', params.expedienteId)
      .single();

    // Reverter baixa no banco
    const resultado = await reverterBaixaDb({
      expedienteId: params.expedienteId,
    });

    if (!resultado.success) {
      return resultado;
    }

    // Registrar nos logs com dados anteriores
    await registrar_reversao_baixa_expediente({
      expedienteId: params.expedienteId,
      usuarioId: params.usuarioId,
      protocoloIdAnterior: expedienteAnterior?.protocolo_id ?? null,
      justificativaAnterior: expedienteAnterior?.justificativa_baixa ?? null,
    });

    // Invalidar cache de pendentes após reversão bem-sucedida
    await invalidatePendentesCache();

    return {
      success: true,
      data: resultado.data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao reverter baixa';
    return {
      success: false,
      error: errorMessage,
    };
  }
}