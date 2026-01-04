'use client';

import { useEffect } from 'react';

import type { UseChatHelpers } from '@ai-sdk/react';
import { AIChatPlugin } from '@platejs/ai/react';
import type { PlateEditor } from 'platejs/react';

/**
 * Hook that synchronizes the chat state with the PlateJS editor.
 * Updates the AIChatPlugin options whenever the chat status, messages, or error changes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useEditorIntegration(editor: PlateEditor, chat: UseChatHelpers<any>) {
  useEffect(() => {
    // AIChatPlugin expects UseChatHelpers from AI SDK
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor.setOption(AIChatPlugin, 'chat', chat as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.status, chat.messages, chat.error]);
}
