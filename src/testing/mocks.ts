import { SupabaseClient } from '@supabase/supabase-js';

// Helper para criar funções mock
const createMockFn = () => {
  const fn = function mockFn() {
    return fn;
  };
  fn.mockReturnThis = () => fn;
  fn.mockReturnValue = (value: unknown) => {
    const newFn = function mockFnWithReturn() {
      return value;
    };
    Object.assign(newFn, fn);
    return newFn;
  };
  return fn;
};

export const createMockSupabaseClient = (): SupabaseClient => {
  const mockFn = createMockFn();
  
  return {
    from: mockFn,
    select: mockFn,
    insert: mockFn,
    update: mockFn,
    delete: mockFn,
    eq: mockFn,
    single: mockFn,
    order: mockFn,
    limit: mockFn,
    maybeSingle: mockFn,
    in: mockFn,
    rpc: mockFn,
    auth: {
      getUser: createMockFn(),
      signInWithPassword: createMockFn(),
      signOut: createMockFn(),
      getSession: createMockFn(),
    },
    storage: {
      from: mockFn,
      upload: createMockFn(),
      getPublicUrl: createMockFn(),
      createSignedUrl: createMockFn(),
      download: createMockFn(),
    }
  } as unknown as SupabaseClient;
};
