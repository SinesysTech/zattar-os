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
    if (process.env.ENABLE_AI_INDEXING === 'false') {
      console.log('[AI] Indexação desabilitada via ENABLE_AI_INDEXING (peça)');
      return { success: true };
    }
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Verificar tipo suportado, mas permitir tentativa mesmo para tipos desconhecidos
    if (!isContentTypeSupported(content_type)) {
      console.warn(
        `⚠️ [AI] Tipo de conteúdo não suportado explicitamente: ${content_type}. A indexação será tentada com fallback.`
      );
      // Não retornar erro - deixar indexDocument tentar
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
    if (process.env.ENABLE_AI_INDEXING === 'false') {
      console.log('[AI] Indexação desabilitada via ENABLE_AI_INDEXING (andamento)');
      return { success: true };
    }
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Usar pipeline centralizado para indexação de texto puro
    after(async () => {
      try {
        const { indexText } = await import('@/features/ai/services/indexing.service');

        console.log(`🧠 [AI] Indexando andamento ${andamento_id} do processo ${processo_id}`);

        await indexText(content, {
          entity_type: 'processo_andamento',
          entity_id: andamento_id,
          parent_id: processo_id,
          metadata: {
            processo_id,
            indexed_by: user.id,
          },
        });

        console.log(`✅ [AI] Andamento ${andamento_id} indexado com sucesso`);
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
    if (process.env.ENABLE_AI_INDEXING === 'false') {
      console.log('[AI] Indexação desabilitada via ENABLE_AI_INDEXING (reindex processo)');
      return { success: true, message: 'Indexação desabilitada' };
    }
    const user = await authenticateRequest();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    after(async () => {
      try {
        const { deleteEmbeddingsByParent, getEmbeddingsCount } = await import('@/features/ai/repository');
        const { indexDocument } = await import('@/features/ai/services/indexing.service');
        const { createClient } = await import('@/lib/supabase/server');

        console.log(`🔄 [AI] Iniciando reindexação do processo ${processo_id}`);

        // 1. Remover todos os embeddings do processo (incluindo peças e andamentos)
        await deleteEmbeddingsByParent(processo_id);
        console.log(`🗑️ [AI] Embeddings antigos removidos para processo ${processo_id}`);

        // 2. Buscar todas as peças indexadas anteriormente (via embeddings)
        const supabase = await createClient();
        const { data: pecasIndexadas } = await supabase
          .from('embeddings')
          .select('entity_id, metadata')
          .eq('parent_id', processo_id)
          .eq('entity_type', 'processo_peca');

        const pecaIds = [...new Set((pecasIndexadas || []).map((p) => p.entity_id))];
        console.log(`📋 [AI] Encontradas ${pecaIds.length} peças previamente indexadas`);

        // 3. Buscar uploads de documentos que possam ser peças do processo
        // Nota: Esta é uma heurística - peças podem estar em documentos_uploads
        // vinculados a documentos que estão relacionados ao processo
        const { data: uploads } = await supabase
          .from('documentos_uploads')
          .select('id, b2_key, tipo_mime, nome_arquivo, documento_id')
          .in('id', pecaIds.length > 0 ? pecaIds : [0]) // Se temos IDs, filtrar por eles
          .limit(1000); // Limite de segurança

        console.log(`📁 [AI] Encontrados ${uploads?.length || 0} uploads candidatos a peças`);

        let pecasReindexadas = 0;
        let erros = 0;

        // 4. Reindexar cada peça encontrada
        if (uploads && uploads.length > 0) {
          // Limitar concorrência para evitar sobrecarga
          const CONCURRENCY_LIMIT = 5;
          for (let i = 0; i < uploads.length; i += CONCURRENCY_LIMIT) {
            const batch = uploads.slice(i, i + CONCURRENCY_LIMIT);
            await Promise.all(
              batch.map(async (upload) => {
                try {
                  await indexDocument({
                    entity_type: 'processo_peca',
                    entity_id: upload.id,
                    parent_id: processo_id,
                    storage_provider: 'backblaze',
                    storage_key: upload.b2_key,
                    content_type: upload.tipo_mime,
                    metadata: {
                      processo_id,
                      indexed_by: user.id,
                      nome_arquivo: upload.nome_arquivo,
                      documento_id: upload.documento_id,
                    },
                  });
                  pecasReindexadas++;
                  console.log(`✅ [AI] Peça ${upload.id} reindexada (${pecasReindexadas}/${uploads.length})`);
                } catch (error) {
                  erros++;
                  console.error(`❌ [AI] Erro ao reindexar peça ${upload.id}:`, error);
                }
              })
            );
          }
        }

        // 5. Verificar andamentos que precisam ser reindexados
        // (andamentos são indexados via actionIndexarAndamentoProcesso quando criados)

        const totalFinal = await getEmbeddingsCount(undefined, undefined);
        console.log(`✅ [AI] Reindexação do processo ${processo_id} concluída:`);
        console.log(`   - ${pecasReindexadas} peças reindexadas`);
        console.log(`   - ${erros} erros encontrados`);
        console.log(`   - Total de embeddings no sistema: ${totalFinal}`);
      } catch (error) {
        console.error(`❌ [AI] Erro na reindexação do processo ${processo_id}:`, error);
      }
    });

    return {
      success: true,
      message: `Reindexação do processo ${processo_id} agendada. As peças serão reindexadas em background.`,
    };
  } catch (error) {
    console.error('[AI] Erro na action de reindexação do processo:', error);
    return { success: false, error: String(error) };
  }
}
