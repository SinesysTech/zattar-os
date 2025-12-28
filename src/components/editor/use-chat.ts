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

import { discussionPlugin, type TDiscussion } from './plate/discussion-kit';

/**
 * Hook placeholder para o kit de AI do Plate.
 *
 * Em setups completos, este hook costuma inicializar a integração de chat (ex.: Vercel AI SDK)
 * e prover contexto/estado. Aqui ele é no-op para evitar quebrar o build.
 */
export function useChat() {
  const { editor } = useEditorPlugin(AIChatPlugin);
  const optionsUnknown = editor.getOptions(AIChatPlugin) as unknown;
  const chatOptions =
    typeof optionsUnknown === 'object' && optionsUnknown !== null
      ? ((optionsUnknown as { chatOptions?: unknown }).chatOptions ?? {})
      : {};

  const chatOptionsParsed =
    typeof chatOptions === 'object' && chatOptions !== null
      ? (chatOptions as { api?: unknown; body?: unknown })
      : {};

  const api =
    typeof chatOptionsParsed.api === 'string' ? chatOptionsParsed.api : '/api/plate/ai';
  const body =
    chatOptionsParsed.body && typeof chatOptionsParsed.body === 'object'
      ? (chatOptionsParsed.body as Record<string, unknown>)
      : undefined;

  const bodyKey = React.useMemo(() => JSON.stringify(body ?? {}), [body]);

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
  }, [api, bodyKey]);

  const chat = useVercelChat({
    id: 'editor',
    transport,
    onData(data) {
      const event = data as unknown;
      const eventObj =
        typeof event === 'object' && event !== null
          ? (event as { type?: unknown; data?: unknown })
          : {};

      if (eventObj.type === 'data-toolName') {
        const toolName = eventObj.data;
        if (toolName === 'generate' || toolName === 'edit' || toolName === 'comment') {
          editor.setOption(AIChatPlugin, 'toolName', toolName as unknown as never);
        }
      }

      if (eventObj.type === 'data-comment' && eventObj.data) {
        const payload = eventObj.data as unknown;

        const payloadObj =
          typeof payload === 'object' && payload !== null
            ? (payload as { status?: unknown; comment?: unknown })
            : {};

        if (payloadObj.status === 'finished') {
          editor.getApi(BlockSelectionPlugin).blockSelection.deselect();
          return;
        }

        const commentUnknown = payloadObj.comment;
        const aiComment =
          typeof commentUnknown === 'object' && commentUnknown !== null
            ? (commentUnknown as { blockId?: unknown; comment?: unknown; content?: unknown })
            : null;
        if (!aiComment) return;
        if (
          typeof aiComment.blockId !== 'string' ||
          typeof aiComment.comment !== 'string' ||
          typeof aiComment.content !== 'string'
        ) {
          return;
        }

        const range = aiCommentToRange(editor as unknown as never, {
          blockId: aiComment.blockId,
          comment: aiComment.comment,
          content: aiComment.content,
        } as unknown as never);
        if (!range) return console.warn('No range found for AI comment');

        const discussions =
          (editor.getOption(discussionPlugin, 'discussions') as TDiscussion[] | undefined) || [];

        const discussionId = nanoid();
        const newComment = {
          id: nanoid(),
          contentRich: [{ children: [{ text: aiComment.comment }], type: 'p' }],
          createdAt: new Date(),
          discussionId,
          isEdited: false,
          userId: editor.getOption(discussionPlugin, 'currentUserId'),
        };

        const newDiscussion = {
          id: discussionId,
          comments: [newComment],
          createdAt: new Date(),
          documentContent: deserializeMd(editor as unknown as never, aiComment.content)
            .map((node: TNode) => NodeApi.string(node))
            .join('\n'),
          isResolved: false,
          userId: editor.getOption(discussionPlugin, 'currentUserId'),
        };

        const updatedDiscussions = [...discussions, newDiscussion];
        editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);

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
    const currentOptions = editor.getOptions(AIChatPlugin) as unknown;
    const currentChat =
      typeof currentOptions === 'object' && currentOptions !== null
        ? (currentOptions as { chat?: unknown }).chat
        : undefined;
    if (currentChat) return;

    editor.setOption(AIChatPlugin, 'chat', chat as unknown as never);
  }, [editor, chat]);

  return chat;
}


