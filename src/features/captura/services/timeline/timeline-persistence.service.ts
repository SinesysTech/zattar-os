/**
 * Serviço de persistência de timeline
 *
 * Responsabilidades:
 * - Salvar/atualizar timeline no PostgreSQL (campo timeline_jsonb) - função principal: salvarTimeline()
 * - Manter funções legadas de leitura do MongoDB (serão removidas na Fase 6)
 * - Gerenciar metadados e versionamento
 *
 * IMPORTANTE: Use salvarTimeline() para novas implementações.
 * As funções MongoDB (obterTimelinePor*) existem apenas para compatibilidade temporária.
 */

import { ObjectId } from 'mongodb';
import { getTimelineCollection } from '@/lib/mongodb/collections';
import { createServiceClient } from '@/lib/supabase/service-client';
import type { TimelineDocument, TimelinePersistenceResult } from '@/features/captura/types/mongo-timeline';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';

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
 * eliminando a dependência do MongoDB.
 */
export async function salvarTimeline(
  params: SalvarTimelineParams
): Promise<TimelinePersistenceResult> {
  const {
    processoId,
    trtCodigo,
    grau,
    timeline,
    advogadoId,
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
    .eq('id_pje', processoId);

  if (error) {
    console.error('❌ [TimelinePersistence] Erro ao salvar no PostgreSQL:', error);
    throw new Error(`Erro ao salvar timeline no PostgreSQL: ${error.message}`);
  }

  console.log('✅ [TimelinePersistence] Timeline salva no PostgreSQL (JSONB)', {
    processoId,
    totalItens: timeline.length,
  });

  return {
    mongoId: '', // Temporário, será removido na Fase 6
    criado: false,
    totalItens: timeline.length,
  };
}

/**
 * @deprecated Use salvarTimeline() no lugar. Esta função será removida na Fase 6.
 * Salva ou atualiza a timeline no PostgreSQL
 *
 * Esta função agora redireciona para salvarTimeline() que persiste no PostgreSQL.
 */
export async function salvarTimelineNoMongoDB(
  params: SalvarTimelineParams
): Promise<TimelinePersistenceResult> {
  console.log('💾 [TimelinePersistence] Redirecionando salvarTimelineNoMongoDB para PostgreSQL');

  // Redirecionar para a implementação PostgreSQL
  return salvarTimeline(params);
}

/**
 * @deprecated Função legada que atualiza referência MongoDB. Será removida na Fase 6.
 * Com a migração para timeline_jsonb, esta função não é mais necessária.
 *
 * Atualiza a referência da timeline no PostgreSQL (tabela acervo)
 */
export async function atualizarTimelineMongoIdNoAcervo(
  processoId: string,
  mongoId: string
): Promise<void> {
  console.log('🔗 [TimelinePersistence] Atualizando referência no PostgreSQL', {
    processoId,
    mongoId,
  });

  const supabase = createServiceClient();

  const { error } = await supabase
    .from('acervo')
    .update({ timeline_mongodb_id: mongoId })
    .eq('id_pje', processoId);

  if (error) {
    console.error('❌ [TimelinePersistence] Erro ao atualizar acervo:', error);
    throw new Error(`Erro ao atualizar acervo: ${error.message}`);
  }

  console.log('✅ [TimelinePersistence] Referência atualizada no PostgreSQL');
}

/**
 * @deprecated Função legada que lê do MongoDB. Será removida na Fase 6.
 * Use consultas diretas ao PostgreSQL (campo timeline_jsonb) para novas implementações.
 *
 * Busca a timeline de um processo no MongoDB
 */
export async function obterTimelinePorProcessoId(
  processoId: string,
  trtCodigo: string,
  grau: string
): Promise<TimelineDocument | null> {
  console.log('🔍 [TimelinePersistence] Buscando timeline no MongoDB', {
    processoId,
    trtCodigo,
    grau,
  });

  const collection = await getTimelineCollection();

  const timeline = await collection.findOne({
    processoId,
    trtCodigo,
    grau,
  });

  if (timeline) {
    console.log('✅ [TimelinePersistence] Timeline encontrada', {
      mongoId: timeline._id?.toString(),
      totalItens: timeline.timeline.length,
    });
  } else {
    console.log('ℹ️ [TimelinePersistence] Timeline não encontrada');
  }

  return timeline;
}

/**
 * @deprecated Função legada que lê do MongoDB. Será removida na Fase 6.
 * Use consultas diretas ao PostgreSQL (campo timeline_jsonb) para novas implementações.
 *
 * Busca a timeline pelo ID do MongoDB
 */
export async function obterTimelinePorMongoId(
  mongoId: string
): Promise<TimelineDocument | null> {
  console.log('🔍 [TimelinePersistence] Buscando timeline por MongoDB ID', {
    mongoId,
  });

  const collection = await getTimelineCollection();

  const timeline = await collection.findOne({
    _id: new ObjectId(mongoId),
  });

  if (timeline) {
    console.log('✅ [TimelinePersistence] Timeline encontrada', {
      processoId: timeline.processoId,
      totalItens: timeline.timeline.length,
    });
  } else {
    console.log('ℹ️ [TimelinePersistence] Timeline não encontrada');
  }

  return timeline;
}
