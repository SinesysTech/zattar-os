/**
 * 2FAuth HTTP Client
 *
 * Cliente HTTP base para comunicação com a API 2FAuth
 */

import { TwoFAuthConfig, TwoFAuthError, TwoFAuthErrorResponse } from "./types";
import { load2FAuthConfig } from "./config-loader";

/**
 * Configuração resolvida do cliente
 */
interface ResolvedConfig {
  baseUrl: string;
  token: string;
}

/**
 * Resolve a configuração do cliente 2FAuth
 * Prioridade: config fornecido > banco de dados
 */
export async function resolveConfigAsync(
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<ResolvedConfig> {
  let apiUrl = config?.apiUrl;
  let token = config?.token;

  // Se não fornecido, buscar do banco
  if (!apiUrl || !token) {
    const dbConfig = await load2FAuthConfig();
    apiUrl = apiUrl || dbConfig?.apiUrl;
    token = token || dbConfig?.token;
  }

  if (!apiUrl || !token) {
    throw new TwoFAuthError(
      500,
      "2FAuth não configurado. Configure em Configurações > Integrações."
    );
  }

  // Normalizar URL da API
  let baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;

  if (baseUrl.endsWith("/api/v1")) {
    // URL já está completa
  } else if (baseUrl.endsWith("/api")) {
    baseUrl = `${baseUrl}/v1`;
  } else if (!baseUrl.includes("/api")) {
    baseUrl = `${baseUrl}/api/v1`;
  }

  return { baseUrl, token };
}

/**
 * Opções para requisições HTTP
 */
interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Executa uma requisição HTTP para a API 2FAuth
 */
export async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<T> {
  const { baseUrl, token } = await resolveConfigAsync(config);
  const { method = "GET", body, headers = {} } = options;

  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get("content-type");
    const isJson = !!contentType && contentType.includes("application/json");

    if (!response.ok) {
      let errorMessage = `2FAuth HTTP ${response.status}`;
      let errorReason: { [key: string]: string } | undefined;

      if (isJson) {
        try {
          const errorData = (await response.json()) as TwoFAuthErrorResponse;
          errorMessage = errorData.message || errorMessage;
          errorReason = errorData.reason;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
      } else {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }

      throw new TwoFAuthError(response.status, errorMessage, errorReason);
    }

    // Resposta vazia (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    if (!isJson) {
      const responseText = await response.text();
      // Se não é JSON mas a resposta foi OK, retornar o texto como está
      return responseText as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof TwoFAuthError) throw error;

    if (error instanceof Error) {
      throw new TwoFAuthError(500, `Erro ao chamar API 2FAuth: ${error.message}`, {
        original_error: error.message,
      });
    }

    throw new TwoFAuthError(500, "Erro desconhecido ao chamar API 2FAuth", {
      error: String(error),
    });
  }
}

/**
 * Executa uma requisição HTTP para upload de arquivo
 */
export async function uploadFile(
  endpoint: string,
  file: File | Blob,
  fieldName: string = "icon",
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<{ filename: string }> {
  const { baseUrl, token } = await resolveConfigAsync(config);
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const formData = new FormData();
  formData.append(fieldName, file);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    const isJson = !!contentType && contentType.includes("application/json");

    if (!response.ok) {
      let errorMessage = `2FAuth HTTP ${response.status}`;

      if (isJson) {
        try {
          const errorData = (await response.json()) as TwoFAuthErrorResponse;
          errorMessage = errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
      }

      throw new TwoFAuthError(response.status, errorMessage);
    }

    return (await response.json()) as { filename: string };
  } catch (error) {
    if (error instanceof TwoFAuthError) throw error;

    throw new TwoFAuthError(500, `Erro ao fazer upload: ${(error as Error).message}`);
  }
}

/**
 * Verifica se a conexão com o servidor 2FAuth está funcionando
 */
export async function checkConnection(
  config?: Omit<TwoFAuthConfig, "accountId">
): Promise<{ connected: boolean; error?: string }> {
  try {
    // Tenta obter as preferências do usuário como teste de conexão
    await request("/user", { method: "GET" }, config);
    return { connected: true };
  } catch (error) {
    const message =
      error instanceof TwoFAuthError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Erro desconhecido";

    return { connected: false, error: message };
  }
}
