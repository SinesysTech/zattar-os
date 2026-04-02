/**
 * Configurações do serviço de captura de partes
 * Centralizadas para facilitar ajustes e testes
 */

export const CAPTURA_CONFIG = {
  /**
   * Performance
   */
  // Número máximo de partes processadas simultaneamente
  MAX_CONCURRENT_PARTES: parseInt(process.env.CAPTURA_MAX_CONCURRENT_PARTES || '5', 10),
  
  // Número máximo de representantes processados simultaneamente por parte
  MAX_CONCURRENT_REPRESENTANTES: parseInt(process.env.CAPTURA_MAX_CONCURRENT_REPS || '3', 10),
  
  // Threshold de performance (ms) - alerta se excedido
  PERFORMANCE_THRESHOLD_MS: parseInt(process.env.CAPTURA_PERF_THRESHOLD_MS || '5000', 10),
  
  /**
   * Retry
   */
  // Número máximo de tentativas para operações retryable
  RETRY_MAX_ATTEMPTS: parseInt(process.env.CAPTURA_RETRY_MAX_ATTEMPTS || '3', 10),
  
  // Delay inicial entre retries (ms)
  RETRY_BASE_DELAY_MS: parseInt(process.env.CAPTURA_RETRY_BASE_DELAY_MS || '100', 10),
  
  // Delay máximo entre retries (ms)
  RETRY_MAX_DELAY_MS: parseInt(process.env.CAPTURA_RETRY_MAX_DELAY_MS || '5000', 10),
  
  /**
   * Locking
   */
  // TTL do distributed lock (segundos)
  LOCK_TTL_SECONDS: parseInt(process.env.CAPTURA_LOCK_TTL_SECONDS || '300', 10),
  
  // Timeout para adquirir lock (ms) - 0 = não espera
  LOCK_ACQUIRE_TIMEOUT_MS: parseInt(process.env.CAPTURA_LOCK_TIMEOUT_MS || '0', 10),
  
  /**
   * Validação
   */
  // Se true, validação estrita de schemas PJE (rejeita dados inválidos)
  STRICT_VALIDATION: process.env.CAPTURA_STRICT_VALIDATION === 'true',
  
  // Se true, valida campos obrigatórios antes de persistir
  VALIDATE_REQUIRED_FIELDS: process.env.CAPTURA_VALIDATE_REQUIRED !== 'false', // default true
  
  /**
   * Logging
   */
  // Nível de log (debug, info, warn, error)
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Se true, loga payloads completos (útil para debug, mas verboso)
  LOG_PAYLOADS: process.env.CAPTURA_LOG_PAYLOADS === 'true',
  
  /**
   * Features flags
   */
  // Se true, usa processamento paralelo de partes
  ENABLE_PARALLEL_PROCESSING: process.env.CAPTURA_PARALLEL !== 'false', // default true
  
  // Se true, usa distributed locking
  ENABLE_DISTRIBUTED_LOCK: process.env.CAPTURA_DISTRIBUTED_LOCK !== 'false', // default true
  
  // Se true, usa retry mechanism
  ENABLE_RETRY: process.env.CAPTURA_RETRY !== 'false', // default true
} as const;

/**
 * Valida configurações no startup
 * Lança erro se configuração inválida
 */
export function validateConfig(): void {
  const errors: string[] = [];
  
  if (CAPTURA_CONFIG.MAX_CONCURRENT_PARTES < 1) {
    errors.push('MAX_CONCURRENT_PARTES deve ser >= 1');
  }
  
  if (CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS < 1) {
    errors.push('RETRY_MAX_ATTEMPTS deve ser >= 1');
  }
  
  if (CAPTURA_CONFIG.RETRY_BASE_DELAY_MS < 0) {
    errors.push('RETRY_BASE_DELAY_MS deve ser >= 0');
  }
  
  if (CAPTURA_CONFIG.LOCK_TTL_SECONDS < 1) {
    errors.push('LOCK_TTL_SECONDS deve ser >= 1');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuração inválida: ${errors.join('; ')}`);
  }
}

// Valida no import
validateConfig();