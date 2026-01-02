/**
 * Mock implementations for Plate.js modules used in tests
 */

export const getPluginType = jest.fn((type: string) => type);
export const KEYS = {
  ARROW_DOWN: 'ArrowDown',
  ARROW_UP: 'ArrowUp',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  TAB: 'Tab',
};

export const PathApi = {
  parent: jest.fn((path: number[]) => path.slice(0, -1)),
  next: jest.fn((path: number[]) => path.map((p, i) => i === path.length - 1 ? p + 1 : p)),
  previous: jest.fn((path: number[]) => path.map((p, i) => i === path.length - 1 ? p - 1 : p)),
};

export const createSlateEditor = jest.fn(() => ({
  children: [{ text: '' }],
  selection: null,
  marks: null,
}));

export const nanoid = jest.fn(() => 'mock-id');

// Mock React hooks
export const usePluginOption = jest.fn(() => ({}));

// Mock PlateEditor type
export type PlateEditor = Record<string, unknown>;

// Mock plugin config
export type AnyPluginConfig = Record<string, unknown>;

