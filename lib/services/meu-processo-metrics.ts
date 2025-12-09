/**
 * Módulo de Métricas e Logging
 * 
 * Centraliza coleta de métricas, logs estruturados e monitoramento
 * para a API Meu Processo.
 */

// =============================================================================
// TIPOS
// =============================================================================

export type APISource = 'sinesys' | 'n8n' | 'fallback';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface RequestMetrics {
  cpf_masked: string;
  api_source: APISource;
  duration_ms: number;
  success: boolean;
  error_type?: string;
  error_message?: string;
  data_counts?: {
    processos: number;
    audiencias: number;
    contratos: number;
    acordos: number;
  };
  timestamp: string;
}

export interface PerformanceMetrics {
  endpoint: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_duration_ms: number;
  p95_duration_ms: number;
  p99_duration_ms: number;
  api_source_distribution: Record<APISource, number>;
  error_distribution: Record<string, number>;
  last_reset: string;
}

// =============================================================================
// STORAGE IN-MEMORY (Production: usar Redis)
// =============================================================================

class MetricsStore {
  private requests: RequestMetrics[] = [];
  private maxStoredRequests = 1000; // Manter últimas 1000 requisições
  private resetTime = Date.now();

  addRequest(metrics: RequestMetrics) {
    this.requests.push(metrics);

    // Limitar tamanho do array
    if (this.requests.length > this.maxStoredRequests) {
      this.requests.shift();
    }
  }

  getRequests(): RequestMetrics[] {
    return [...this.requests];
  }

  getStats(): PerformanceMetrics {
    if (this.requests.length === 0) {
      return {
        endpoint: '/api/meu-processo/consulta',
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        avg_duration_ms: 0,
        p95_duration_ms: 0,
        p99_duration_ms: 0,
        api_source_distribution: { sinesys: 0, n8n: 0, fallback: 0 },
        error_distribution: {},
        last_reset: new Date(this.resetTime).toISOString(),
      };
    }

    const successful = this.requests.filter(r => r.success);
    const failed = this.requests.filter(r => !r.success);

    // Calcular durations
    const durations = this.requests.map(r => r.duration_ms).sort((a, b) => a - b);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    // API source distribution
    const apiSourceDist: Record<APISource, number> = { sinesys: 0, n8n: 0, fallback: 0 };
    this.requests.forEach(r => {
      apiSourceDist[r.api_source] = (apiSourceDist[r.api_source] || 0) + 1;
    });

    // Error distribution
    const errorDist: Record<string, number> = {};
    failed.forEach(r => {
      if (r.error_type) {
        errorDist[r.error_type] = (errorDist[r.error_type] || 0) + 1;
      }
    });

    return {
      endpoint: '/api/meu-processo/consulta',
      total_requests: this.requests.length,
      successful_requests: successful.length,
      failed_requests: failed.length,
      avg_duration_ms: Math.round(avgDuration),
      p95_duration_ms: durations[p95Index] || 0,
      p99_duration_ms: durations[p99Index] || 0,
      api_source_distribution: apiSourceDist,
      error_distribution: errorDist,
      last_reset: new Date(this.resetTime).toISOString(),
    };
  }

  reset() {
    this.requests = [];
    this.resetTime = Date.now();
  }
}

// Singleton
const metricsStore = new MetricsStore();

// =============================================================================
// LOGGING ESTRUTURADO
// =============================================================================

/**
 * Logger estruturado com níveis de log
 */
export class MeuProcessoLogger {
  private context: string;

  constructor(context: string = 'MeuProcesso') {
    this.context = context;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(data && { data }),
    };

