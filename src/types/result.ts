/**
 * CORE TYPES - Tipos compartilhados do sistema (agnóstico de React/Next.js)
 *
 * Convenções:
 * - Result<T> para retornos que podem falhar (preferir ao invés de throw em services)
 * - AppError para erros estruturados com código e contexto
 */

/**
 * Resultado de uma operação que pode falhar.
 * Inspirado no padrão Result/Either de linguagens funcionais.
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Códigos de erro padronizados do sistema.
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'BAD_REQUEST'
  | 'INTERNAL_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'DATABASE_ERROR'
  | 'UNKNOWN';

/**
 * Erro estruturado da aplicação.
 */
export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  cause?: Error;
}

/**
 * Helpers para criar Results.
 */
export const ok = <T>(data: T): Result<T> => ({
  success: true,
  data,
});

export const err = <E = AppError>(error: E): Result<never, E> => ({
  success: false,
  error,
});

/**
 * Helper para criar AppError.
 */
export const appError = (
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error
): AppError => ({
  code,
  message,
  details,
  cause,
});

/**
 * Parâmetros de paginação padrão.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Resposta paginada padrão.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Parâmetros de ordenação padrão.
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}


