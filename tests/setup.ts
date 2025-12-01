/**
 * Setup de testes Jest
 *
 * Configurações globais antes de rodar os testes.
 */

import dotenv from 'dotenv';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: '.env.local' });

// Timeout padrão para testes de integração (30 segundos)
jest.setTimeout(30000);

// Mock do console.error para evitar poluir output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
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
