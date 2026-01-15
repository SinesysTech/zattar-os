/**
 * Cliente HTTP base para a API do Chatwoot
 * Implementa autenticação, retry e error handling
 */

import {
  ChatwootConfig,
  ChatwootError,
  ChatwootApiError,
  ChatwootResult,
} from "./types";

// =============================================================================
// Configuração
// =============================================================================

const DEFAULT_TIMEOUT = 30000; // 30 segundos
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 segundo

/**
 * Obtém configuração do Chatwoot das variáveis de ambiente
 */
export function getChatwootConfig(): ChatwootConfig | null {
  const apiUrl = process.env.CHATWOOT_API_URL;
  const apiKey = process.env.CHATWOOT_API_KEY;
  const accountId = process.env.CHATWOOT_ACCOUNT_ID;
  const defaultInboxId = process.env.CHATWOOT_DEFAULT_INBOX_ID;

  if (!apiUrl || !apiKey || !accountId) {
    return null;
  }

  return {
    apiUrl: apiUrl.replace(/\/$/, ""), // Remove trailing slash
    apiKey,
    accountId: parseInt(accountId, 10),
    defaultInboxId: defaultInboxId ? parseInt(defaultInboxId, 10) : undefined,
  };
}

/**
 * Verifica se o Chatwoot está configurado
 */
export function isChatwootConfigured(): boolean {
  return getChatwootConfig() !== null;
}

// =============================================================================
// Cliente HTTP
// =============================================================================

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  timeout?: number;
}

/**
 * Aguarda um tempo especificado (para retry)
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calcula delay exponencial para retry
 */
function getRetryDelay(attempt: number): number {
  return RETRY_DELAY_BASE * Math.pow(2, attempt);
}

/**
 * Verifica se o erro é recuperável (deve fazer retry)
 */
function isRetryableError(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

/**
 * Constrói URL com query params
 */
function buildUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number | undefined>
): string {
  const url = new URL(path, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Executa requisição HTTP para a API do Chatwoot
 */
async function executeRequest<T>(
  config: ChatwootConfig,
  options: RequestOptions,
  attempt = 0
): Promise<ChatwootResult<T>> {
  const { method, path, body, params, timeout = DEFAULT_TIMEOUT } = options;

  const url = buildUrl(config.apiUrl, path, params);

  const headers: Record<string, string> = {
    api_access_token: config.apiKey,
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Se sucesso, retorna dados
    if (response.ok) {
      // DELETE pode retornar 204 sem body
      if (response.status === 204) {
        return { success: true, data: {} as T };
      }

      const data = await response.json();
      return { success: true, data };
    }

    // Se erro recuperável e ainda tem tentativas, faz retry
    if (isRetryableError(response.status) && attempt < MAX_RETRIES) {
      const delay = getRetryDelay(attempt);
      console.warn(
        `[Chatwoot] Retry ${
          attempt + 1
        }/${MAX_RETRIES} após ${delay}ms (status: ${response.status})`
      );
      await sleep(delay);
      return executeRequest<T>(config, options, attempt + 1);
    }

    // Erro não recuperável ou máximo de retries atingido
    let apiError: ChatwootApiError | undefined;
    try {
      apiError = await response.json();
    } catch {
      // Response não é JSON
    }

    const errorMessage =
      apiError?.message || // Alguns endpoints retornam { message: "..." }
      apiError?.error || // Alguns endpoints retornam { error: "..." }
      apiError?.description ||
      apiError?.errors?.[0]?.message ||
      `HTTP ${response.status}: ${response.statusText}`;

    return {
      success: false,
      error: new ChatwootError(errorMessage, response.status, apiError),
    };
  } catch (err) {
    clearTimeout(timeoutId);

    // Erro de timeout
    if (err instanceof Error && err.name === "AbortError") {
      return {
        success: false,
        error: new ChatwootError(`Request timeout após ${timeout}ms`, 0),
      };
    }

    // Erro de rede - pode fazer retry
    if (attempt < MAX_RETRIES) {
      const delay = getRetryDelay(attempt);
      console.warn(
        `[Chatwoot] Retry ${
          attempt + 1
        }/${MAX_RETRIES} após erro de rede: ${err}`
      );
      await sleep(delay);
      return executeRequest<T>(config, options, attempt + 1);
    }

    // Erro genérico
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return {
      success: false,
      error: new ChatwootError(`Erro de rede: ${message}`, 0),
    };
  }
}

// =============================================================================
// API Client
// =============================================================================

/**
 * Cliente para a API do Chatwoot
 */
export class ChatwootClient {
  private config: ChatwootConfig;

  constructor(config?: ChatwootConfig) {
    const resolvedConfig = config ?? getChatwootConfig();

    if (!resolvedConfig) {
      throw new Error(
        "Chatwoot não configurado. Defina as variáveis de ambiente: " +
          "CHATWOOT_API_URL, CHATWOOT_API_KEY, CHATWOOT_ACCOUNT_ID"
      );
    }

    this.config = resolvedConfig;
  }

  /**
   * Obtém a configuração atual
   */
  getConfig(): ChatwootConfig {
    return this.config;
  }

  /**
   * Obtém o account_id configurado
   */
  getAccountId(): number {
    return this.config.accountId;
  }

  /**
   * Obtém o inbox_id padrão
   */
  getDefaultInboxId(): number | undefined {
    return this.config.defaultInboxId;
  }

  /**
   * Executa GET request
   */
  async get<T>(
    path: string,
    params?: Record<string, string | number | undefined>
  ): Promise<ChatwootResult<T>> {
    return executeRequest<T>(this.config, { method: "GET", path, params });
  }

  /**
   * Executa POST request
   */
  async post<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | undefined>
  ): Promise<ChatwootResult<T>> {
    return executeRequest<T>(this.config, {
      method: "POST",
      path,
      body,
      params,
    });
  }

  /**
   * Executa PUT request
   */
  async put<T>(
    path: string,
    body?: unknown,
    params?: Record<string, string | number | undefined>
  ): Promise<ChatwootResult<T>> {
    return executeRequest<T>(this.config, {
      method: "PUT",
      path,
      body,
      params,
    });
  }

  /**
   * Executa DELETE request
   */
  async delete<T>(
    path: string,
    params?: Record<string, string | number | undefined>
  ): Promise<ChatwootResult<T>> {
    return executeRequest<T>(this.config, { method: "DELETE", path, params });
  }
}

// =============================================================================
// Singleton
// =============================================================================

let clientInstance: ChatwootClient | null = null;

/**
 * Obtém instância singleton do cliente Chatwoot
 */
export function getChatwootClient(): ChatwootClient {
  if (!clientInstance) {
    clientInstance = new ChatwootClient();
  }
  return clientInstance;
}

/**
 * Reseta o singleton (útil para testes)
 */
export function resetChatwootClient(): void {
  clientInstance = null;
}
