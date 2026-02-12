'use client';

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Detecta erros de "Failed to find Server Action" que ocorrem após deploys
 * quando o cliente tem uma versão antiga do JS cacheada.
 *
 * Quando detectado, força um reload da página para obter o código atualizado.
 */
export function ServerActionVersionGuard() {
  const hasShownToast = useRef(false);
  const reloadTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleReload = useCallback(() => {
    // Limpa cache do Service Worker se disponível
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }

    // Força reload sem cache
    window.location.reload();
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event.message || event.error?.message || '';

      // Detecta o erro específico de Server Action não encontrada
      if (
        message.includes('Failed to find Server Action') ||
        message.includes('This request might be from an older or newer deployment')
      ) {
        event.preventDefault();

        // Evita múltiplos toasts
        if (!hasShownToast.current) {
          hasShownToast.current = true;

          toast.info('Atualizando aplicação...', {
            description: 'Uma nova versão está disponível. A página será recarregada.',
            duration: 3000,
          });

          // Aguarda um pouco antes de recarregar para mostrar o toast
          reloadTimeout.current = setTimeout(handleReload, 2000);
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason) || '';

      if (
        message.includes('Failed to find Server Action') ||
        message.includes('This request might be from an older or newer deployment')
      ) {
        event.preventDefault();

        if (!hasShownToast.current) {
          hasShownToast.current = true;

          toast.info('Atualizando aplicação...', {
            description: 'Uma nova versão está disponível. A página será recarregada.',
            duration: 3000,
          });

          reloadTimeout.current = setTimeout(handleReload, 2000);
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      if (reloadTimeout.current) {
        clearTimeout(reloadTimeout.current);
      }
    };
  }, [handleReload]);

  return null;
}
