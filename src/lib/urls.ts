/**
 * URLs do ZattarOS
 *
 * Este módulo é usado para gerar URLs absolutas (ex.: e-mails/links externos)
 * e por isso retorna URLs completas por padrão.
 */

const DEFAULT_ORIGIN = "http://localhost:3000";

function appendPath(base: string, path?: string): string {
  if (path === undefined) return base;
  if (path === "") return `${base}/`;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Retorna a URL do Dashboard Principal
 * @param path - Caminho opcional a ser adicionado à URL base
 * @returns URL completa do dashboard
 */
export function getDashboardUrl(path?: string): string {
  return appendPath(DEFAULT_ORIGIN, path);
}
