/**
 * API Fetch Utility
 *
 * Wrapper para fetch com tratamento de erros padronizado
 * para uso nos componentes de assinatura digital.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: string | FormData | URLSearchParams | null;
}

/**
 * Executa uma requisição fetch com tratamento de erros padronizado.
 *
 * @param url - URL do endpoint
 * @param options - Opções do fetch (method, body, headers, etc.)
 * @returns Promise com a resposta tipada
 *
 * @example
 * ```ts
 * // GET request
 * const response = await apiFetch('/api/users');
 *
 * // POST request
 * const response = await apiFetch('/api/users', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' }),
 * });
 * ```
 */
export async function apiFetch<T = unknown>(
  url: string,
  options?: ApiFetchOptions
): Promise<ApiResponse<T>> {
  try {
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP error: ${response.status}`,
        data: data.data,
      };
    }

    // Se a resposta já segue o formato ApiResponse, retorna diretamente
    if (typeof data.success === 'boolean') {
      return data as ApiResponse<T>;
    }

    // Caso contrário, wrappa os dados
    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    console.error('[apiFetch] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
