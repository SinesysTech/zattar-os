/**
 * Barrel export para MongoDB
 * 
 * Exporta todas as funções e tipos relacionados ao MongoDB
 */

export {
  getMongoClient,
  getMongoDatabase,
  closeMongoConnection,
  testMongoConnection,
} from './client';

export {
  COLLECTIONS,
  getTimelineCollection,
  getCapturaRawLogsCollection,
  createMongoIndexes,
} from './collections';

