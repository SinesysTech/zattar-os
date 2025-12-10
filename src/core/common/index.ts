/**
 * CORE COMMON - Exports públicos
 */

// Tipos e helpers de resultado
export {
  type Result,
  type ErrorCode,
  type AppError,
  type PaginationParams,
  type PaginatedResponse,
  type SortParams,
  ok,
  err,
  appError,
} from './types';

// Cliente de banco
export { createDbClient, getDbClient, type DbClient } from './db';
