/**
 * Utility functions for MCP tools.
 * These helpers are used across clientes.ts, contratos.ts, and acervo.ts to avoid code duplication.
 */

/**
 * Converts object keys from camelCase to snake_case recursively.
 * Handles nested objects and arrays.
 * Preserves null/undefined values and primitives as-is.
 * @param obj The object to convert (can be unknown for flexibility with MCP handlers).
 * @returns The converted value with same structure but snake_case keys for objects.
 */
export function toSnakeCase(obj: null): null;
export function toSnakeCase(obj: undefined): undefined;
export function toSnakeCase<T extends unknown[]>(obj: T): T;
export function toSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown>;
export function toSnakeCase<T>(obj: T): T;
export function toSnakeCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = toSnakeCase(value);
  }
  return result;
}

/**
 * Converts object keys from snake_case to camelCase recursively.
 * Handles nested objects and arrays.
 * Preserves null/undefined values and primitives as-is.
 * @param obj The object to convert (can be unknown for flexibility with MCP handlers).
 * @returns The converted value with same structure but camelCase keys for objects.
 */
export function toCamelCase(obj: null): null;
export function toCamelCase(obj: undefined): undefined;
export function toCamelCase<T extends unknown[]>(obj: T): T;
export function toCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown>;
export function toCamelCase<T>(obj: T): T;
export function toCamelCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(value);
  }
  return result;
}

/**
 * Formats data into the MCP tool response format.
 * Serializes data to JSON with 2-space indentation.
 * Handles serialization errors (e.g., circular references).
 * @param data The data to format.
 * @returns The formatted response.
 */
