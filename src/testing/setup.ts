
import '@testing-library/jest-dom';

// Global mocks if needed
// global.ResizeObserver = require('resize-observer-polyfill');

// -----------------------------------------------------------------------------
// Next.js App Router (next/navigation)
// -----------------------------------------------------------------------------
// Muitos componentes client usam useRouter/usePathname e, em Jest, não existe App Router montado.
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/audiencias/semana',
  useSearchParams: () => new URLSearchParams(),
}));

// Polyfill for TextEncoder/TextDecoder (needed for Next.js server components in tests)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock server-only module for unit tests
// This module throws an error when imported in client components
// We need to mock it in tests since Jest runs in a Node environment
jest.mock('server-only', () => ({}), { virtual: true });

// Mock next/cache for unit tests (needed for server actions)
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

// Mock Request/Response globals for Next.js server code
if (typeof global.Request === 'undefined') {
  global.Request = class Request {} as typeof Request;
  global.Response = class Response {} as typeof Response;
}

// Mock TransformStream for AI SDK
if (typeof global.TransformStream === 'undefined') {
  try {
    const { TransformStream } = require('stream/web');
    global.TransformStream = TransformStream;
  } catch {
    // Fallback mock if stream/web is not available
    global.TransformStream = class TransformStream {
      readable: ReadableStream;
      writable: WritableStream;
      constructor() {
        this.readable = new ReadableStream();
        this.writable = new WritableStream();
      }
    } as typeof TransformStream;
  }
}

// Mock scrollIntoView for DOM elements (needed for Radix UI Select)
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = jest.fn();
}

// Mock uuid module for tests that use it
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
  v1: jest.fn(() => 'mock-uuid-v1'),
  v3: jest.fn(() => 'mock-uuid-v3'),
  v5: jest.fn(() => 'mock-uuid-v5'),
}));

// Mock platejs modules to avoid ESM import issues
const createChainablePlatePlugin = () => {
  // plugin "fluente" suficiente para carregar kits no ambiente Jest
  // (métodos retornam o próprio plugin)
  const plugin: any = {};
  plugin.configure = jest.fn(() => plugin);
  plugin.extend = jest.fn(() => plugin);
  plugin.extendTransforms = jest.fn(() => plugin);
  plugin.extendApi = jest.fn(() => plugin);
  return plugin;
};

jest.mock(
  'platejs',
  () => ({
    // Assinatura real costuma ser (editor, key) => string
    getPluginType: jest.fn((_editor: unknown, key: string) => key),
    getPluginTypes: jest.fn((_editor: unknown, keys: string[]) => keys),
    isSlateString: jest.fn(() => false),
    KEYS: new Proxy(
      {
        ARROW_DOWN: 'ArrowDown',
        ARROW_UP: 'ArrowUp',
        ENTER: 'Enter',
        ESCAPE: 'Escape',
        TAB: 'Tab',
        // usado em kits: spread([...KEYS.heading, ...])
        heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      },
      {
        get(target, prop) {
          if (prop in target) return (target as any)[prop];
          return String(prop);
        },
      }
    ),
    PathApi: {
      parent: jest.fn(),
      next: jest.fn(),
      previous: jest.fn(),
    },
    createSlateEditor: jest.fn(() => ({
      children: [{ text: '' }],
      selection: null,
      marks: null,
      api: {
        isExpanded: jest.fn(() => false),
      },
    })),
    nanoid: jest.fn(() => 'mock-id'),
  }),
  { virtual: true }
);

jest.mock(
  'platejs/react',
  () => {
    const React = require('react');

    return {
      usePluginOption: jest.fn(() => ({})),
      toTPlatePlugin: jest.fn(() => createChainablePlatePlugin()),
      PlateContainer: ({ children, ...props }: any) =>
        React.createElement('div', { ...props, 'data-plate-container': true }, children),
      PlateContent: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('div', { ref, ...props, 'data-plate-content': true }, children)
      ),
    };
  },
  { virtual: true }
);

jest.mock(
  '@platejs/ai',
  () => ({
    getAIContent: jest.fn(() => ''),
    isAINode: jest.fn(() => false),
    getMarkdown: jest.fn(() => ''),
    withAIBatch: jest.fn((_editor: unknown, fn: () => void) => fn()),
  }),
  { virtual: true }
);
jest.mock(
  '@platejs/ai/react',
  () => {
    const plugin = createChainablePlatePlugin();
    plugin.extend = jest.fn(() => plugin);

    return {
      AIChatPlugin: plugin,
      AIPlugin: { withComponent: jest.fn(() => createChainablePlatePlugin()) },
      applyAISuggestions: jest.fn(),
      streamInsertChunk: jest.fn(),
      useAIState: jest.fn(() => ({})),
      useChatChunk: jest.fn(),
      AIMarkdownPlugin: createChainablePlatePlugin(),
      AIMdxPlugin: createChainablePlatePlugin(),
    };
  },
  { virtual: true }
);
jest.mock(
  '@platejs/basic-styles',
  () => ({
    BaseTextAlignPlugin: createChainablePlatePlugin(),
  }),
  { virtual: true }
);
jest.mock(
  '@platejs/comment',
  () => ({
    BaseCommentPlugin: createChainablePlatePlugin(),
    getDraftCommentKey: jest.fn(() => 'mock-draft-comment-key'),
    getCommentKey: jest.fn(() => 'mock-comment-key'),
    getTransientCommentKey: jest.fn(() => 'mock-transient-comment-key'),
  }),
  { virtual: true }
);
jest.mock(
  '@platejs/selection/react',
  () => ({
    BlockSelectionPlugin: createChainablePlatePlugin(),
  }),
  { virtual: true }
);
jest.mock(
  '@platejs/suggestion',
  () => ({
    getTransientSuggestionKey: jest.fn(() => 'mock-transient-suggestion-key'),
  }),
  { virtual: true }
);

jest.mock(
  '@platejs/markdown',
  () => ({
    serializeMd: jest.fn(() => ''),
    deserializeMd: jest.fn(() => []),
  }),
  { virtual: true }
);

jest.mock(
  '@platejs/comment/react',
  () => ({
    CommentPlugin: createChainablePlatePlugin(),
  }),
  { virtual: true }
);

jest.mock(
  '@platejs/suggestion/react',
  () => ({
    SuggestionPlugin: createChainablePlatePlugin(),
  }),
  { virtual: true }
);

// -----------------------------------------------------------------------------
// Plate Editor kits/components (evita puxar dependências ESM de node_modules no Jest)
// -----------------------------------------------------------------------------
jest.mock('@/components/editor/plate/editor-base-kit', () => ({
  BaseEditorKit: [],
}));

jest.mock('@/components/editor/plate-ui/ai-menu', () => ({
  AIMenu: () => null,
  AILoadingBar: () => null,
}));

jest.mock('@/components/editor/plate-ui/ai-node', () => ({
  AIAnchorElement: () => null,
  AILeaf: () => null,
}));