    // Em produção, enviar para serviço de logging (Sentry, Datadog, etc.)
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`;

    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(formattedMessage, data || '');
        }
        break;
      case 'info':
        console.log(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'error':
        console.error(formattedMessage, data || '');
        break;
    }

    return logEntry;
  }

  debug(message: string, data?: Record<string, unknown>) {
    return this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>) {
    return this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    return this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>) {
    return this.log('error', message, data);
  }

  /**
   * Log de requisição com mascaramento de CPF
   */
  logRequest(cpf: string, apiSource: APISource, message: string) {
    const cpfMasked = this.maskCPF(cpf);
    return this.info(message, { cpf: cpfMasked, api_source: apiSource });
  }

  /**
   * Log de erro com contexto
   */
  logError(error: Error, context?: Record<string, unknown>) {
    return this.error(error.message, {
      error_name: error.name,
      error_stack: error.stack,
      ...context,
    });
  }

  /**
   * Mascara CPF para logs (mantém últimos 4 dígitos)
   */
  private maskCPF(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `***.***.*${cleaned.slice(-2)}`;
    }
    return '***';
  }
}

// =============================================================================
// MÉTRICAS
// =============================================================================

/**
 * Registra métricas de uma requisição
 */
export function recordRequestMetrics(metrics: Omit<RequestMetrics, 'timestamp'>) {
  const completeMetrics: RequestMetrics = {
    ...metrics,
    timestamp: new Date().toISOString(),
  };

  metricsStore.addRequest(completeMetrics);

  // Log estruturado
  const logger = new MeuProcessoLogger();
  
  if (metrics.success) {
    logger.info(`Requisição concluída com sucesso via ${metrics.api_source}`, {
      duration_ms: metrics.duration_ms,
      data_counts: metrics.data_counts,
    });
  } else {
    logger.error(`Requisição falhou via ${metrics.api_source}`, {
      duration_ms: metrics.duration_ms,
      error_type: metrics.error_type,
      error_message: metrics.error_message,
    });
  }
}

/**
 * Obtém estatísticas agregadas
 */
export function getMetricsStats(): PerformanceMetrics {
  return metricsStore.getStats();
}

/**
 * Obtém histórico de requisições
 */
export function getRequestHistory(limit?: number): RequestMetrics[] {
  const requests = metricsStore.getRequests();
  if (limit && limit > 0) {
    return requests.slice(-limit);
  }
  return requests;
}

/**
 * Reseta métricas
 */
export function resetMetrics() {
  metricsStore.reset();
}

/**
 * Helper para medir tempo de execução
 */
export class Timer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  elapsed(): number {
    return Date.now() - this.startTime;
  }

  stop(): number {
    const elapsed = this.elapsed();
    return elapsed;
  }
}

// =============================================================================
// ALERTAS
// =============================================================================

export interface AlertCondition {
  name: string;
  check: (stats: PerformanceMetrics) => boolean;
  message: (stats: PerformanceMetrics) => string;
  severity: 'info' | 'warning' | 'critical';
}

/**
 * Condições de alerta padrão
 */
export const defaultAlertConditions: AlertCondition[] = [
  {
    name: 'high_error_rate',
    check: (stats) => {
      const errorRate = stats.failed_requests / stats.total_requests;
      return errorRate > 0.1; // > 10% de erro
    },
    message: (stats) => {
      const errorRate = ((stats.failed_requests / stats.total_requests) * 100).toFixed(1);
      return `Taxa de erro alta: ${errorRate}% (${stats.failed_requests}/${stats.total_requests})`;
    },
    severity: 'warning',
  },
  {
    name: 'critical_error_rate',
    check: (stats) => {
      const errorRate = stats.failed_requests / stats.total_requests;
      return errorRate > 0.5; // > 50% de erro
    },
    message: (stats) => {
      const errorRate = ((stats.failed_requests / stats.total_requests) * 100).toFixed(1);
      return `Taxa de erro crítica: ${errorRate}% (${stats.failed_requests}/${stats.total_requests})`;
    },
    severity: 'critical',
  },
  {
    name: 'high_latency',
    check: (stats) => stats.p95_duration_ms > 10000, // P95 > 10s
    message: (stats) => `Latência alta: P95=${stats.p95_duration_ms}ms`,
    severity: 'warning',
  },
  {
    name: 'using_fallback',
    check: (stats) => {
      const fallbackRate = stats.api_source_distribution.fallback / stats.total_requests;
      return fallbackRate > 0.1; // > 10% usando fallback
    },
    message: (stats) => {
      const fallbackRate = ((stats.api_source_distribution.fallback / stats.total_requests) * 100).toFixed(1);
      return `Uso frequente de fallback: ${fallbackRate}% das requisições`;
    },
    severity: 'info',
  },
];

/**
 * Verifica condições de alerta
 */
export function checkAlerts(
  conditions: AlertCondition[] = defaultAlertConditions
): Array<{ condition: AlertCondition; triggered: boolean; message?: string }> {
  const stats = getMetricsStats();

  return conditions.map(condition => {
    const triggered = condition.check(stats);
    return {
      condition,
      triggered,
      message: triggered ? condition.message(stats) : undefined,
    };
  });
}
