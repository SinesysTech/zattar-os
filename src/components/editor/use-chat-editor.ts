'use client';

import { useChat as useBaseChat } from '@ai-sdk/react';
import { useEditorRef, usePluginOption } from 'platejs/react';

import { aiChatPlugin } from '@/components/editor/plate/ai-kit';

import { useChatApi } from './hooks/use-chat-api';
import { useChatStreaming } from './hooks/use-chat-streaming';
import { useEditorIntegration } from './hooks/use-editor-integration';


/**
 * Main chat hook for the editor.
 * Orchestrates API communication, streaming, and editor integration.
 *
 * @example
 * ```tsx
 * const chat = useChat();
 * // Use chat.messages, chat.append, etc.
 * ```
 */
export const useChat = () => {
  const editor = useEditorRef();
  const options = usePluginOption(aiChatPlugin, 'chatOptions');

  // API transport with error handling
  const { transport } = useChatApi(editor, {
    api: options?.api,
  });

  // Streaming data event handlers
  const { onData } = useChatStreaming(editor);

  // Base chat from Vercel AI SDK
  const baseChat = useBaseChat({
    id: 'editor',
    transport,
    onData,
    ...options,
  });

  // Sync chat state with editor (using baseChat for type compatibility)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEditorIntegration(editor, baseChat as any);

  return baseChat;
};
