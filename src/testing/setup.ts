import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Global mocks if needed
// global.ResizeObserver = require('resize-observer-polyfill');

// Polyfill matchMedia (usado por hooks responsivos)
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }) as MediaQueryList;
}

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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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

// Polyfill Web Streams (ReadableStream/WritableStream) used by undici/Next.js web APIs
if (typeof global.ReadableStream === 'undefined' || typeof global.WritableStream === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webStreams = require('stream/web');
    if (typeof global.ReadableStream === 'undefined') global.ReadableStream = webStreams.ReadableStream;
    if (typeof global.WritableStream === 'undefined') global.WritableStream = webStreams.WritableStream;
  } catch {
    // If not available, tests that depend on web streams will need dedicated mocks.
  }
}

// Mock Request/Response globals for Next.js server code
if (typeof global.Request === 'undefined' || typeof global.Response === 'undefined') {
  // Next.js (NextResponse/NextRequest) depende das Web APIs (Request/Response/Headers).
  // Em Jest/jsdom, nem sempre elas existem. Usamos as implementações do undici.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const undici = require('undici');

  if (typeof global.Headers === 'undefined') {
    global.Headers = undici.Headers;
  }
  if (typeof global.Request === 'undefined') {
    global.Request = undici.Request;
  }
  if (typeof global.Response === 'undefined') {
    global.Response = undici.Response;
  }
}

// Mock TransformStream for AI SDK
if (typeof global.TransformStream === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
  const plugin: Record<string, unknown> = {};
  plugin.configure = jest.fn(() => plugin);
  plugin.extend = jest.fn(() => plugin);
  plugin.extendTransforms = jest.fn(() => plugin);
  plugin.extendApi = jest.fn(() => plugin);
  plugin.withComponent = jest.fn(() => plugin);
  return plugin;
};

jest.mock(
  'platejs',
  () => ({
    // Assinatura real costuma ser (editor, key) => string
    getPluginType: jest.fn((_editor: unknown, key: string) => key),
    getPluginTypes: jest.fn((_editor: unknown, keys: string[]) => keys),
    isSlateString: jest.fn(() => false),
    createPlatePlugin: jest.fn((_config: unknown) => createChainablePlatePlugin()),
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
          if (typeof prop === 'symbol') return undefined;
          const key = String(prop);
          if (key in target) return (target as Record<string, unknown>)[key];
          return key;
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
  undefined
);

jest.mock(
  'platejs/react',
  () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react');

    return {
      usePluginOption: jest.fn(() => ({})),
      toTPlatePlugin: jest.fn(() => createChainablePlatePlugin()),
      createPlatePlugin: jest.fn(() => createChainablePlatePlugin()),
      PlateContainer: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
        React.createElement('div', { ...props, 'data-plate-container': true }, children),
      PlateContent: (() => {
        const Component = React.forwardRef(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }, ref: unknown) =>
          React.createElement('div', { ref, ...props, 'data-plate-content': true }, children)
        );
        Component.displayName = 'PlateContent';
        return Component;
      })(),
    };
  },
  undefined
);

jest.mock(
  '@platejs/ai',
  () => ({
    getAIContent: jest.fn(() => ''),
    isAINode: jest.fn(() => false),
    getMarkdown: jest.fn(() => ''),
    withAIBatch: jest.fn((_editor: unknown, fn: () => void) => fn()),
  }),
  undefined
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
  undefined
);
jest.mock(
  '@platejs/basic-styles',
  () => ({
    BaseTextAlignPlugin: createChainablePlatePlugin(),
  }),
  undefined
);
jest.mock(
  '@platejs/comment',
  () => ({
    BaseCommentPlugin: createChainablePlatePlugin(),
    getDraftCommentKey: jest.fn(() => 'mock-draft-comment-key'),
    getCommentKey: jest.fn(() => 'mock-comment-key'),
    getTransientCommentKey: jest.fn(() => 'mock-transient-comment-key'),
  }),
  undefined
);
jest.mock(
  '@platejs/selection/react',
  () => ({
    BlockSelectionPlugin: createChainablePlatePlugin(),
  }),
  undefined
);
jest.mock(
  '@platejs/suggestion',
  () => ({
    getTransientSuggestionKey: jest.fn(() => 'mock-transient-suggestion-key'),
  }),
  undefined
);

jest.mock(
  '@platejs/markdown',
  () => ({
    serializeMd: jest.fn(() => ''),
    deserializeMd: jest.fn(() => []),
  }),
  undefined
);

jest.mock(
  '@platejs/basic-nodes/react',
  () => ({
    BoldPlugin: createChainablePlatePlugin(),
    ItalicPlugin: createChainablePlatePlugin(),
    UnderlinePlugin: createChainablePlatePlugin(),
    CodePlugin: createChainablePlatePlugin(),
    StrikethroughPlugin: createChainablePlatePlugin(),
    SubscriptPlugin: createChainablePlatePlugin(),
    SuperscriptPlugin: createChainablePlatePlugin(),
    HighlightPlugin: createChainablePlatePlugin(),
    KbdPlugin: createChainablePlatePlugin(),
  }),
  undefined
);

jest.mock(
  '@platejs/comment/react',
  () => ({
    CommentPlugin: createChainablePlatePlugin(),
  }),
  undefined
);

jest.mock(
  '@platejs/suggestion/react',
  () => ({
    SuggestionPlugin: createChainablePlatePlugin(),
  }),
  undefined
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

// -----------------------------------------------------------------------------
// External Services Mocks
// -----------------------------------------------------------------------------

// Mock Backblaze B2 Service
jest.mock('@/lib/storage/backblaze-b2.service', () => ({
  uploadToBackblaze: jest.fn(),
  deleteFromBackblaze: jest.fn(),
  generatePresignedUrl: jest.fn(),
  getFileInfo: jest.fn(),
  listFiles: jest.fn(),
}));

// Mock Dyte Client
jest.mock('@/lib/dyte/client', () => ({
  createMeeting: jest.fn(),
  addParticipant: jest.fn(),
  getMeetingDetails: jest.fn(),
  getActiveMeetings: jest.fn(),
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
  getRecordingDetails: jest.fn(),
  ensureTranscriptionPreset: jest.fn(),
}));

// Mock Dyte Config
jest.mock('@/lib/dyte/config', () => ({
  isDyteRecordingEnabled: jest.fn(() => true),
  isDyteTranscriptionEnabled: jest.fn(() => true),
  getDyteTranscriptionLanguage: jest.fn(() => 'pt-BR'),
}));

// Mock Dyte Utils
jest.mock('@/lib/dyte/utils', () => ({
  generateMeetingTitle: jest.fn((salaId: number, salaNome: string, tipo: string) =>
    `${salaNome} - ${tipo}`
  ),
}));