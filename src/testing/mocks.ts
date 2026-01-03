import { jest } from '@jest/globals';
import { SupabaseClient } from '@supabase/supabase-js';

// Helper para criar uma cadeia de mocks que retorna a si mesma
const createChainableMock = () => {
  const mock = jest.fn();
  // Todos os métodos retornam o próprio mock para permitir encadeamento
  mock.mockReturnValue(mock);
  return mock;
};

export const createMockSupabaseClient = (): SupabaseClient => {
  const chainableMock = createChainableMock();

  return {
    from: jest.fn(() => chainableMock),
    select: chainableMock,
    insert: chainableMock,
    update: chainableMock,
    delete: chainableMock,
    eq: chainableMock,
    neq: chainableMock,
    gt: chainableMock,
    gte: chainableMock,
    lt: chainableMock,
    lte: chainableMock,
    like: chainableMock,
    ilike: chainableMock,
    is: chainableMock,
    in: chainableMock,
    contains: chainableMock,
    containedBy: chainableMock,
    rangeGt: chainableMock,
    rangeGte: chainableMock,
    rangeLt: chainableMock,
    rangeLte: chainableMock,
    rangeAdjacent: chainableMock,
    overlaps: chainableMock,
    textSearch: chainableMock,
    match: chainableMock,
    not: chainableMock,
    or: chainableMock,
    filter: chainableMock,
    single: chainableMock,
    maybeSingle: chainableMock,
    order: chainableMock,
    limit: chainableMock,
    range: chainableMock,
    abortSignal: chainableMock,
    rpc: chainableMock,
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      setSession: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        createSignedUrl: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
        move: jest.fn(),
        copy: jest.fn(),
      })),
    }
  } as unknown as SupabaseClient;
};
