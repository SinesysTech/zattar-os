import { describe, expect, test, jest } from '@jest/globals';

// Mock ESM-only @lit-labs/react to prevent "unexpected token 'export'" errors
jest.mock('@lit-labs/react', () => ({}), { virtual: true });
jest.mock('@lit/reactive-element', () => ({}), { virtual: true });
jest.mock('lit', () => ({}), { virtual: true });

// Helper: create a fake plugin object with .extend, .withComponent, .configure
function createFakePlugin(name: string) {
  const plugin: Record<string, unknown> = {
    key: name,
    configure: jest.fn(() => plugin),
    extend: jest.fn(() => plugin),
    withComponent: jest.fn(() => plugin),
  };
  return plugin;
}

// Mock platejs core
jest.mock('platejs', () => ({
  getPluginType: jest.fn((_editor: unknown, key: string) => key),
  KEYS: { ai: 'ai', aiChat: 'aiChat' },
  PathApi: {
    next: jest.fn((path: number[]) => [...path.slice(0, -1), (path[path.length - 1] ?? 0) + 1]),
  },
}));

jest.mock('platejs/react', () => ({
  usePluginOption: jest.fn(() => null),
  PlateContent: jest.fn(() => null),
  PlateContainer: jest.fn(() => null),
}));

// Mock @platejs modules that fail to parse in Jest
jest.mock('@platejs/ai', () => ({
  withAIBatch: jest.fn((editor: unknown, fn: () => void) => fn()),
  AIPlugin: createFakePlugin('ai'),
  applyAISuggestions: jest.fn(),
  streamInsertChunk: jest.fn(),
}));

jest.mock('@platejs/ai/react', () => ({
  AIChatPlugin: createFakePlugin('aiChat'),
  AIPlugin: createFakePlugin('ai'),
  CopilotPlugin: createFakePlugin('copilot'),
  applyAISuggestions: jest.fn(),
  streamInsertChunk: jest.fn(),
  useChatChunk: jest.fn(),
}));

// Mock problematic dependencies
jest.mock('@platejs/selection/react', () => ({
  CursorOverlayPlugin: createFakePlugin('cursorOverlay'),
}));

// Mock ESM-only modules
jest.mock('remark-gfm', () => ({ default: jest.fn() }));
jest.mock('remark-math', () => ({ default: jest.fn() }));

// Mock @platejs/markdown
jest.mock('@platejs/markdown', () => ({
  MarkdownPlugin: createFakePlugin('markdown'),
  remarkMdx: jest.fn(),
  remarkMention: jest.fn(),
}));

// Mock plate-ui components used by ai-kit.tsx
jest.mock('@/components/editor/plate-ui/ai-menu', () => ({
  AILoadingBar: jest.fn(() => null),
  AIMenu: jest.fn(() => null),
}));

jest.mock('@/components/editor/plate-ui/ai-node', () => ({
  AIAnchorElement: jest.fn(() => null),
  AILeaf: jest.fn(() => null),
}));

// Mock sibling kits
jest.mock('../cursor-overlay-kit', () => ({
  CursorOverlayKit: [],
}));

jest.mock('../markdown-kit', () => ({
  MarkdownKit: [],
}));

// Mock use-chat hook
jest.mock('../../use-chat', () => ({
  useChat: jest.fn(),
}));

describe('AIKit', () => {
  test('exports plugins array', async () => {
    const { AIKit } = await import('../ai-kit');
    expect(Array.isArray(AIKit)).toBe(true);
    expect(AIKit.length).toBeGreaterThan(0);
  });

  test('exports aiChatPlugin', async () => {
    const { aiChatPlugin } = await import('../ai-kit');
    expect(aiChatPlugin).toBeDefined();
  });
});
