/**
 * Setup de testes Jest
 *
 * Configurações globais antes de rodar os testes.
 */

import dotenv from 'dotenv';
import '@testing-library/jest-dom';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: '.env.local' });

// Timeout padrão para testes de integração (30 segundos)
jest.setTimeout(30000);

// Mock do console.error para evitar poluir output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Silenciar erros esperados em testes
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock de window.matchMedia para testes responsivos
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de window.ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock de IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
