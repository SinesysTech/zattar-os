/**
 * Logger estruturado para serviços de Assinatura Digital
 *
 * Fornece logs padronizados com contexto, timing e métricas para
 * facilitar debugging e monitoramento em produção.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  service: string;
  operation: string;
  [key: string]: unknown;
}

interface LogMetrics {
  duration_ms?: number;
  count?: number;
  [key: string]: unknown;
}

const LOG_PREFIX = '[ASSINATURA_DIGITAL]';

/**
 * Formata timestamp para logs
 */
function formatTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Cria mensagem de log estruturada
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  context?: LogContext,
  metrics?: LogMetrics
): string {
  const parts = [
    LOG_PREFIX,
    `[${level.toUpperCase()}]`,
    context?.service ? `[${context.service}]` : '',
    context?.operation ? `[${context.operation}]` : '',
    message,
  ].filter(Boolean);

  let logStr = parts.join(' ');

  // Adicionar contexto e métricas em JSON
  const extra: Record<string, unknown> = {};
  if (context) {
    const { service: _service, operation: _operation, ...rest } = context;
    if (Object.keys(rest).length > 0) {
      extra.context = rest;
    }
  }
  if (metrics) {
    extra.metrics = metrics;
  }

  if (Object.keys(extra).length > 0) {
    logStr += ` ${JSON.stringify(extra)}`;
  }

  return logStr;
}

/**
 * Logger para serviços de assinatura digital
 */
export const logger = {
  debug(message: string, context?: LogContext, metrics?: LogMetrics): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatTimestamp(), formatLogMessage('debug', message, context, metrics));
    }
  },

  info(message: string, context?: LogContext, metrics?: LogMetrics): void {
    console.info(formatTimestamp(), formatLogMessage('info', message, context, metrics));
  },

  warn(message: string, context?: LogContext, metrics?: LogMetrics): void {
    console.warn(formatTimestamp(), formatLogMessage('warn', message, context, metrics));
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorInfo = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;

    console.error(
      formatTimestamp(),
      formatLogMessage('error', message, context),
      errorInfo ? JSON.stringify({ error: errorInfo }) : ''
    );
  },
};

/**
 * Helper para medir tempo de execução de operações
 */
export function createTimer() {
  const start = performance.now();

  return {
    elapsed(): number {
      return Math.round(performance.now() - start);
    },

    log(message: string, context?: LogContext, additionalMetrics?: LogMetrics): void {
      const duration_ms = this.elapsed();
      logger.info(message, context, { duration_ms, ...additionalMetrics });
    },
  };
}

/**
 * Contextos pré-definidos para serviços
 */
export const LogServices = {
  TEMPLATES: 'templates',
  FORMULARIOS: 'formularios',
  SEGMENTOS: 'segmentos',
  SIGNATURE: 'signature',
  STORAGE: 'storage',
  PDF: 'pdf',
  DASHBOARD: 'dashboard',
} as const;

/**
 * Operações comuns
 */
export const LogOperations = {
  LIST: 'list',
  GET: 'get',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  PREVIEW: 'preview',
  FINALIZE: 'finalize',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
} as const;
