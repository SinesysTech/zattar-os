
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