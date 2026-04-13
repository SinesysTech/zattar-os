/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * @jest-environment jest-environment-jsdom
 */
describe('supabase browser client', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY = 'anon-key';
  });

  it('delegates to createBrowserClient from @supabase/ssr', () => {
    const mockClient = { auth: {} };
    // @supabase/ssr's createBrowserClient already returns a singleton in browser.
    // Our createClient() is a thin wrapper that delegates directly to it.
    const mockCreateBrowserClient = jest.fn().mockReturnValue(mockClient);

    jest.doMock('@supabase/ssr', () => ({
      createBrowserClient: mockCreateBrowserClient,
    }));

    const { createClient } = require('@/lib/supabase/client');

    const firstClient = createClient();
    const secondClient = createClient();

    expect(firstClient).toBe(mockClient);
    expect(secondClient).toBe(mockClient);
    // Each call delegates to createBrowserClient; the SDK handles singleton caching internally
    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(2);
    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key'
    );
  });

  it('throws when env vars are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

    const { createClient } = require('@/lib/supabase/client');

    expect(() => createClient()).toThrow('Supabase URL e Anon Key são obrigatórios');
  });
});
