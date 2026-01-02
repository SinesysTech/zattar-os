"use client";

import { useSyncExternalStore, type ReactNode } from "react";

// Subscribe function that does nothing (client is always mounted after hydration)
const emptySubscribe = () => () => {};

/**
 * Renderiza `children` apenas após o mount no client.
 *
 * Motivo: evitar hydration mismatch em componentes que dependem de DOM/portals
 * (ex.: Radix UI + Portal, Recharts, etc.) quando SSR está habilitado.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) return fallback;
  return <>{children}</>;
}


