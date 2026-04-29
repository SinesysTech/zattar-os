/**
 * Serviço de persistência de timeline
 *
 * Responsabilidades:
 * - Salvar/atualizar timeline no PostgreSQL (campo timeline_jsonb) - função principal: salvarTimeline()
 * - Gerenciar metadados e versionamento
 *
 * IMPORTANTE: Use salvarTimeline() para novas implementações.
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';

export interface TimelinePersistenceResult {
  /** Total de itens na timeline */
  totalItens: number;
}

/**
 * Parâmetros para salvar timeline
 */
export interface SalvarTimelineParams {
  /** ID do processo no PJE */
  processoId: string;
  /** Código do TRT */
  trtCodigo: string;
  /** Grau da instância */
  grau: string;
  /** Timeline enriquecida com dados do Google Drive */
  timeline: TimelineItemEnriquecido[];
  /** ID do advogado (opcional) */
  advogadoId?: number;
}

/**
 * Salva a timeline no PostgreSQL (campo timeline_jsonb)
 *
 * Persiste a timeline diretamente no campo JSONB da tabela acervo,
 * usando apenas PostgreSQL (Supabase).
 */
export async function salvarTimeline(
  params: SalvarTimelineParams
): Promise<TimelinePersistenceResult> {
  const {
    processoId,
    trtCodigo,
    grau,
    timeline,
  } = params;

  console.log('💾 [TimelinePersistence] Salvando timeline no PostgreSQL', {
    processoId,
    trtCodigo,
    grau,
    totalItens: timeline.length,
  });

  // Calcular estatísticas
  const totalDocumentos = timeline.filter(item => item.documento).length;
  const totalMovimentos = timeline.filter(item => !item.documento).length;
  const totalDocumentosBaixados = timeline.filter(
    item => item.documento && (item.backblaze || item.googleDrive)
  ).length;

  // Construir objeto TimelineJSONB
  const timelineJsonb = {
    timeline,
    metadata: {
      totalDocumentos,
      totalMovimentos,
      totalDocumentosBaixados,
      capturadoEm: new Date().toISOString(),
      schemaVersion: 1,
    },
  };

  console.log('📊 [TimelinePersistence] Estatísticas da timeline', {
    totalDocumentos,
    totalMovimentos,
    totalDocumentosBaixados,
  });

  // Salvar no PostgreSQL
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('acervo')
    .update({ timeline_jsonb: timelineJsonb })
    .eq('id_pje', processoId)
    .eq('trt', trtCodigo)
    .eq('grau', grau);

  if (error) {
    console.error('❌ [TimelinePersistence] Erro ao salvar no PostgreSQL:', error);
    throw new Error(`Erro ao salvar timeline no PostgreSQL: ${error.message}`);
  }

  console.log('✅ [TimelinePersistence] Timeline salva no PostgreSQL (JSONB)', {
    processoId,
    totalItens: timeline.length,
  });

  return {
    totalItens: timeline.length,
  };
}
