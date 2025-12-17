/**
 * URLs dos Apps do Sinesys
 *
 * Este arquivo centraliza as URLs dos três apps do sistema:
 * - Dashboard Principal: Sistema interno para advogados
 * - Meu Processo: Portal do cliente para consulta de processos
 * - Website: Site institucional
 */

// URLs base dos apps (via variáveis de ambiente com fallback para desenvolvimento)
export const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3000";

export const MEU_PROCESSO_URL =
  process.env.NEXT_PUBLIC_MEU_PROCESSO_URL || "http://localhost:3000/meu-processo";

export const WEBSITE_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000/website";

/**
 * Retorna a URL do Dashboard Principal
 * @param path - Caminho opcional a ser adicionado à URL base
 * @returns URL completa do dashboard
 */
export function getDashboardUrl(path?: string): string {
  if (path) {
    return `${DASHBOARD_URL}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return DASHBOARD_URL;
}

/**
 * Retorna a URL do portal Meu Processo
 * @param path - Caminho opcional a ser adicionado à URL base
 * @returns URL completa do portal Meu Processo
 */
export function getMeuProcessoUrl(path?: string): string {
  if (path) {
    return `${MEU_PROCESSO_URL}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return MEU_PROCESSO_URL;
}

/**
 * Retorna a URL do Website institucional
 * @param path - Caminho opcional a ser adicionado à URL base
 * @returns URL completa do website
 */
export function getWebsiteUrl(path?: string): string {
  if (path) {
    return `${WEBSITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return WEBSITE_URL;
}
