import { describe, expect, test, jest } from '@jest/globals';

// Mock problematic dependencies
jest.mock('@platejs/selection/react', () => ({
  CursorOverlayPlugin: {
    configure: jest.fn(() => ({})),
  },
}));

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
