/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-require-imports */
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
      'anon-key',
      expect.objectContaining({ auth: expect.objectContaining({ lockAcquireTimeout: expect.any(Number) }) })
    );
  });

  it('throws when env vars are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

    const { createClient } = require('@/lib/supabase/client');

    expect(() => createClient()).toThrow('Supabase URL e Anon Key são obrigatórios');
  });

  describe('lock noise filter', () => {
    function captureRejectionListener() {
      jest.doMock('@supabase/ssr', () => ({
        createBrowserClient: jest.fn().mockReturnValue({ auth: {} }),
      }));
      // installLockNoiseFilter() roda no module-level e adiciona um listener
      // real em window. Disparamos um Event sintético via dispatchEvent.
      require('@/lib/supabase/client');
      return (event: PromiseRejectionEvent) => window.dispatchEvent(event);
    }

    function fakeRejectionEvent(reason: unknown) {
      const event = new Event('unhandledrejection', { cancelable: true }) as PromiseRejectionEvent;
      Object.defineProperty(event, 'reason', { value: reason });
      const preventDefault = jest.spyOn(event, 'preventDefault');
      const stopImmediatePropagation = jest.spyOn(event, 'stopImmediatePropagation');
      return { event, preventDefault, stopImmediatePropagation };
    }

    it('stops propagation for NavigatorLockAcquireTimeoutError to prevent Next.js Dev Overlay', () => {
      const dispatch = captureRejectionListener();
      const lockError = Object.assign(
        new Error('Lock "lock:sb-xxx-auth-token" was released because another request stole it'),
        { isAcquireTimeout: true }
      );
      const { event, preventDefault, stopImmediatePropagation } = fakeRejectionEvent(lockError);

      dispatch(event);

      expect(preventDefault).toHaveBeenCalledTimes(1);
      // stopImmediatePropagation é o único caminho que impede o
      // onUnhandledRejection do Next dev overlay de exibir Runtime Error.
      expect(stopImmediatePropagation).toHaveBeenCalledTimes(1);
    });

    it('matches by message marker even without isAcquireTimeout flag', () => {
      const dispatch = captureRejectionListener();
      const lockError = new Error(
        'Lock "lock:sb-cxxdivtgeslrujpfpivs-auth-token" was released because another request stole it'
      );
      const { event, preventDefault, stopImmediatePropagation } = fakeRejectionEvent(lockError);

      dispatch(event);

      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(stopImmediatePropagation).toHaveBeenCalledTimes(1);
    });

    it('does not swallow unrelated rejections', () => {
      const dispatch = captureRejectionListener();
      const otherError = new Error('Network request failed');
      const { event, preventDefault, stopImmediatePropagation } = fakeRejectionEvent(otherError);

      dispatch(event);

      expect(preventDefault).not.toHaveBeenCalled();
      expect(stopImmediatePropagation).not.toHaveBeenCalled();
    });
  });
});
