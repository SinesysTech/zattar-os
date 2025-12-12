// Feature AI - Sistema de RAG e Busca Semântica
// Exportações públicas da feature

// Domain
export * from './domain';

// Service
export * from './service';

// Actions
export * from './actions/embeddings-actions';
export * from './actions/search-actions';

// Components
export { RAGChat } from './components/rag-chat';

// Services (para uso interno ou avançado)
export { generateEmbedding, generateEmbeddings } from './services/embedding.service';
export { chunkText, type Chunk, type ChunkOptions } from './services/chunking.service';
export { extractText, isContentTypeSupported, getSupportedContentTypes } from './services/extraction.service';
export { downloadFile, extractKeyFromUrl, getMimeType, type StorageProvider } from './services/storage-adapter.service';
export { indexDocument, reindexDocument } from './services/indexing.service';
