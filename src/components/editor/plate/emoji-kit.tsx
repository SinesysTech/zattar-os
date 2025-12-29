'use client';

import emojiMartData from '@emoji-mart/data';
import { EmojiInputPlugin, EmojiPlugin } from '@platejs/emoji/react';

import { EmojiInputElement } from '@/components/editor/plate-ui/emoji-node';

const emojiData =
  (emojiMartData as unknown as { default?: unknown }).default ?? emojiMartData;

export const EmojiKit = [
  EmojiPlugin.configure({
    options: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- emoji-mart data type mismatch
      data: emojiData as any,
    },
  }),
  EmojiInputPlugin.withComponent(EmojiInputElement),
];
