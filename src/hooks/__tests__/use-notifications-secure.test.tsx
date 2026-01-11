import { webcrypto } from 'crypto';
import React from 'react';
import { render, waitFor, renderHook, act, fireEvent } from '@testing-library/react';

import { NotificationProvider, useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/hooks/use-auth';

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123' },
    isLoading: false,
    isAuthenticated: true,
    logout: async () => {
      if (typeof window === 'undefined') return;
      ['chat-notifications', 'chat-unread-counts', 'call-layout'].forEach((k) => localStorage.removeItem(k));
    },
    checkSession: async () => true,
  }),
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

beforeAll(() => {
  (globalThis as unknown as { fetch: unknown }).fetch = jest
    .fn(async () => ({ ok: true }))
    .mockName('fetch');
});

beforeAll(() => {
  const real = webcrypto as unknown as Crypto;
  const mockCrypto = {
    subtle: {
      importKey: jest.fn(real.subtle.importKey.bind(real.subtle)),
      deriveKey: jest.fn(real.subtle.deriveKey.bind(real.subtle)),
      encrypt: jest.fn(real.subtle.encrypt.bind(real.subtle)),
      decrypt: jest.fn(real.subtle.decrypt.bind(real.subtle)),
    },
    getRandomValues: jest.fn(real.getRandomValues.bind(real)),
  } as unknown as Crypto;

  Object.defineProperty(globalThis, 'crypto', {
    value: mockCrypto,
    configurable: true,
    writable: true,
  });
});

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
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock(),
      writable: true,
      configurable: true,
    });
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
    const notifCall = calls.find((c) => c[0] === 'chat-notifications');
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
      const notifCall = calls.find((c) => c[0] === 'chat-notifications');
      const countsCall = calls.find((c) => c[0] === 'chat-unread-counts');

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

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('chat-notifications');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('chat-unread-counts');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('call-layout');
  });
});
