/**
 * Utility functions for MCP tools.
 * These helpers are used across clientes.ts, contratos.ts, and acervo.ts to avoid code duplication.
 */

/**
 * Converts object keys from camelCase to snake_case recursively.
 * Handles nested objects and arrays.
 * Preserves null/undefined values.
 * @param obj The object to convert.
 * @returns The converted object.
 */
export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item as Record<string, any>));
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = toSnakeCase(value as Record<string, any>);
  }
  return result;
}

/**
 * Converts object keys from snake_case to camelCase recursively.
 * Handles nested objects and arrays.
 * Preserves null/undefined values.
 * @param obj The object to convert.
 * @returns The converted object.
 */
export function toCamelCase(obj: Record<string, any>): Record<string, any> {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item as Record<string, any>));
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(value as Record<string, any>);
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
    message = (error as any).error || message;
  }

  const text = stack ? `${message}\n${stack}` : message;

  return {
    content: [{ type: 'text', text }],
    isError: true
  };
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