/**
 * URLs dos Apps do Sinesys
 *
 * Este módulo é usado para gerar URLs absolutas (ex.: e-mails/links externos)
 * e por isso retorna URLs completas por padrão.
 */

const DEFAULT_ORIGIN = "http://localhost:3000";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function appendPath(base: string, path?: string): string {
  if (path === undefined) return base;
  if (path === "") return `${base}/`;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

// URLs base dos apps (absolutas)
export const DASHBOARD_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_DASHBOARD_URL || DEFAULT_ORIGIN
);

export const MEU_PROCESSO_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_MEU_PROCESSO_URL || `${DEFAULT_ORIGIN}/portal`
);

export const WEBSITE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_WEBSITE_URL || `${DEFAULT_ORIGIN}/website`
);

/**
 * Retorna a URL do Dashboard Principal
 * @param path - Caminho opcional a ser adicionado à URL base
 * @returns URL completa do dashboard
 */
export function getDashboardUrl(path?: string): string {
  return appendPath(DASHBOARD_URL, path);
}

/**
 * Retorna a URL do portal do cliente
 * @param path - Caminho opcional a ser adicionado à URL base
 * @returns URL completa do portal
 */
export function getMeuProcessoUrl(path?: string): string {
  return appendPath(MEU_PROCESSO_URL, path);
}

/**
 * Retorna a URL do Website institucional
 * @param path - Caminho opcional a ser adicionado à URL base
 * @returns URL completa do website
 */
export function getWebsiteUrl(path?: string): string {
  return appendPath(WEBSITE_URL, path);
}

// Alias legado
export const getPortalUrl = getMeuProcessoUrl;
