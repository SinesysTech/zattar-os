// Serviço para registrar baixa nos logs
// Chama a função SQL para registrar a baixa nos logs de alteração

import { createServiceClient } from '@/backend/utils/supabase/service-client';

export interface RegistrarBaixaLogParams {
  expedienteId: number;
  usuarioId: number;
  protocoloId: string | null;
  justificativa: string | null;
}

/**
 * Registra a baixa de um expediente nos logs
 */
export async function registrar_baixa_expediente(
  params: RegistrarBaixaLogParams
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.rpc('registrar_baixa_expediente', {
    p_expediente_id: params.expedienteId,
    p_usuario_id: params.usuarioId,
    p_protocolo_id: params.protocoloId,
    p_justificativa: params.justificativa,
  });

  if (error) {
    console.error('Erro ao registrar baixa nos logs:', error);
    // Não lançar erro para não interromper o fluxo principal
  }
}

export interface RegistrarReversaoBaixaLogParams {
  expedienteId: number;
  usuarioId: number;
  protocoloIdAnterior: string | null;
  justificativaAnterior: string | null;
}

/**
 * Registra a reversão da baixa de um expediente nos logs
 */
export async function registrar_reversao_baixa_expediente(
  params: RegistrarReversaoBaixaLogParams
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase.rpc('registrar_reversao_baixa_expediente', {
    p_expediente_id: params.expedienteId,
    p_usuario_id: params.usuarioId,
    p_protocolo_id_anterior: params.protocoloIdAnterior,
    p_justificativa_anterior: params.justificativaAnterior,
  });

  if (error) {
    console.error('Erro ao registrar reversão de baixa nos logs:', error);
    // Não lançar erro para não interromper o fluxo principal
  }
}

