"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  clearServiceWorkerCache,
  updateStoredVersion,
} from "@/lib/version";

/**
 * Detecta erros de "Failed to find Server Action" que ocorrem após deploys
 * quando o cliente tem uma versão antiga do JS cacheada.
 *
 * Quando detectado:
 * 1. Mostra um toast informativo
 * 2. Limpa todos os caches do Service Worker
 * 3. Força um reload da página para obter o código atualizado
 */
export function ServerActionVersionGuard() {
  const hasShownToast = useRef(false);
  const reloadTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleReload = useCallback(async () => {
    // Atualizar versão armazenada para evitar loop
    updateStoredVersion();

    // Limpar todos os caches do Service Worker
    await clearServiceWorkerCache();

    // Forçar reload sem cache
    window.location.reload();
  }, []);

  const handleVersionError = useCallback(
    (message: string) => {
      // Detecta o erro específico de Server Action não encontrada
      if (
        message.includes("Failed to find Server Action") ||
        message.includes("This request might be from an older or newer deployment")
      ) {
        // Evita múltiplos toasts
        if (!hasShownToast.current) {
          hasShownToast.current = true;

          toast.info("Atualizando aplicação...", {
            description:
              "Uma nova versão está disponível. A página será recarregada.",
            duration: 3000,
          });

          // Aguarda um pouco antes de recarregar para mostrar o toast
          reloadTimeout.current = setTimeout(() => {
            handleReload();
          }, 2000);
        }
        return true;
      }
      return false;
    },
    [handleReload]
  );

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event.message || event.error?.message || "";
      if (handleVersionError(message)) {
        event.preventDefault();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason) || "";
      if (handleVersionError(message)) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      if (reloadTimeout.current) {
        clearTimeout(reloadTimeout.current);
      }
    };
  }, [handleVersionError]);

  return null;
}
