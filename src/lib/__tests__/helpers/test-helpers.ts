/**
 * Helpers de Teste Reutilizáveis
 *
 * Funções utilitárias para facilitar a criação de testes
 */

import type { AuthenticatedUser } from '@/lib/safe-action';

/**
 * Cria um mock de Supabase Client
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn(),
          maybeSingle: jest.fn(),
        }),
        in: jest.fn(),
        order: jest.fn(),
        limit: jest.fn(),
        range: jest.fn(),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn(),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn(),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn(),
      }),
      upsert: jest.fn().mockReturnValue({
        select: jest.fn(),
      }),
    }),
    rpc: jest.fn(),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
      }),
    },
  };
}

/**
 * Cria um mock de Redis Client
 */
export function createMockRedisClient() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    info: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    flushall: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
  };
}

/**
 * Gera um usuário mock para testes
 */
export function createMockUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    nomeCompleto: 'João Silva',
    emailCorporativo: 'joao@example.com',
    ...overrides,
  };
}

/**
 * Cria um FormData mock com dados fornecidos
 */
export function createFormData(data: Record<string, string | number | boolean>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, String(value));
  });
  return formData;
}

/**
 * Cria um FormData mock com múltiplos valores para a mesma chave
 */
export function createFormDataWithArrays(data: Record<string, (string | number)[]>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, values]) => {
    values.forEach(value => {
      formData.append(key, String(value));
    });
  });
  return formData;
}

/**
 * Cria um mock de NextRequest
 */
export function createMockNextRequest(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
} = {}) {
  const {
    url = 'http://localhost:3000/api/test',
    method = 'GET',
    headers = {},
    body,
  } = options;

  return {
    url,
    method,
    headers: new Headers(headers),
    body,
    json: jest.fn().mockResolvedValue(body),
  };
}

/**
 * Cria um mock de processo para testes
 */
export function createMockProcesso(overrides = {}) {
  return {
    id: 1,
    numero_processo: '0001234-56.2024.8.26.0100',
    valor_causa: 50000.00,
    data_distribuicao: '2024-01-15',
    status: 'ativo',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
    ...overrides,
  };
}

/**
 * Cria um mock de cliente para testes
 */
export function createMockCliente(overrides = {}) {
  return {
    id: 1,
    nome_completo: 'Maria Santos',
    cpf: '12345678901',
    email: 'maria@example.com',
    telefone: '11987654321',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Espera um tempo determinado (útil para testes assíncronos)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Cria um spy para console.error que pode ser restaurado
 */
export function mockConsoleError() {
  return jest.spyOn(console, 'error').mockImplementation(() => {});
}

/**
 * Cria um spy para console.warn que pode ser restaurado
 */
export function mockConsoleWarn() {
  return jest.spyOn(console, 'warn').mockImplementation(() => {});
}

/**
 * Cria um spy para console.log que pode ser restaurado
 */
export function mockConsoleLog() {
  return jest.spyOn(console, 'log').mockImplementation(() => {});
}

/**
 * Limpa todos os mocks e spies
 */
export function cleanupMocks() {
  jest.clearAllMocks();
  jest.restoreAllMocks();
}

/**
 * Wrapper para testes assíncronos com timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Test timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Cria um mock de ambiente de variáveis
 */
export function createMockEnv(env: Record<string, string>) {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env = { ...originalEnv, ...env };
  });

  afterAll(() => {
    process.env = originalEnv;
  });
}

/**
 * Gera dados de teste aleatórios
 */
export const testDataGenerators = {
  randomString: (length: number = 10): string => {
    return Math.random().toString(36).substring(2, 2 + length);
  },

  randomNumber: (min: number = 0, max: number = 100): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randomEmail: (): string => {
    return `test${testDataGenerators.randomString(8)}@example.com`;
  },

  randomCPF: (): string => {
    const randomDigits = () => testDataGenerators.randomNumber(0, 9);
    return Array.from({ length: 11 }, randomDigits).join('');
  },

  randomCNPJ: (): string => {
    const randomDigits = () => testDataGenerators.randomNumber(0, 9);
    return Array.from({ length: 14 }, randomDigits).join('');
  },

  randomPhone: (): string => {
    return `11${testDataGenerators.randomNumber(90000000, 99999999)}`;
  },

  randomDate: (): string => {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
  },
};

/**
 * Verifica se um objeto tem estrutura esperada
 */
export function expectObjectStructure<T extends Record<string, any>>(
  obj: T,
  expectedKeys: (keyof T)[]
): void {
  const actualKeys = Object.keys(obj);
  expect(actualKeys).toHaveLength(expectedKeys.length);
  expectedKeys.forEach(key => {
    expect(obj).toHaveProperty(key);
  });
}

/**
 * Cria um mock de resultado de ação (ActionResult)
 */
export function createMockActionResult<T>(
  success: boolean,
  data?: T,
  error?: string
) {
  if (success) {
    return {
      success: true as const,
      data: data!,
      message: 'Operação realizada com sucesso',
    };
  } else {
    return {
      success: false as const,
      error: error || 'Erro genérico',
      message: error || 'Erro genérico',
    };
  }
}
