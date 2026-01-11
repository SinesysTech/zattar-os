/**
 * CORS Configuration Module
 *
 * Implementa configuração centralizada de CORS (Cross-Origin Resource Sharing)
 * com whitelist dinâmica de origens permitidas.
 *
 * Funcionalidades:
 * - Lista de origens padrão para desenvolvimento e produção
 * - Suporte a variável de ambiente ALLOWED_ORIGINS
 * - Suporte a wildcards para subdomínios (*.example.com)
 * - Validação estrita de origens
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
 */

/**
 * Origens padrão permitidas quando ALLOWED_ORIGINS não está definida
 */
const DEFAULT_ALLOWED_ORIGINS: readonly string[] = [
  // Desenvolvimento local
  "http://localhost:3000",
  "http://localhost:3001",
  // Produção - será obtido dinamicamente ou via env
] as const;

/**
 * Métodos HTTP permitidos para requisições CORS
 */
export const ALLOWED_METHODS = [
  "GET",
  "POST",
  "OPTIONS",
] as const;

/**
 * Headers permitidos em requisições CORS
 */
export const ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "x-service-api-key",
  "x-client-info",
  "apikey",
] as const;

/**
 * Tempo máximo de cache para preflight requests (24 horas)
 */
export const MAX_AGE = 86400;

/**
 * Interface para configuração CORS completa
 */
export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: readonly string[];
  allowedHeaders: readonly string[];
  maxAge: number;
}

/**
 * Obtém a lista de origens permitidas
 *
 * Prioridade:
 * 1. Variável de ambiente ALLOWED_ORIGINS (comma-separated)
 * 2. Origens padrão (DEFAULT_ALLOWED_ORIGINS)
 *
 * @returns Array de origens permitidas
 */
export function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;

  if (envOrigins) {
    // Parse comma-separated origins e filtra vazios
    const origins = envOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => {
        // Validação básica de formato URL ou wildcard
        if (!origin) return false;
        if (origin.startsWith("*.")) return true;
        try {
          new URL(origin);
          return true;
        } catch {
          console.warn(`[CORS] Invalid origin format ignored: ${origin}`);
          return false;
        }
      });

    return origins;
  }

  // Adiciona Supabase URL se disponível
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origins = [...DEFAULT_ALLOWED_ORIGINS];

  if (supabaseUrl) {
    try {
      // Extrai o domínio base do Supabase
      const url = new URL(supabaseUrl);
      origins.push(url.origin);
    } catch {
      // Ignora URL inválida
    }
  }

  return origins;
}

/**
 * Verifica se uma origem corresponde a um padrão wildcard
 *
 * @param origin - Origem a verificar (ex: "https://app.example.com")
 * @param pattern - Padrão wildcard (ex: "*.example.com")
 * @returns true se a origem corresponde ao padrão
 */
function matchesWildcard(origin: string, pattern: string): boolean {
  if (!pattern.startsWith("*.")) {
    return false;
  }

  try {
    const url = new URL(origin);
    const baseDomain = pattern.slice(2); // Remove "*."
    const hostname = url.hostname;

    // Verifica se o hostname termina com o domínio base
    // e tem pelo menos um subdomínio
    return (
      hostname.endsWith(baseDomain) &&
      hostname.length > baseDomain.length &&
      hostname[hostname.length - baseDomain.length - 1] === "."
    );
  } catch {
    return false;
  }
}

/**
 * Verifica se uma origem está na lista de origens permitidas
 *
 * @param origin - Header Origin da requisição
 * @returns true se a origem é permitida
 */
export function isAllowedOrigin(origin: string | null): boolean {
  // Origem null ou vazia não é permitida
  if (!origin || origin.trim() === "") {
    return false;
  }

  const allowedOrigins = getAllowedOrigins();

  for (const allowed of allowedOrigins) {
    // Match exato
    if (allowed === origin) {
      return true;
    }

    // Match wildcard para subdomínios
    if (allowed.startsWith("*.") && matchesWildcard(origin, allowed)) {
      return true;
    }
  }

  return false;
}

/**
 * Obtém os headers CORS para uma origem
 *
 * Se a origem é permitida, retorna headers CORS completos.
 * Caso contrário, retorna objeto vazio (sem headers CORS).
 *
 * @param origin - Header Origin da requisição
 * @returns Headers CORS ou objeto vazio
 */
export function getCorsHeaders(
  origin: string | null
): Record<string, string> {
  if (!isAllowedOrigin(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin!,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

/**
 * Obtém headers CORS completos para resposta OPTIONS (preflight)
 *
 * @param origin - Header Origin da requisição
 * @returns Headers CORS completos para preflight
 */
export function getPreflightCorsHeaders(
  origin: string | null
): Record<string, string> {
  const baseHeaders = getCorsHeaders(origin);

  if (Object.keys(baseHeaders).length === 0) {
    // Origem não permitida - retorna apenas headers básicos sem CORS
    return {
      "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
      "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
      "Access-Control-Max-Age": MAX_AGE.toString(),
      Vary: "Origin",
    };
  }

  return {
    ...baseHeaders,
    "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
    "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
    "Access-Control-Max-Age": MAX_AGE.toString(),
  };
}

/**
 * Obtém a configuração CORS completa
 *
 * @returns Objeto de configuração CORS
 */
export function getCorsConfig(): CorsConfig {
  return {
    allowedOrigins: getAllowedOrigins(),
    allowedMethods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
    maxAge: MAX_AGE,
  };
}
