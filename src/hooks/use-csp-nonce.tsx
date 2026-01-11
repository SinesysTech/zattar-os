"use client";

/**
 * Hook para acessar o CSP nonce
 *
 * O nonce é gerado pelo middleware e disponibilizado via:
 * 1. Meta tag no head (preferido para componentes client)
 * 2. Header x-nonce (para server components)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const nonce = useCSPNonce();
 *   return <style jsx nonce={nonce}>{`...`}</style>;
 * }
 * ```
 */

import { useSyncExternalStore } from "react";

/**
 * Cache do nonce para evitar leituras repetidas do DOM
 */
let cachedNonce: string | undefined;

/**
 * Obtém o nonce do DOM (meta tag)
 */
function getNonceFromDOM(): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  // Usar cache se disponível
  if (cachedNonce !== undefined) {
    return cachedNonce;
  }

  // Buscar na meta tag
  const metaTag = document.querySelector('meta[name="csp-nonce"]');
  if (metaTag) {
    cachedNonce = metaTag.getAttribute("content") || undefined;
    return cachedNonce;
  }

  // Fallback: buscar no primeiro script com nonce
  const scriptWithNonce = document.querySelector("script[nonce]");
  if (scriptWithNonce) {
    cachedNonce = scriptWithNonce.getAttribute("nonce") || undefined;
    return cachedNonce;
  }

  return undefined;
}

/**
 * Snapshot para o servidor (sempre undefined)
 */
function getServerSnapshot(): string | undefined {
  return undefined;
}

/**
 * Subscribe vazio (nonce não muda durante a sessão)
 */
function subscribe(): () => void {
  return () => {};
}

/**
 * Hook para acessar o CSP nonce em componentes client
 *
 * @returns O nonce CSP ou undefined se não disponível
 */
export function useCSPNonce(): string | undefined {
  return useSyncExternalStore(subscribe, getNonceFromDOM, getServerSnapshot);
}

/**
 * Limpa o cache do nonce (útil para testes)
 */
export function clearNonceCache(): void {
  cachedNonce = undefined;
}

/**
 * Define o nonce manualmente (útil para SSR)
 */
export function setNonceCache(nonce: string | undefined): void {
  cachedNonce = nonce;
}

