// Serviço de persistência para reverter baixa de expediente
// Gerencia operações de reversão de baixa na tabela pendentes_manifestacao

import { createServiceClient } from '@/backend/utils/supabase/service-client';

export interface ReverterBaixaParams {
  expedienteId: number;
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
 * Reverte a baixa de um expediente no banco de dados
 */
export async function reverterBaixa(
  params: ReverterBaixaParams
): Promise<ReverterBaixaResult> {
  const supabase = createServiceClient();

  // Verificar se o expediente existe e está baixado
  const { data: expedienteExistente, error: erroBusca } = await supabase
    .from('pendentes_manifestacao')
    .select('id, baixado_em, protocolo_id, justificativa_baixa')
    .eq('id', params.expedienteId)
    .single();

  if (erroBusca || !expedienteExistente) {
    return {
      success: false,
      error: 'Expediente não encontrado',
    };
  }

  // Verificar se está baixado
  if (!expedienteExistente.baixado_em) {
    return {
      success: false,
      error: 'Expediente não está baixado',
    };
  }

  // Reverter baixa (limpar campos)
  const { data, error } = await supabase
    .from('pendentes_manifestacao')
    .update({
      baixado_em: null,
      protocolo_id: null,
      justificativa_baixa: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.expedienteId)
    .select('id, baixado_em, protocolo_id, justificativa_baixa')
    .single();

  if (error) {
    return {
      success: false,
      error: `Erro ao reverter baixa: ${error.message}`,
    };
  }

  return {
    success: true,
    data: {
      id: data.id,
      baixado_em: null,
      protocolo_id: null,
      justificativa_baixa: null,
    },
  };
}

