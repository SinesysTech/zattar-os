'use client';

import emojiMartData from '@emoji-mart/data';
import { EmojiInputPlugin, EmojiPlugin } from '@platejs/emoji/react';

import { EmojiInputElement } from '@/components/editor/plate-ui/emoji-node';

const emojiData =
  (emojiMartData as unknown as { default?: unknown }).default ?? emojiMartData;

export const EmojiKit = [
  EmojiPlugin.configure({
    options: {
      data: emojiData as any,
    },
  }),
  EmojiInputPlugin.withComponent(EmojiInputElement),
];
