// Serviço comum para chamadas de API do 2FAuth
// Reutilizável por TRT, TJ, TRF e outros sistemas jurídicos
// Documentação: https://docs.2fauth.app/resources/rapidoc.html#get-/api/v1/twofaccounts/-id-/otp

/**
 * Configuração do 2FAuth (opcional - se não fornecido, usa variáveis de ambiente)
 */
export interface TwoFAuthConfig {
  apiUrl?: string;
  token?: string;
  accountId?: string;
}

/**
 * Resposta de sucesso da API 2FAuth (200)
 */
export interface TwoFAuthOTPResponse {
  password: string; // O código OTP atual (6-10 caracteres)
  next_password?: string; // O próximo código OTP (disponível quando period está definido)
  otp_type: "totp" | "hotp";
  generated_at?: number; // TOTP only: timestamp da geração
  period?: number; // TOTP only: período de validade em segundos (geralmente 30)
  counter?: number; // HOTP only: número de iterações
}

/**
 * Resultado da obtenção de OTP com password atual e próximo
 */
export interface OTPResult {
  password: string; // OTP atual
  nextPassword?: string; // Próximo OTP (se disponível)
}

/**
 * Resposta de erro da API 2FAuth (400, 401, 403)
 */
export interface TwoFAuthErrorResponse {
  message: string;
  reason?: {
    [key: string]: string; // Ex: { param1: "reason", param2: "reason" }
  };
}

/**
 * Erro customizado para respostas da API 2FAuth
 */
export class TwoFAuthError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public reason?: { [key: string]: string }
  ) {
    super(message);
    this.name = "TwoFAuthError";
  }
}

/**
 * Obtém código OTP do 2FAuth
 *
 * Serviço comum usado por todos os sistemas jurídicos (TRT, TJ, TRF, etc.)
 *
 * Endpoint: GET /api/v1/twofaccounts/{id}/otp
 *
 * Retorna tanto o password atual quanto o next_password (se disponível).
 * A API sempre retorna ambos quando disponível, então esta é a função padrão.
 *
 * Se não receber configuração, usa variáveis de ambiente:
 * - TWOFAUTH_API_URL
 * - TWOFAUTH_API_TOKEN
 * - TWOFAUTH_ACCOUNT_ID
 *
 * @param config - Configuração opcional do 2FAuth (usa env se não fornecido)
 * @returns Objeto com password atual e próximo (se disponível)
 * @throws TwoFAuthError em caso de erro na API
 */
export async function getOTP(config?: TwoFAuthConfig): Promise<OTPResult> {
  const apiUrl = config?.apiUrl || process.env.TWOFAUTH_API_URL;
  const token = config?.token || process.env.TWOFAUTH_API_TOKEN;
  const accountId = config?.accountId || process.env.TWOFAUTH_ACCOUNT_ID;

  if (!apiUrl || !token || !accountId) {
    throw new TwoFAuthError(
      500,
      "2FAuth não configurado. Forneça config ou defina variáveis de ambiente: TWOFAUTH_API_URL, TWOFAUTH_API_TOKEN, TWOFAUTH_ACCOUNT_ID"
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

  const url = `${baseUrl}/twofaccounts/${accountId}/otp`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
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

    if (!isJson) {
      const responseText = await response.text();
      throw new TwoFAuthError(
        500,
        `2FAuth retornou resposta não-JSON: ${responseText.substring(0, 100)}`
      );
    }

    const data = (await response.json()) as TwoFAuthOTPResponse;

    if (!data.password) {
      throw new TwoFAuthError(500, "2FAuth retornou resposta sem campo password", {
        response: JSON.stringify(data),
      });
    }

    if (data.password.length < 6 || data.password.length > 10) {
      throw new TwoFAuthError(
        500,
        `2FAuth retornou password com tamanho inválido: ${data.password.length} caracteres (esperado: 6-10)`,
        { password_length: data.password.length.toString() }
      );
    }

    return {
      password: data.password,
      nextPassword: data.next_password,
    };
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


