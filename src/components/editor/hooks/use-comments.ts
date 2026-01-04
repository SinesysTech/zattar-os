'use client';

import { getCommentKey, getTransientCommentKey } from '@platejs/comment';
import { deserializeMd } from '@platejs/markdown';
import type { TNode } from 'platejs';
import { KEYS, nanoid, NodeApi, TextApi } from 'platejs';
import type { PlateEditor } from 'platejs/react';

import { discussionPlugin } from '../plate/discussion-kit';

import type { TComment } from '../types';

export type AIComment = NonNullable<TComment['comment']>;

export type CreateCommentOptions = {
  aiComment: AIComment;
  range: {
    anchor: { offset: number; path: number[] };
    focus: { offset: number; path: number[] };
  };
};

/**
 * Creates a discussion/comment from AI-generated comment data.
 * Applies comment marks to the editor at the specified range.
 */
export function createComment(
  editor: PlateEditor,
  { aiComment, range }: CreateCommentOptions
): void {
  const discussions =
    editor.getOption(discussionPlugin, 'discussions') || [];

  // Generate a new discussion ID
  const discussionId = nanoid();

  // Create a new comment
  const newComment = {
    id: nanoid(),
    contentRich: [{ children: [{ text: aiComment.comment }], type: 'p' }],
    createdAt: new Date(),
    discussionId,
    isEdited: false,
    userId: editor.getOption(discussionPlugin, 'currentUserId'),
  };

  // Create a new discussion
  const newDiscussion = {
    id: discussionId,
    comments: [newComment],
    createdAt: new Date(),
    documentContent: deserializeMd(editor, aiComment.content)
      .map((node: TNode) => NodeApi.string(node))
      .join('\n'),
    isResolved: false,
    userId: editor.getOption(discussionPlugin, 'currentUserId'),
  };

  // Update discussions
  const updatedDiscussions = [...discussions, newDiscussion];
  editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);

  // Apply comment marks to the editor
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
