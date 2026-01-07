/**
 * URLs dos Apps do Zattar Advogados
 *
 * ARQUITETURA BASEADA EM DIRETÓRIOS:
 * - Website: / (raiz)
 * - Dashboard: /app/*
 * - Portal do Cliente: /portal/*
 */

// URLs base dos apps
export const DASHBOARD_URL = "/app";
export const PORTAL_URL = "/portal";
export const WEBSITE_URL = "/";

/**
 * Retorna a URL do Dashboard Principal
 * @param path - Caminho opcional a ser adicionado à URL base
 * @returns URL completa do dashboard
 */
export function getDashboardUrl(path?: string): string {
  if (path) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${DASHBOARD_URL}${cleanPath}`;
  }
  return DASHBOARD_URL;
}

/**
 * Retorna a URL do portal do cliente
 * @param path - Caminho opcional a ser adicionado à URL base
 * @returns URL completa do portal
 */
export function getPortalUrl(path?: string): string {
  if (path) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${PORTAL_URL}${cleanPath}`;
  }
  return PORTAL_URL;
}

/**
 * Retorna a URL do Website institucional
 * @param path - Caminho opcional a ser adicionado à URL base
 * @returns URL completa do website
 */
export function getWebsiteUrl(path?: string): string {
  if (path) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return cleanPath;
  }
  return WEBSITE_URL;
}

// Aliases para compatibilidade
export const MEU_PROCESSO_URL = PORTAL_URL;
export const getMeuProcessoUrl = getPortalUrl;
