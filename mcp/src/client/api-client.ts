import type { ApiClientConfig, ApiResponse, RequestOptions } from '../types/index';
import { withRetry, isRetryableError } from './retry-logic';

/**
 * Cria um objeto Error com propriedade `status` para erros HTTP.
 * Centraliza a criação de erros HTTP para garantir que `isRetryableError`
 * possa identificar corretamente erros retryable (429, 408, 5xx).
 * 
 * @param message - Mensagem de erro
 * @param status - Código de status HTTP
 * @returns Error com propriedade `status`
 */
function createHttpError(message: string, status: number): Error {
  const error = new Error(message);
  (error as Error & { status: number }).status = status;
  return error;
}

export class SinesysApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Authentication priority: apiKey first, then sessionToken
    if (config.apiKey) {
      this.headers['x-service-api-key'] = config.apiKey;
    } else if (config.sessionToken) {
      this.headers['Authorization'] = `Bearer ${config.sessionToken}`;
    }
  }

  private async request<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    let url = `${this.baseUrl}${endpoint}`;

    // Add query params if provided
    if (options?.params) {
      const queryString = new URLSearchParams(
        Object.entries(options.params).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      url += `?${queryString}`;
    }

    // Prepare fetch config
    const fetchConfig: RequestInit = {
      method: options?.method || 'GET',
      headers: { ...this.headers, ...(options?.headers || {}) },
    };

    // Add body for non-GET methods if provided
    if (options?.body && fetchConfig.method !== 'GET') {
      fetchConfig.body = JSON.stringify(options.body);
    }

    // Execute fetch with retry - usando defaults de retry-logic.ts para consistência
    const response = await withRetry(
      async () => {
        const res = await fetch(url, fetchConfig);
        if (!res.ok) {
          let errorMessage: string;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || `HTTP ${res.status}: ${res.statusText}`;
          } catch {
            const errorText = await res.text();
            errorMessage = errorText || `HTTP ${res.status}: ${res.statusText}`;
          }
          // Usa helper para garantir que status está presente no erro
          throw createHttpError(errorMessage, res.status);
        }
        return res;
      },
      {
        maxAttempts: 3,
        isRetryable: isRetryableError,
      }
    );

    // Respostas 204 (No Content) e 205 (Reset Content) não têm body
    if (response.status === 204 || response.status === 205) {
      return { success: true } as ApiResponse<T>;
    }

    // Lê o body como texto primeiro para tratamento robusto
    const responseText = await response.text();

    // Body vazio também retorna sucesso
    if (!responseText || responseText.trim() === '') {
      return { success: true } as ApiResponse<T>;
    }

    // Tenta fazer parse do JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      // Erro de parse JSON - inclui body e status para debug
      throw createHttpError(
        `Invalid JSON response from server. Status: ${response.status}, Body: ${responseText.substring(0, 200)}`,
        response.status
      );
    }

    // Verifica se já está no formato ApiResponse<T> (tem propriedade success booleana)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'success' in parsed &&
      typeof (parsed as { success: unknown }).success === 'boolean'
    ) {
      return parsed as ApiResponse<T>;
    }

    // Caso contrário, wrapa no formato ApiResponse<T>
    return { success: true, data: parsed } as ApiResponse<T>;
  }

  public async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * Sends a POST request to the specified endpoint with the provided body.
   * POST is typically used for creating new resources or executing actions
   * (e.g., baixa in expedientes-manuais), as opposed to PATCH for partial updates.
   *
   * @param endpoint - The API endpoint to send the request to
   * @param body - The request body data
   * @returns Promise resolving to ApiResponse<T>
   */
  public async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  public async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  public async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}
