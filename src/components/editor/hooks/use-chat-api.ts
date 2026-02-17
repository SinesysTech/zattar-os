'use client';

import { useCallback, useRef } from 'react';

import { DefaultChatTransport } from 'ai';
import type { PlateEditor } from 'platejs/react';

import { aiChatPlugin } from '../plate/ai-kit';

export type UseChatApiOptions = {
  api?: string;
};

/**
 * Hook that provides API transport configuration for the chat.
 * Handles error responses (401, 500) with toast notifications.
 */
export function useChatApi(editor: PlateEditor, options: UseChatApiOptions = {}) {
  // Keep for backwards compatibility, but no longer used
  const abortFakeStream = useCallback(() => {
    // No-op: fake streaming removed
  }, []);

  const transport = new DefaultChatTransport({
    api: options.api || '/api/ai/command',
    fetch: (async (input, init) => {
      const bodyOptions = editor.getOptions(aiChatPlugin).chatOptions?.body;

      const initBody = JSON.parse(init?.body as string);

      const body = {
        ...initBody,
        ...bodyOptions,
      };

      const res = await fetch(input, {
        ...init,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // Try to get error details
        let errorDetails: { error?: string; code?: string } = {};
        try {
          errorDetails = await res.json();
        } catch {
          // If JSON parsing fails, use default values
        }

        // Check if it's an API key not configured error (401)
        if (res.status === 401 || errorDetails.code === 'MISSING_API_KEY') {
          // Import toast dynamically to avoid circular dependencies
          import('sonner').then(({ toast }) => {
            toast.error('IA indisponível', {
              description:
                'O recurso de IA não está configurado no servidor. A edição de documentos continua funcionando normalmente.',
              duration: 5000,
            });
          });

          throw new Error(
            errorDetails.error || 'IA indisponível: API key não configurada'
          );
        }

        // Handle rate limiting (429)
        if (res.status === 429) {
          import('sonner').then(({ toast }) => {
            toast.error('Limite de requisições excedido', {
              description:
                'Você atingiu o limite de requisições. Aguarde alguns instantes antes de tentar novamente.',
              duration: 5000,
            });
          });

          throw new Error(
            errorDetails.error || 'Rate limit exceeded'
          );
        }

        // Handle forbidden (403)
        if (res.status === 403) {
          import('sonner').then(({ toast }) => {
            toast.error('Acesso negado', {
              description:
                'Você não tem permissão para acessar este recurso.',
              duration: 5000,
            });
          });

          throw new Error(
            errorDetails.error || 'Acesso negado'
          );
        }

        // Handle bad request (400)
        if (res.status === 400) {
          import('sonner').then(({ toast }) => {
            toast.error('Requisição inválida', {
              description:
                errorDetails.error || 'A requisição não pôde ser processada.',
              duration: 5000,
            });
          });

          throw new Error(
            errorDetails.error || 'Requisição inválida'
          );
        }

        // For server errors (500+), show generic message
        if (res.status >= 500) {
          import('sonner').then(({ toast }) => {
            toast.error('Erro temporário na IA', {
              description:
                'Não foi possível processar sua solicitação. Tente novamente em alguns instantes.',
              duration: 5000,
            });
          });

          throw new Error(
            errorDetails.error || 'Erro ao processar requisição AI'
          );
        }

        // For any other unhandled error status, propagate the error
        throw new Error(
          errorDetails.error || `Erro HTTP ${res.status}: ${res.statusText}`
        );
      }

      return res;
    }) as typeof fetch,
  });

  return { transport, abortFakeStream };
}
