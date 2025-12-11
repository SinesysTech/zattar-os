/**
 * Serviço de Timeline do PJE-TRT
 * 
 * Migrado de backend/captura/services/timeline/ para lib compartilhada.
 * Responsável por buscar timelines no MongoDB.
 */

import { ObjectId } from 'mongodb';
import { getTimelineCollection } from '@/lib/mongodb/collections';
import type { TimelineDocument } from '@/backend/types/mongodb/timeline';
import type { TimelineItemEnriquecido } from './types';

/**
 * Busca a timeline pelo ID do MongoDB
 * 
 * @param mongoId - ID do documento MongoDB (string)
 * @returns Documento da timeline ou null se não encontrado
 */
export async function obterTimelinePorMongoId(
    mongoId: string
): Promise<TimelineDocument | null> {
    console.log('🔍 [Timeline] Buscando timeline por MongoDB ID', {
        mongoId,
    });

    const collection = await getTimelineCollection();

    const timeline = await collection.findOne({
        _id: new ObjectId(mongoId),
    });

    if (timeline) {
        console.log('✅ [Timeline] Timeline encontrada', {
            processoId: timeline.processoId,
            totalItens: timeline.timeline.length,
        });
    } else {
        console.log('ℹ️ [Timeline] Timeline não encontrada');
    }

    return timeline;
}

/**
 * Busca a timeline de um processo específico
 * 
 * @param processoId - ID do processo no PJE
 * @param trtCodigo - Código do TRT (ex: 'TRT3')
 * @param grau - Grau da instância
 * @returns Documento da timeline ou null se não encontrado
 */
export async function obterTimelinePorProcessoId(
    processoId: string,
    trtCodigo: string,
    grau: string
): Promise<TimelineDocument | null> {
    console.log('🔍 [Timeline] Buscando timeline no MongoDB', {
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
        console.log('✅ [Timeline] Timeline encontrada', {
            mongoId: timeline._id?.toString(),
            totalItens: timeline.timeline.length,
        });
    } else {
        console.log('ℹ️ [Timeline] Timeline não encontrada');
    }

    return timeline;
}
