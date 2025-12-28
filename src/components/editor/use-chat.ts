'use client';

import * as React from 'react';

import { AIChatPlugin, aiCommentToRange } from '@platejs/ai/react';
import { getCommentKey, getTransientCommentKey } from '@platejs/comment';
import { deserializeMd } from '@platejs/markdown';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { DefaultChatTransport } from 'ai';
import { useChat as useVercelChat } from '@ai-sdk/react';
import { type TNode, KEYS, nanoid, NodeApi, TextApi } from 'platejs';
import { useEditorPlugin } from 'platejs/react';

import { discussionPlugin } from './plate/discussion-kit';

/**
 * Hook placeholder para o kit de AI do Plate.
 *
 * Em setups completos, este hook costuma inicializar a integração de chat (ex.: Vercel AI SDK)
 * e prover contexto/estado. Aqui ele é no-op para evitar quebrar o build.
 */
export function useChat() {
  const { editor } = useEditorPlugin(AIChatPlugin);
  const chatOptions = ((editor.getOptions(AIChatPlugin) as any)
    ?.chatOptions ?? {}) as {
    api?: string;
    body?: Record<string, unknown>;
  };

  const api = typeof chatOptions.api === 'string' ? chatOptions.api : '/api/plate/ai';
  const body =
    chatOptions.body && typeof chatOptions.body === 'object'
      ? chatOptions.body
      : undefined;

  const transport = React.useMemo(() => {
    return new DefaultChatTransport({
      api,
      fetch: (async (input, init) => {
        const initBody =
          typeof init?.body === 'string' && init.body.length > 0
            ? (JSON.parse(init.body) as Record<string, unknown>)
            : {};

        const mergedBody = {
          ...initBody,
          ...(body ?? {}),
        };

        const res = await fetch(input, {
          ...init,
          body: JSON.stringify(mergedBody),
        });

        if (!res.ok) {
          let errorDetails: { error?: string; code?: string } = {};
          try {
            errorDetails = (await res.json()) as { error?: string; code?: string };
          } catch {
            errorDetails = {};
          }

          if (res.status === 401 || errorDetails.code === 'MISSING_API_KEY') {
            void import('sonner').then(({ toast }) => {
              toast.error('IA indisponível', {
                description:
                  'O recurso de IA não está configurado no servidor. A edição de documentos continua funcionando normalmente.',
                duration: 5000,
              });
            });

            throw new Error(
              errorDetails.error ||
                'IA indisponível: API key não configurada'
            );
          }

          if (res.status >= 500) {
            void import('sonner').then(({ toast }) => {
              toast.error('Erro temporário na IA', {
                description:
                  'Não foi possível processar sua solicitação. Tente novamente em alguns instantes.',
                duration: 5000,
              });
            });

            throw new Error(errorDetails.error || 'Erro ao processar requisição AI');
          }

          throw new Error(errorDetails.error || 'Erro ao processar requisição AI');
        }

        return res;
      }) as typeof fetch,
    });
  }, [api, JSON.stringify(body ?? {})]);

  const chat = useVercelChat({
    id: 'editor',
    transport,
    onData(data) {
      const event = data as any;

      if (event?.type === 'data-toolName') {
        const toolName = event.data;
        if (toolName === 'generate' || toolName === 'edit' || toolName === 'comment') {
          editor.setOption(AIChatPlugin, 'toolName', toolName as any);
        }
      }

      if (event?.type === 'data-comment' && event.data) {
        const payload = event.data as any;
        editor.setOption(AIChatPlugin as any, 'comment', payload);

        if (payload?.status === 'finished') {
          editor.getApi(BlockSelectionPlugin).blockSelection.deselect();
          return;
        }

        const aiComment = payload?.comment as
          | { blockId: string; comment: string; content: string }
          | null
          | undefined;
        if (!aiComment) return;

        const range = aiCommentToRange(editor as any, aiComment);
        if (!range) return console.warn('No range found for AI comment');

        const discussions =
          (editor.getOption(discussionPlugin as any, 'discussions') as any[]) || [];

        const discussionId = nanoid();
        const newComment = {
          id: nanoid(),
          contentRich: [{ children: [{ text: aiComment.comment }], type: 'p' }],
          createdAt: new Date(),
          discussionId,
          isEdited: false,
          userId: editor.getOption(discussionPlugin as any, 'currentUserId'),
        };

        const newDiscussion = {
          id: discussionId,
          comments: [newComment],
          createdAt: new Date(),
          documentContent: deserializeMd(editor as any, aiComment.content)
            .map((node: TNode) => NodeApi.string(node))
            .join('\n'),
          isResolved: false,
          userId: editor.getOption(discussionPlugin as any, 'currentUserId'),
        };

        const updatedDiscussions = [...discussions, newDiscussion];
        editor.setOption(discussionPlugin as any, 'discussions', updatedDiscussions);

        editor.tf.withMerging(() => {
          editor.tf.setNodes(
            {
              [getCommentKey(newDiscussion.id)]: true,
              [getTransientCommentKey()]: true,
              [KEYS.comment]: true,
            },
            {
              at: range,
              match: TextApi.isText,
              split: true,
            }
          );
        });
      }
    },
  });

  React.useEffect(() => {
    editor.setOption(AIChatPlugin, 'chat', chat as unknown as never);
  }, [chat, editor]);

  return chat;
}


