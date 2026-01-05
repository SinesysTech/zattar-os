'use client';

import { useState, useEffect } from 'react';
import { actionGetPresignedPdfUrl } from '../actions/documentos-actions';

interface UsePresignedPdfUrlResult {
  presignedUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para obter URL presigned de um PDF armazenado no Backblaze.
 *
 * Transforma a URL pública (que não funciona em buckets privados) em uma
 * URL presigned com acesso temporário.
 *
 * @param originalUrl - URL original do PDF (armazenada no banco)
 * @returns URL presigned, estado de loading e erro
 */
export function usePresignedPdfUrl(originalUrl: string | null | undefined): UsePresignedPdfUrlResult {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!originalUrl) {
      setPresignedUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const urlToFetch = originalUrl; // Capturar valor no closure

    async function fetchPresignedUrl() {
      setIsLoading(true);
      setError(null);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (await actionGetPresignedPdfUrl({ url: urlToFetch })) as any;

        if (cancelled) return;

        // Compatibilidade com padrão existente no projeto
        if (result?.data?.success && result?.data?.data?.presignedUrl) {
          setPresignedUrl(result.data.data.presignedUrl);
        } else {
          setError(result?.data?.error || 'Erro ao obter URL de acesso');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erro ao obter URL de acesso');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchPresignedUrl();

    return () => {
      cancelled = true;
    };
  }, [originalUrl]);

  return { presignedUrl, isLoading, error };
}
