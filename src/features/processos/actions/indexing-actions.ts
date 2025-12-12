'use server';

import { after } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { indexDocument } from '@/features/ai/services/indexing.service';
import { isContentTypeSupported } from '@/features/ai/services/extraction.service';

/**
 * Dispara indexação assíncrona de uma peça de processo para RAG
 */
export async function actionIndexarPecaProcesso(
  processo_id: number,
  peca_id: number,
  storage_key: string,
  content_type: string
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    if (!isContentTypeSupported(content_type)) {
      return { success: false, error: 'Tipo de conteúdo não suportado para indexação' };
    }

    after(async () => {
      try {
        console.log(`🧠 [AI] Disparando indexação para peça ${peca_id} do processo ${processo_id}`);
        await indexDocument({
          entity_type: 'processo_peca',
          entity_id: peca_id,
          parent_id: processo_id,
          storage_provider: 'backblaze',
          storage_key,
          content_type,
          metadata: {
            processo_id,
            indexed_by: user.id,
          },
        });
      } catch (error) {
        console.error(`❌ [AI] Erro ao indexar peça ${peca_id}:`, error);
      }
    });

    return { success: true };
  } catch (error) {
    console.error('[AI] Erro na action de indexação de peça:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Dispara indexação assíncrona de um andamento de processo para RAG
 */
export async function actionIndexarAndamentoProcesso(
  processo_id: number,
  andamento_id: number,
  content: string
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Para andamentos, não temos arquivo - indexamos o texto diretamente
    // Isso será implementado diretamente via repository sem download
    after(async () => {
      try {
        const { saveEmbeddings } = await import('@/features/ai/repository');
        const { generateEmbedding } = await import('@/features/ai/services/embedding.service');
        const { chunkText } = await import('@/features/ai/services/chunking.service');

        console.log(`🧠 [AI] Indexando andamento ${andamento_id} do processo ${processo_id}`);

        const chunks = await chunkText(content, {
          chunkSize: 1000,
          chunkOverlap: 200,
        });

        if (chunks.length === 0) {
          console.warn(`⚠️ [AI] Andamento ${andamento_id} sem conteúdo para indexar`);
          return;
        }

        const embeddings = await Promise.all(
          chunks.map((chunk) => generateEmbedding(chunk.content))
        );

        await saveEmbeddings(
          chunks.map((chunk, i) => ({
            content: chunk.content,
            embedding: embeddings[i],
            entity_type: 'processo_andamento',
            entity_id: andamento_id,
            parent_id: processo_id,
            metadata: {
              processo_id,
              indexed_by: user.id,
              chunk_index: chunk.index,
            },
          }))
        );

        console.log(`✅ [AI] Andamento ${andamento_id} indexado com ${chunks.length} chunks`);
      } catch (error) {
        console.error(`❌ [AI] Erro ao indexar andamento ${andamento_id}:`, error);
      }
    });

    return { success: true };
  } catch (error) {
    console.error('[AI] Erro na action de indexação de andamento:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Reindexação em lote de todas as peças de um processo
 */
export async function actionReindexarProcesso(processo_id: number) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Primeiro, remove todos os embeddings do processo
    const { deleteEmbeddingsByParent } = await import('@/features/ai/repository');
    await deleteEmbeddingsByParent(processo_id);

    // TODO: Buscar todas as peças do processo e reindexar cada uma
    // Isso requer acesso ao repository de processos

    return {
      success: true,
      message: 'Embeddings antigos removidos. Reindexação de peças deve ser feita individualmente.'
    };
  } catch (error) {
    console.error('[AI] Erro na reindexação do processo:', error);
    return { success: false, error: String(error) };
  }
}
