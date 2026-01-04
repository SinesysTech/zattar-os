'use client';

import { useCallback } from 'react';

import { AIChatPlugin, aiCommentToRange } from '@platejs/ai/react';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import type { PlateEditor } from 'platejs/react';

import type { TComment } from '../types';

import { createComment } from './use-comments';

export type StreamingDataEvent = {
  type: string;
  data?: TComment | string;
};

/**
 * Hook that provides handlers for processing streaming data events.
 * Handles toolName updates and comment creation from AI responses.
 */
export function useChatStreaming(editor: PlateEditor) {
  const onData = useCallback(
    (data: StreamingDataEvent) => {
      if (data.type === 'data-toolName') {
        // Type assertion needed as data.data is string | TComment | undefined
        // but AIChatPlugin expects a specific tool name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        editor.setOption(AIChatPlugin, 'toolName', data.data as any);
      }

      if (data.type === 'data-comment' && data.data) {
        const commentData = data.data as TComment;

        if (commentData.status === 'finished') {
          editor.getApi(BlockSelectionPlugin).blockSelection.deselect();
          return;
        }

        const aiComment = commentData.comment!;
        const range = aiCommentToRange(editor, aiComment);

        if (!range) {
          console.warn('No range found for AI comment');
          return;
        }

        createComment(editor, { aiComment, range });
      }
    },
    [editor]
  );

  return { onData };
}
