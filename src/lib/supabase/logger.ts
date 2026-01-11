/**
 * Supabase Query Logger
 *
 * Logs legíveis para debug de queries Supabase.
 * Habilite com DEBUG_SUPABASE=true no .env.local
 *
 * Exemplo de output:
 *   [Supabase] GET clientes (filter: nome~JEFFERSON) 200 in 91ms
 *   [Supabase] GET processo_partes (filter: entidade_id in 1597) 200 in 49ms
 */

import { sanitizeForLogs } from '@/lib/utils/sanitize-logs';

const DEBUG_ENABLED = process.env.DEBUG_SUPABASE === 'true';

interface QueryLogParams {
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT' | 'RPC';
  filters?: Record<string, unknown>;
  select?: string;
  duration?: number;
  status?: number;
  error?: string;
  rowCount?: number;
}

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function formatFilters(filters?: Record<string, unknown>): string {
  if (!filters || Object.keys(filters).length === 0) return '';

  const sanitizedFilters = sanitizeForLogs(filters) as Record<string, unknown>;

  const parts: string[] = [];
  for (const [key, value] of Object.entries(sanitizedFilters)) {
    if (value === undefined || value === null) continue;

    // Simplificar valores longos
    let displayValue = String(value);
    if (displayValue.length > 30) {
      displayValue = displayValue.substring(0, 27) + '...';
    }

    parts.push(`${key}=${displayValue}`);
  }

  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}

function formatDuration(ms?: number): string {
  if (!ms) return '';
  if (ms < 100) return `${COLORS.green}${ms}ms${COLORS.reset}`;
  if (ms < 500) return `${COLORS.yellow}${ms}ms${COLORS.reset}`;
  return `${COLORS.red}${ms}ms${COLORS.reset}`;
}

function formatStatus(status?: number): string {
  if (!status) return '';
  if (status >= 200 && status < 300) return `${COLORS.green}${status}${COLORS.reset}`;
  if (status >= 400) return `${COLORS.red}${status}${COLORS.reset}`;
  return `${COLORS.yellow}${status}${COLORS.reset}`;
}

function formatOperation(op: QueryLogParams['operation']): string {
  const opColors: Record<string, string> = {
    SELECT: COLORS.cyan,
    INSERT: COLORS.green,
    UPDATE: COLORS.yellow,
    DELETE: COLORS.red,
    UPSERT: COLORS.magenta,
    RPC: COLORS.magenta,
  };
  return `${opColors[op] || ''}${op}${COLORS.reset}`;
}

export function logQuery(params: QueryLogParams): void {
  if (!DEBUG_ENABLED) return;

  const sanitizedParams: QueryLogParams = {
    ...params,
    filters: params.filters ? (sanitizeForLogs(params.filters) as Record<string, unknown>) : undefined,
  };

  const { table, operation, filters, duration, status, error, rowCount } = sanitizedParams;

  const parts = [
    `${COLORS.dim}[Supabase]${COLORS.reset}`,
    formatOperation(operation),
    `${COLORS.cyan}${table}${COLORS.reset}`,
  ];

  const filterStr = formatFilters(filters);
  if (filterStr) parts.push(filterStr);

  if (status) parts.push(formatStatus(status));
  if (duration) parts.push(`in ${formatDuration(duration)}`);
  if (rowCount !== undefined) parts.push(`${COLORS.dim}(${rowCount} rows)${COLORS.reset}`);

  if (error) {
    console.error(parts.join(' '), `${COLORS.red}ERROR: ${error}${COLORS.reset}`);
  } else {
    console.log(parts.join(' '));
  }
}

export function logQueryStart(_table: string, _operation: QueryLogParams['operation']): number {
  return DEBUG_ENABLED ? performance.now() : 0;
}

export function logQueryEnd(
  startTime: number,
  table: string,
  operation: QueryLogParams['operation'],
  options?: {
    filters?: Record<string, unknown>;
    status?: number;
    error?: string;
    rowCount?: number;
  }
): void {
  if (!DEBUG_ENABLED || !startTime) return;

  const duration = Math.round(performance.now() - startTime);
  logQuery({
    table,
    operation,
    duration,
    ...options,
  });
}

/**
 * Parse Supabase URL para extrair tabela e filtros
 * Útil para interceptar e logar fetch requests
 */
export function parseSupabaseUrl(url: string): { table: string; filters: Record<string, string> } | null {
  try {
    const urlObj = new URL(url);

    // Verificar se é uma URL do Supabase REST API
    if (!urlObj.pathname.includes('/rest/v1/')) return null;

    // Extrair nome da tabela
    const pathParts = urlObj.pathname.split('/rest/v1/');
    if (pathParts.length < 2) return null;

    const table = pathParts[1].split('/')[0].split('?')[0];

    // Extrair filtros simplificados
    const filters: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      if (key === 'select' || key === 'order' || key === 'offset' || key === 'limit') return;

      // Decodificar e simplificar
      const decoded = decodeURIComponent(value);
      if (decoded.length > 50) {
        filters[key] = decoded.substring(0, 47) + '...';
      } else {
        filters[key] = decoded;
      }
    });

    return { table, filters };
  } catch {
    return null;
  }
}

/**
 * Logger simples para usar em qualquer lugar
 */
export const supabaseLogger = {
  debug: (message: string, data?: unknown) => {
    if (!DEBUG_ENABLED) return;
    console.log(
      `${COLORS.dim}[Supabase]${COLORS.reset} ${message}`,
      data === undefined ? '' : sanitizeForLogs(data)
    );
  },

  info: (message: string, data?: unknown) => {
    if (!DEBUG_ENABLED) return;
    console.log(
      `${COLORS.cyan}[Supabase]${COLORS.reset} ${message}`,
      data === undefined ? '' : sanitizeForLogs(data)
    );
  },

  warn: (message: string, data?: unknown) => {
    console.warn(
      `${COLORS.yellow}[Supabase]${COLORS.reset} ${message}`,
      data === undefined ? '' : sanitizeForLogs(data)
    );
  },

  error: (message: string, data?: unknown) => {
    console.error(
      `${COLORS.red}[Supabase]${COLORS.reset} ${message}`,
      data === undefined ? '' : sanitizeForLogs(data)
    );
  },

  query: logQuery,
  startTimer: logQueryStart,
  endTimer: logQueryEnd,
};

export default supabaseLogger;
