import { describe, expect, test } from '@jest/globals';

import { AIKit, aiChatPlugin } from '../ai-kit';

describe('AIKit', () => {
  test('exports plugins array', () => {
    expect(Array.isArray(AIKit)).toBe(true);
    expect(AIKit.length).toBeGreaterThan(0);
  });

  test('exports aiChatPlugin', () => {
    expect(aiChatPlugin).toBeTruthy();
  });
});
