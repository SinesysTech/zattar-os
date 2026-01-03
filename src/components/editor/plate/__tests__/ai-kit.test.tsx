import { describe, expect, test, jest } from '@jest/globals';

// Mock problematic dependencies
jest.mock('@platejs/selection/react', () => ({
  CursorOverlayPlugin: {
    configure: jest.fn(() => ({})),
  },
}));

// Mock ESM-only modules
jest.mock('remark-gfm', () => ({
  default: jest.fn(),
}));

jest.mock('remark-math', () => ({
  default: jest.fn(),
}));

// Mock @platejs/markdown
jest.mock('@platejs/markdown', () => ({
  MarkdownPlugin: {
    configure: jest.fn(() => ({})),
  },
  remarkMdx: jest.fn(),
  remarkMention: jest.fn(),
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
