'use client';

import emojiMartData from '@emoji-mart/data';
import { EmojiInputPlugin, EmojiPlugin } from '@platejs/emoji/react';

import { EmojiInputElement } from '@/components/editor/plate-ui/emoji-node';

export const EmojiKit = [
  EmojiPlugin.configure({
    // @ts-expect-error - emojiMartData type mismatch with library expectations
    options: { data: emojiMartData },
  }),
  EmojiInputPlugin.withComponent(EmojiInputElement),
];
