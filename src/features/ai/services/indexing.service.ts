import type { IndexDocumentParams } from '../domain';
import { downloadFile } from './storage-adapter.service';
import { extractText, isContentTypeSupported } from './extraction.service';
import { chunkText } from './chunking.service';
import { generateEmbeddings } from './embedding.service';
import * as repository from '../repository';

const MIN_TEXT_LENGTH = 50;

export async function indexDocument(params: IndexDocumentParams): Promise<void> {
  console.log(`🧠 [AI] Iniciando indexação: ${params.entity_type}/${params.entity_id}`);

  // Verificar se o tipo de conteúdo é suportado
  if (!isContentTypeSupported(params.content_type)) {
    console.warn(
      `⚠️ [AI] Tipo de conteúdo não suportado: ${params.content_type}. Pulando indexação.`
    );
    return;
  }

  try {
    // 1. Baixar arquivo
    const buffer = await downloadFile(params.storage_provider, params.storage_key);
    console.log(`📥 [AI] Arquivo baixado: ${buffer.length} bytes`);

    // 2. Extrair texto
    const text = await extractText(buffer, params.content_type);
    console.log(`📄 [AI] Texto extraído: ${text.length} caracteres`);

    if (!text || text.trim().length < MIN_TEXT_LENGTH) {
      console.warn(
        `⚠️ [AI] Texto muito curto (${text.trim().length} chars), pulando indexação`
      );
      return;
    }

    // 3. Chunking
    const chunks = await chunkText(text, {
      chunkSize: 1000,
      chunkOverlap: 200,
      preserveParagraphs: true,
    });
    console.log(`✂️ [AI] Texto dividido em ${chunks.length} chunks`);

    if (chunks.length === 0) {
      console.warn(`⚠️ [AI] Nenhum chunk gerado, pulando indexação`);
      return;
    }

    // 4. Gerar embeddings em batch
    const texts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(texts);
    console.log(`🔢 [AI] ${embeddings.length} embeddings gerados`);

    // 5. Remover embeddings antigos da mesma entidade
    await repository.deleteEmbeddingsByEntity(params.entity_type, params.entity_id);

    // 6. Salvar no banco
    await repository.saveEmbeddings(
      chunks.map((chunk, i) => ({
        content: chunk.content,
        embedding: embeddings[i],
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        parent_id: params.parent_id ?? null,
        metadata: {
          ...params.metadata,
          chunk_index: chunk.index,
          start_char: chunk.metadata.start_char,
          end_char: chunk.metadata.end_char,
        },
      }))
    );

    console.log(`✅ [AI] Indexação concluída: ${chunks.length} chunks salvos`);
  } catch (error) {
    console.error(`❌ [AI] Erro na indexação:`, error);
    throw error;
  }
}

export async function reindexDocument(params: IndexDocumentParams): Promise<void> {
  // Remove embeddings existentes e reindexa
  await repository.deleteEmbeddingsByEntity(params.entity_type, params.entity_id);
  await indexDocument(params);
}
