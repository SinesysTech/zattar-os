/**
 * Utilitário centralizado para extração de IP do cliente
 *
 * Prioridade de headers:
 * 1. x-forwarded-for (proxies/load balancers)
 * 2. cf-connecting-ip (Cloudflare)
 * 3. x-real-ip (Nginx)
 * 4. x-client-ip (Apache)
 * 5. x-cluster-client-ip (AWS/GCP)
 *
 * @module lib/utils/get-client-ip
 */

import { NextRequest } from 'next/server';

// =============================================================================
// VALIDAÇÃO
// =============================================================================

/**
 * Valida formato de IPv4
 */
function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

/**
 * Valida formato de IPv6
 */
function isValidIPv6(ip: string): boolean {
  // Remove colchetes se presentes (formato URL)
  const cleanIp = ip.replace(/^\[|\]$/g, '');

  // IPv6 comprimido ou expandido
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|::(ffff(:0{1,4})?:)?((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1?[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1?[0-9])?[0-9]))$/;

  return ipv6Regex.test(cleanIp);
}

/**
 * Valida se uma string é um IP válido (IPv4 ou IPv6)
 */
export function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;

  const trimmedIp = ip.trim();
  if (!trimmedIp) return false;

  return isValidIPv4(trimmedIp) || isValidIPv6(trimmedIp);
}

// =============================================================================
// EXTRAÇÃO
// =============================================================================

/**
 * Limpa e extrai o primeiro IP válido de uma string de IPs
 * (x-forwarded-for pode conter múltiplos IPs separados por vírgula)
 */
function extractFirstValidIp(headerValue: string | null): string | null {
  if (!headerValue) return null;

  // Pode conter múltiplos IPs: "client, proxy1, proxy2"
  const ips = headerValue.split(',');

  for (const ip of ips) {
    const trimmedIp = ip.trim();
    // Remove porta se presente (ex: "192.168.1.1:3000")
    const ipWithoutPort = trimmedIp.split(':')[0];

    if (isValidIp(ipWithoutPort)) {
      return ipWithoutPort;
    }

    // Tentar como IPv6 (pode ter colchetes)
    if (isValidIp(trimmedIp)) {
      return trimmedIp;
    }
  }

  return null;
}

/**
 * Extrai IP do cliente de forma consistente a partir de uma requisição Next.js
 *
 * @param request - NextRequest do Next.js
 * @returns IP do cliente ou 'unknown' se não conseguir extrair
 *
 * @example
 * ```typescript
 * import { getClientIp } from '@/lib/utils/get-client-ip';
 *
 * export async function GET(request: NextRequest) {
 *   const clientIp = getClientIp(request);
 *   console.log('Client IP:', clientIp);
 * }
 * ```
 */
export function getClientIp(request: NextRequest): string {
  const headers = request.headers;

  // 1. x-forwarded-for (proxies/load balancers) - pegar primeiro IP
  const forwardedFor = headers.get('x-forwarded-for');
  const forwardedIp = extractFirstValidIp(forwardedFor);
  if (forwardedIp) return forwardedIp;

  // 2. Cloudflare
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp && isValidIp(cfIp.trim())) return cfIp.trim();

  // 3. Nginx
  const realIp = headers.get('x-real-ip');
  if (realIp && isValidIp(realIp.trim())) return realIp.trim();

  // 4. Apache
  const clientIp = headers.get('x-client-ip');
  if (clientIp && isValidIp(clientIp.trim())) return clientIp.trim();

  // 5. AWS/GCP Load Balancer
  const clusterIp = headers.get('x-cluster-client-ip');
  if (clusterIp && isValidIp(clusterIp.trim())) return clusterIp.trim();

  // 6. True-Client-IP (Akamai, Cloudflare Enterprise)
  const trueClientIp = headers.get('true-client-ip');
  if (trueClientIp && isValidIp(trueClientIp.trim())) return trueClientIp.trim();

  return 'unknown';
}

/**
 * Extrai IP do cliente a partir de um objeto Headers genérico
 *
 * @param headers - Objeto Headers ou Map-like com headers HTTP
 * @returns IP do cliente ou 'unknown' se não conseguir extrair
 */
export function getClientIpFromHeaders(
  headers: Headers | Map<string, string> | Record<string, string>
): string {
  const getHeader = (name: string): string | null => {
    if (headers instanceof Headers || headers instanceof Map) {
      const value = headers.get(name);
      return value ?? null;
    }
    const value = headers[name] || headers[name.toLowerCase()];
    return value ?? null;
  };

  // 1. x-forwarded-for
  const forwardedFor = getHeader('x-forwarded-for');
  const forwardedIp = extractFirstValidIp(forwardedFor);
  if (forwardedIp) return forwardedIp;

  // 2. Cloudflare
  const cfIp = getHeader('cf-connecting-ip');
  if (cfIp && isValidIp(cfIp.trim())) return cfIp.trim();

  // 3. Nginx
  const realIp = getHeader('x-real-ip');
  if (realIp && isValidIp(realIp.trim())) return realIp.trim();

  // 4. Apache
  const clientIp = getHeader('x-client-ip');
  if (clientIp && isValidIp(clientIp.trim())) return clientIp.trim();

  // 5. AWS/GCP
  const clusterIp = getHeader('x-cluster-client-ip');
  if (clusterIp && isValidIp(clusterIp.trim())) return clusterIp.trim();

  // 6. Akamai/Cloudflare Enterprise
  const trueClientIp = getHeader('true-client-ip');
  if (trueClientIp && isValidIp(trueClientIp.trim())) return trueClientIp.trim();

  return 'unknown';
}

// =============================================================================
// UTILITÁRIOS
// =============================================================================

/**
 * Verifica se um IP é local/privado
 */
export function isPrivateIp(ip: string): boolean {
  if (!isValidIp(ip)) return false;

  // IPv4 privados
  const privateRanges = [
    /^127\./, // localhost
    /^10\./, // Classe A privada
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Classe B privada
    /^192\.168\./, // Classe C privada
    /^169\.254\./, // Link-local
  ];

  if (privateRanges.some((regex) => regex.test(ip))) {
    return true;
  }

  // IPv6 privados/locais
  const ipLower = ip.toLowerCase();
  if (
    ipLower === '::1' || // localhost
    ipLower.startsWith('fe80:') || // link-local
    ipLower.startsWith('fc') || // unique local
    ipLower.startsWith('fd')
  ) {
    // unique local
    return true;
  }

  return false;
}

/**
 * Anonimiza um IP para logs (remove último octeto para IPv4)
 */
export function anonymizeIp(ip: string): string {
  if (!isValidIp(ip)) return 'unknown';

  // IPv4: remove último octeto
  if (isValidIPv4(ip)) {
    const parts = ip.split('.');
    parts[3] = '0';
    return parts.join('.');
  }

  // IPv6: remove últimos 80 bits (últimos 5 grupos)
  if (isValidIPv6(ip)) {
    const cleanIp = ip.replace(/^\[|\]$/g, '');
    const parts = cleanIp.split(':').slice(0, 3);
    return parts.join(':') + '::';
  }

  return 'unknown';
}
