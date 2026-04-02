/**
 * Classes de erro customizadas para o serviço de captura de partes
 * Facilitam tratamento específico e logging estruturado
 */

/**
 * Erro base para todos os erros de captura
 */
export class CapturaPartesError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CapturaPartesError';
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Erro de validação de dados PJE
 */
export class ValidationError extends CapturaPartesError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, context);
    this.name = 'ValidationError';
  }
}

/**
 * Erro ao persistir dados no banco
 */
export class PersistenceError extends CapturaPartesError {
  constructor(
    message: string,
    public readonly operation: 'insert' | 'update' | 'delete' | 'upsert',
    public readonly entity: 'cliente' | 'parte_contraria' | 'terceiro' | 'representante' | 'endereco' | 'vinculo',
    context?: Record<string, unknown>
  ) {
    super('PERSISTENCE_ERROR', message, { ...context, operation, entity });
    this.name = 'PersistenceError';
  }
}

/**
 * Erro ao buscar dados da API PJE
 */
export class PJEAPIError extends CapturaPartesError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    context?: Record<string, unknown>
  ) {
    super('PJE_API_ERROR', message, { ...context, statusCode });
    this.name = 'PJEAPIError';
  }
}

/**
 * Erro ao adquirir distributed lock
 */
export class LockError extends CapturaPartesError {
  constructor(message: string, public readonly lockKey: string, context?: Record<string, unknown>) {
    super('LOCK_ERROR', message, { ...context, lockKey });
    this.name = 'LockError';
  }
}

/**
 * Erro de timeout em operação
 */
export class TimeoutError extends CapturaPartesError {
  constructor(
    message: string,
    public readonly timeoutMs: number,
    context?: Record<string, unknown>
  ) {
    super('TIMEOUT_ERROR', message, { ...context, timeoutMs });
    this.name = 'TimeoutError';
  }
}

/**
 * Erro de configuração inválida
 */
export class ConfigurationError extends CapturaPartesError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('CONFIGURATION_ERROR', message, context);
    this.name = 'ConfigurationError';
  }
}

/**
 * Type guard para verificar se erro é CapturaPartesError
 */
export function isCapturaPartesError(error: unknown): error is CapturaPartesError {
  return error instanceof CapturaPartesError;
}

/**
 * Helper para extrair informações de erro de forma segura
 */
export function extractErrorInfo(error: unknown): {
  message: string;
  code?: string;
  context?: Record<string, unknown>;
  stack?: string;
} {
  if (isCapturaPartesError(error)) {
    return {
      message: error.message,
      code: error.code,
      context: error.context,
      stack: error.stack,
    };
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  
  return {
    message: String(error),
  };
}