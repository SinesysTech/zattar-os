import getLogger from '@/backend/utils/logger';

const logger = getLogger({ service: 'retry-util' });

export interface RetryOptions {
  /** Número máximo de tentativas (incluindo a primeira) */
  maxAttempts: number;
  /** Delay inicial em ms */
  baseDelay: number;
  /** Delay máximo em ms (cap para exponential backoff) */
  maxDelay: number;
  /** Função para determinar se erro é retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback executado antes de cada retry */
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_OPTIONS: Partial<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 100,
  maxDelay: 5000,
  isRetryable: isDefaultRetryableError,
};

/**
 * Determina se um erro é retryable por padrão
 * Retorna true para erros de rede, timeout, e erros temporários do banco
 */
function isDefaultRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const message = error.message.toLowerCase();
  
  // Erros de rede/timeout
  if (message.includes('timeout') || 
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('network')) {
    return true;
  }
  
  // Erros temporários do Postgres
  if (message.includes('deadlock') ||
      message.includes('lock timeout') ||
      message.includes('connection') ||
      message.includes('too many connections')) {
    return true;
  }
  
  // Erros HTTP 5xx (server errors)
  if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
    const status = (error as { status: number }).status;
    return status >= 500 && status < 600;
  }
  
  return false;
}

/**
 * Executa uma função com retry automático em caso de falha
 * Usa exponential backoff com jitter para evitar thundering herd
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options } as Required<RetryOptions>;
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Se não é retryable ou é a última tentativa, lança o erro
      if (!opts.isRetryable(error) || attempt === opts.maxAttempts) {
        logger.error(
          { 
            error: error instanceof Error ? error.message : String(error),
            attempt,
            maxAttempts: opts.maxAttempts,
            retryable: opts.isRetryable(error),
          },
          'Retry failed - throwing error'
        );
        throw error;
      }
      
      // Calcula delay com exponential backoff + jitter
      const exponentialDelay = opts.baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
      const delay = Math.min(exponentialDelay + jitter, opts.maxDelay);
      
      logger.warn(
        {
          error: error instanceof Error ? error.message : String(error),
          attempt,
          maxAttempts: opts.maxAttempts,
          delayMs: Math.round(delay),
        },
        'Retrying after error'
      );
      
      // Callback antes do retry
      opts.onRetry?.(attempt, error);
      
      // Aguarda antes de tentar novamente
      await sleep(delay);
    }
  }
  
  // Nunca deve chegar aqui, mas TypeScript precisa
  throw lastError;
}

/**
 * Helper para aguardar um tempo em ms
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrapper para criar função retryable com opções pré-configuradas
 */
export function createRetryable<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  options: Partial<RetryOptions> = {}
): T {
  return ((...args: Parameters<T>) => {
    return withRetry(() => fn(...args), options);
  }) as T;
}