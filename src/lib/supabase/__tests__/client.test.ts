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

  it('reuses the same browser client instance', () => {
    const mockClient = { auth: {} };
    const mockCreateBrowserClient = jest.fn().mockReturnValue(mockClient);

    jest.doMock('@supabase/ssr', () => ({
      createBrowserClient: mockCreateBrowserClient,
    }));

    const { createClient } = require('@/lib/supabase/client');

    const firstClient = createClient();
    const secondClient = createClient();

    expect(firstClient).toBe(mockClient);
    expect(secondClient).toBe(mockClient);
    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key'
    );
  });
});
