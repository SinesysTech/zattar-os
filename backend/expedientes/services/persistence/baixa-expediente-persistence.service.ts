// Serviço de persistência para baixar expediente
// Gerencia operações de baixa na tabela expedientes

import { createServiceClient } from '@/backend/utils/supabase/service-client';

export interface BaixarExpedienteParams {
  expedienteId: number;
  protocoloId: string | null;
  justificativa: string | null;
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
 * Baixa um expediente no banco de dados
 */
export async function baixarExpediente(
  params: BaixarExpedienteParams
): Promise<BaixarExpedienteResult> {
  const supabase = createServiceClient();

  // Verificar se o expediente existe
  const { data: expedienteExistente, error: erroBusca } = await supabase
    .from('expedientes')
    .select('id, baixado_em')
    .eq('id', params.expedienteId)
    .single();

  if (erroBusca || !expedienteExistente) {
    return {
      success: false,
      error: 'Expediente não encontrado',
    };
  }

  // Verificar se já está baixado
  if (expedienteExistente.baixado_em) {
    return {
      success: false,
      error: 'Expediente já está baixado',
    };
  }

  // Atualizar expediente
  const { data, error } = await supabase
    .from('expedientes')
    .update({
      baixado_em: new Date().toISOString(),
      protocolo_id: (params.protocoloId ?? undefined)?.trim() || null,
      justificativa_baixa: (params.justificativa ?? undefined)?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.expedienteId)
    .select('id, baixado_em, protocolo_id, justificativa_baixa')
    .single();

  if (error) {
    return {
      success: false,
      error: `Erro ao baixar expediente: ${error.message}`,
    };
  }

  return {
    success: true,
    data: {
      id: data.id,
      baixado_em: data.baixado_em,
      protocolo_id: data.protocolo_id,
      justificativa_baixa: data.justificativa_baixa,
    },
  };
}
