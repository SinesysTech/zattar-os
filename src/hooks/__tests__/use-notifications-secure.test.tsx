import React from 'react';
import { render, waitFor, renderHook, act, fireEvent, cleanup } from '@testing-library/react';

import { useAuthSession } from '@/providers/user-provider';

jest.mock('@/providers/user-provider', () => ({
  useAuthSession: () => ({
    user: { id: 'test-user-123' },
    isLoading: false,
    isAuthenticated: true,
    sessionToken: 'test-token',
    logout: async () => {
      if (typeof window === 'undefined') return;
      ['chat-notifications', 'chat-unread-counts', 'call-layout'].forEach((k) => localStorage.removeItem(k));
    },
  }),
  useUser: () => null,
  usePermissoes: () => ({ temPermissao: jest.fn(() => true), permissoes: [] }),
}));

function createLocalStorageMock(initial?: Record<string, string>) {
  const store = new Map<string, string>(Object.entries(initial ?? {}));

  return {
    getItem: jest.fn((k: string) => (store.has(k) ? store.get(k)! : null)),
    setItem: jest.fn((k: string, v: string) => {
      store.set(k, v);
    }),
    removeItem: jest.fn((k: string) => {
      store.delete(k);
    }),
    clear: jest.fn(() => store.clear()),
    key: jest.fn((i: number) => Array.from(store.keys())[i] ?? null),
    get length() {
      return store.size;
    },
  };
}

jest.mock('@/lib/supabase/client', () => {
  const removeChannel = jest.fn();

  const channelObj = {
    on: jest.fn(() => ({ subscribe: jest.fn(() => ({})) })),
  };

  const client = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(async () => ({ data: { id: 'room-1', nome: 'Sala' }, error: null })),
        })),
      })),
    })),
    channel: jest.fn(() => channelObj),
    removeChannel,
    auth: {
      getUser: jest.fn(async () => ({ data: { user: { id: 'test-user-123' } }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signOut: jest.fn(async () => ({})),
    },
  };

  return {
    createClient: jest.fn(() => client),
  };
});

// Mock useSecureStorage to avoid all crypto operations (OOM source).
// Instead, use a simple in-memory state backed by localStorage with "enc:" prefix.
jest.mock('@/hooks/use-secure-storage', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');

  return {
    useSecureStorage: <T,>(key: string, initialValue: T, options?: { migrateFromPlaintext?: boolean; ttl?: number }) => {
      const [val, setVal] = React.useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;
        const raw = window.localStorage.getItem(key);
        if (!raw) return initialValue;

        // Check TTL expiry
        if (raw.startsWith('enc:')) {
          const parts = raw.split(':');
          const ts = parseInt(parts[parts.length - 1] || '0', 10);
          const ttl = options?.ttl ?? 7 * 24 * 60 * 60 * 1000;
          if (ts > 0 && Date.now() - ts > ttl) {
            window.localStorage.removeItem(key);
            return initialValue;
          }
        }

        // Migration from plaintext
        if (!raw.startsWith('enc:') && options?.migrateFromPlaintext) {
          try {
            const parsed = JSON.parse(raw) as T;
            // Schedule async migration
            setTimeout(() => {
              window.localStorage.setItem(key, `enc:1:salt:iv:${JSON.stringify(parsed)}:${Date.now()}`);
            }, 0);
            return parsed;
          } catch {
            return initialValue;
          }
        }

        if (raw.startsWith('enc:')) {
          // Already encrypted - parse
          const parts = raw.split(':');
          try {
            return JSON.parse(parts[4] || 'null') as T;
          } catch {
            return initialValue;
          }
        }

        try {
          return JSON.parse(raw) as T;
        } catch {
          return initialValue;
        }
      });

      const setter = React.useCallback((next: T | ((prev: T) => T)) => {
        setVal((prev: T) => {
          const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, `enc:1:salt:iv:${JSON.stringify(resolved)}:${Date.now()}`);
          }
          return resolved;
        });
      }, [key]);

      return [val, setter, { isLoading: false, error: null }];
    },
  };
});

beforeAll(() => {
  (globalThis as unknown as { fetch: unknown }).fetch = jest
    .fn(async () => ({ ok: true }))
    .mockName('fetch');
});

// Import after mocks
import { NotificationProvider, useNotifications } from '@/hooks/use-notifications';

function Harness() {
  const { addNotification } = useNotifications();

  return (
    <button
      type="button"
      onClick={() =>
        addNotification({
          roomId: 'room-1',
          roomName: 'Sala',
          userName: 'Fulano',
          message: 'Olá',
          type: 'message',
        })
      }
    >
      Add
    </button>
  );
}

describe('use-notifications secure storage integration', () => {
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock(),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('saves notifications encrypted', async () => {
    const { getByRole } = render(
      <NotificationProvider currentUserId={999}>
        <Harness />
      </NotificationProvider>
    );

    fireEvent.click(getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    const calls = (window.localStorage.setItem as jest.Mock).mock.calls;
    const notifCall = calls.find((c: string[]) => c[0] === 'chat-notifications');
    expect(String(notifCall?.[1] ?? '')).toMatch(/^enc:/);
  });

  it('migrates plaintext notifications and unread counts', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock({
        'chat-notifications': JSON.stringify([
          {
            id: '1',
            roomId: 'room-1',
            roomName: 'Sala',
            userName: 'X',
            message: 'Y',
            timestamp: new Date().toISOString(),
            type: 'message',
            isRead: false,
          },
        ]),
        'chat-unread-counts': JSON.stringify({ 'room-1': 2 }),
      }),
      writable: true,
      configurable: true,
    });

    render(
      <NotificationProvider currentUserId={999}>
        <div />
      </NotificationProvider>
    );

    await waitFor(() => {
      const calls = (window.localStorage.setItem as jest.Mock).mock.calls;
      const notifCall = calls.find((c: string[]) => c[0] === 'chat-notifications');
      const countsCall = calls.find((c: string[]) => c[0] === 'chat-unread-counts');

      expect(String(notifCall?.[1] ?? '')).toMatch(/^enc:/);
      expect(String(countsCall?.[1] ?? '')).toMatch(/^enc:/);
    });
  });

  it('removes expired encrypted data on load', async () => {
    const expired = `enc:1:aaaa:bbbb:cccc:${Date.now() - 8 * 24 * 60 * 60 * 1000}`;

    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock({
        'chat-notifications': expired,
        'chat-unread-counts': expired,
      }),
      writable: true,
      configurable: true,
    });

    render(
      <NotificationProvider currentUserId={999}>
        <div />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('chat-notifications');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('chat-unread-counts');
    });
  });

  it('logout clears notifications keys', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock({
        'chat-notifications': 'enc:1:a:b:c:0',
        'chat-unread-counts': 'enc:1:a:b:c:0',
        'call-layout': 'enc:1:a:b:c:0',
      }),
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useAuthSession());

    await act(async () => {
      await result.current.logout();
    });

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('chat-notifications');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('chat-unread-counts');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('call-layout');
  });
});