export function formatToolResponse(data: unknown): { content: [{ type: 'text'; text: string }] } {
  try {
    const text = JSON.stringify(data, null, 2);
    return {
      content: [{ type: 'text', text }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error serializing response: ${(error as Error).message}` }]
    };
  }
}

/**
 * Formats an error into the MCP tool response format.
 * Extracts message from Error, ApiResponse, or string.
 * Includes stack trace in debug mode.
 * @param error The error to format.
 * @returns The formatted error response.
 */
export function handleToolError(error: unknown): { content: [{ type: 'text'; text: string }]; isError: true } {
  let message = 'Unknown error';
  let stack = '';

  if (error instanceof Error) {
    message = error.message;
    if (process.env.DEBUG === 'true') {
      stack = error.stack || '';
    }
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object' && 'error' in error) {
    // Assuming ApiResponse has error field
    message = (error as { error: string }).error || message;
  }

  const text = stack ? `${message}\n${stack}` : message;

  return {
    content: [{ type: 'text', text }],
    isError: true
  };
}

/**
 * Status finais de uma captura assíncrona.
 */
export type CapturaStatusFinal = 'completed' | 'failed';

/**
 * Status possíveis de uma captura assíncrona.
 */
export type CapturaStatus = 'pending' | 'in_progress' | CapturaStatusFinal;

/**
 * Resultado do polling de captura.
 */
export interface PollingResult {
  success: boolean;
  status: CapturaStatus;
  data?: unknown;
  error?: string;
  timedOut?: boolean;
  totalPolls?: number;
  elapsedMs?: number;
}

/**
 * Opções de configuração para o polling de captura.
 */
export interface PollingOptions {
  /** Intervalo entre polling em milissegundos (padrão: 5000ms = 5s) */
  intervalMs?: number;
  /** Timeout máximo em milissegundos (padrão: 300000ms = 5min) */
  timeoutMs?: number;
}

/**
 * Interface mínima do cliente API para polling (evita import circular).
 */
interface MinimalApiClient {
  get: <T = unknown>(endpoint: string, params?: Record<string, unknown>) => Promise<{
    success: boolean;
    data?: T;
    error?: string;
  }>;
}

/**
 * Helper de polling reutilizável para capturas assíncronas.
 * Consulta o status de uma captura em intervalos regulares até detectar
 * status final (completed/failed) ou timeout.
 * 
 * @param client Cliente API para fazer requisições
 * @param captureId ID da captura a monitorar
 * @param options Configurações de polling (intervalo e timeout)
 * @returns Resultado do polling com status final e dados
 * 
 * @example
 * const result = await pollCapturaStatus(client, 123, { intervalMs: 3000, timeoutMs: 60000 });
 * if (result.success && result.status === 'completed') {
 *   console.log('Captura concluída:', result.data);
 * }
 */
export async function pollCapturaStatus(
  client: MinimalApiClient,
  captureId: number,
  options: PollingOptions = {}
): Promise<PollingResult> {
  const { intervalMs = 5000, timeoutMs = 300000 } = options;
  const startTime = Date.now();
  let pollCount = 0;

  const isFinalStatus = (status: string): status is CapturaStatusFinal => {
    return status === 'completed' || status === 'failed';
  };

  while (true) {
    pollCount++;
    const elapsedMs = Date.now() - startTime;

    // Verificar timeout
    if (elapsedMs >= timeoutMs) {
      return {
        success: false,
        status: 'in_progress',
        error: `Timeout após ${timeoutMs}ms aguardando conclusão da captura`,
        timedOut: true,
        totalPolls: pollCount,
        elapsedMs,
      };
    }

    try {
      const response = await client.get<{
        status: CapturaStatus;
        [key: string]: unknown;
      }>(`/api/captura/historico/${captureId}`);

      if (!response.success) {
        return {
          success: false,
          status: 'failed',
          error: response.error || 'Erro ao consultar status da captura',
          totalPolls: pollCount,
          elapsedMs: Date.now() - startTime,
        };
      }

      const capturaData = response.data;
      const status = capturaData?.status || 'pending';

      // Se status final, retornar resultado
      if (isFinalStatus(status)) {
        return {
          success: status === 'completed',
          status,
          data: capturaData,
          totalPolls: pollCount,
          elapsedMs: Date.now() - startTime,
        };
      }

      // Aguardar intervalo antes do próximo poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erro desconhecido no polling',
        totalPolls: pollCount,
        elapsedMs: Date.now() - startTime,
      };
    }
  }
}

// Inline commented unit tests
// These are example tests; in a real setup, use a testing framework like Jest.

// toSnakeCase tests:
// expect(toSnakeCase({ clienteId: 123, nomeCompleto: 'João' })).toEqual({ cliente_id: 123, nome_completo: 'João' });
// expect(toSnakeCase({ nested: { subKey: 'value' } })).toEqual({ nested: { sub_key: 'value' } });
// expect(toSnakeCase([ { itemId: 1 }, { itemId: 2 } ])).toEqual([ { item_id: 1 }, { item_id: 2 } ]);
// expect(toSnakeCase(null)).toBe(null);
// expect(toSnakeCase(undefined)).toBe(undefined);
// expect(toSnakeCase('string')).toBe('string');

// toCamelCase tests:
// expect(toCamelCase({ cliente_id: 123, nome_completo: 'João' })).toEqual({ clienteId: 123, nomeCompleto: 'João' });
// expect(toCamelCase({ nested: { sub_key: 'value' } })).toEqual({ nested: { subKey: 'value' } });
// expect(toCamelCase([ { item_id: 1 }, { item_id: 2 } ])).toEqual([ { itemId: 1 }, { itemId: 2 } ]);
// expect(toCamelCase(null)).toBe(null);
// expect(toCamelCase(undefined)).toBe(undefined);
// expect(toCamelCase('string')).toBe('string');

// formatToolResponse tests:
// expect(formatToolResponse({ key: 'value' })).toEqual({ content: [{ type: 'text', text: '{\n  "key": "value"\n}' }] });
// const circular: any = {}; circular.self = circular;
// expect(formatToolResponse(circular).content[0].text).toContain('Error serializing response');

// handleToolError tests:
// expect(handleToolError(new Error('Test error'))).toEqual({ content: [{ type: 'text', text: 'Test error' }], isError: true });
// process.env.DEBUG = 'true';
// expect(handleToolError(new Error('Test error')).content[0].text).toContain('Test error\n');
// process.env.DEBUG = undefined;
// expect(handleToolError('String error')).toEqual({ content: [{ type: 'text', text: 'String error' }], isError: true });
// expect(handleToolError({ error: 'Api error' })).toEqual({ content: [{ type: 'text', text: 'Api error' }], isError: true });
