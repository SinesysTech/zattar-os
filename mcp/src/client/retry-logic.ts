export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  isRetryable?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Partial<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  isRetryable: isRetryableError,
};

export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  // Erros de rede
  if (message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('network')) {
    return true;
  }

  // Erros HTTP
  if ('status' in error && typeof (error as any).status === 'number') {
    const status = (error as any).status;
    // 5xx, 429, 408 são retryable
    if (status >= 500 && status < 600) return true;
    if (status === 429 || status === 408) return true;
    // Outros 4xx, 401, 403 não são retryable
    return false;
  }

  return false;
}

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

      if (!opts.isRetryable(error) || attempt === opts.maxAttempts) {
        console.warn(
          `Retry failed - throwing error: ${error instanceof Error ? error.message : String(error)}, attempt: ${attempt}, maxAttempts: ${opts.maxAttempts}, retryable: ${opts.isRetryable(error)}`
        );
        throw error;
      }

      const exponentialDelay = opts.baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.3 * exponentialDelay;
      const delay = Math.min(exponentialDelay + jitter, opts.maxDelay);

      console.warn(
        `Retrying after error: ${error instanceof Error ? error.message : String(error)}, attempt: ${attempt}, maxAttempts: ${opts.maxAttempts}, delayMs: ${Math.round(delay)}`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}