/**
 * API Fetch Utility
 *
 * Wrapper para fetch com tratamento de erros padronizado.
 *
 * Motivo de existir aqui (e não em `@/lib/api`):
 * - `src/lib/api/` é um módulo (pasta) com integrações (ex.: 2fauth).
 * - Um arquivo `src/lib/api.ts` cria ambiguidade com `@/lib/api`.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: string | FormData | URLSearchParams | null;
}

/**
 * Executa uma requisição fetch com tratamento de erros padronizado.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options?: ApiFetchOptions
): Promise<ApiResponse<T>> {
  try {
    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
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
    if (typeof data.success === "boolean") {
      return data as ApiResponse<T>;
    }

    // Caso contrário, wrappa os dados
    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    console.error("[apiFetch] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}


