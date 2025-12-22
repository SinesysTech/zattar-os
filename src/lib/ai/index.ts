/**
 * Camada de Inteligência Artificial do Sinesys
 *
 * Exporta funções para:
 * - Geração de embeddings
 * - Indexação de documentos
 * - Busca semântica (RAG)
 * - Resumo de chamadas
 */

// Tipos
export type {
  DocumentoMetadata,
  IndexarDocumentoParams,
  ResultadoBuscaSemantica,
  BuscaSemanticaOptions,
  EmbeddingModelConfig,
  TextChunk,
  IndexacaoStatus,
} from './types';

// Configuração
export {
  getEmbeddingConfig,
  isAIConfigured,
  CHUNKING_CONFIG,
  RETRIEVAL_CONFIG,
  EMBEDDING_CACHE_CONFIG,
} from './config';

// Embeddings
export {
  gerarEmbedding,
  gerarEmbeddingsBatch,
  gerarEmbeddingQuery,
} from './embedding';

// Indexação
export {
  indexarDocumento,
  removerDocumentoDoIndice,
  atualizarDocumentoNoIndice,
  reindexarTudo,
} from './indexing';

// Busca/Retrieval
export {
  buscaSemantica,
  buscarSimilares,
  buscaHibrida,
  obterContextoRAG,
} from './retrieval';

// Summarization
export * from './summarization';
