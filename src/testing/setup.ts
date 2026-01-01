
import '@testing-library/jest-dom';

// Global mocks if needed
// global.ResizeObserver = require('resize-observer-polyfill');

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
jest.mock('platejs', () => ({
  getPluginType: jest.fn((type: string) => type),
  KEYS: {
    ARROW_DOWN: 'ArrowDown',
    ARROW_UP: 'ArrowUp',
    ENTER: 'Enter',
    ESCAPE: 'Escape',
    TAB: 'Tab',
  },
  PathApi: {
    parent: jest.fn(),
    next: jest.fn(),
    previous: jest.fn(),
  },
  createSlateEditor: jest.fn(() => ({
    children: [{ text: '' }],
    selection: null,
    marks: null,
  })),
  nanoid: jest.fn(() => 'mock-id'),
}), { virtual: true });

jest.mock('platejs/react', () => ({
  usePluginOption: jest.fn(() => ({})),
}), { virtual: true });

jest.mock('@platejs/ai', () => ({}), { virtual: true });
jest.mock('@platejs/ai/react', () => ({}), { virtual: true });
jest.mock('@platejs/basic-styles', () => ({}), { virtual: true });
jest.mock('@platejs/comment', () => ({}), { virtual: true });
jest.mock('@platejs/selection/react', () => ({}), { virtual: true });
jest.mock('@platejs/suggestion', () => ({}), { virtual: true });