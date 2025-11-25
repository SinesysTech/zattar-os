import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage para correlation IDs
export const correlationStorage = new AsyncLocalStorage<{ correlationId: string }>();

// Configuração do logger
const loggerConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
    }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Em desenvolvimento, usar pretty print
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
};

export const baseLogger = pino(loggerConfig);

// Logger com correlation ID automático
export function getLogger(context?: Record<string, unknown>) {
  const store = correlationStorage.getStore();
  const correlationId = store?.correlationId;
  
  return baseLogger.child({
    ...(correlationId && { correlationId }),
    ...context,
  });
}

// Helper para criar correlation ID e executar função com contexto
export async function withCorrelationId<T>(
  fn: () => Promise<T>,
  correlationId?: string
): Promise<T> {
  const id = correlationId || crypto.randomUUID();
  return correlationStorage.run({ correlationId: id }, fn);
}

// Tipos para facilitar uso
export type Logger = ReturnType<typeof getLogger>;

// Export default para uso simples
export default getLogger;