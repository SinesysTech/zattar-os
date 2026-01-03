import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '../use-media-query';

describe('useMediaQuery', () => {
  let mockAddEventListener: jest.Mock;
  let mockRemoveEventListener: jest.Mock;
  let mockMatchMedia: jest.Mock;
  let listeners: ((event: MediaQueryListEvent) => void)[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    listeners = [];

    mockAddEventListener = jest.fn((event, listener) => {
      if (event === 'change') {
        listeners.push(listener);
      }
    });

    mockRemoveEventListener = jest.fn((event, listener) => {
      if (event === 'change') {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    });

    mockMatchMedia = jest.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      addListener: jest.fn(), // Deprecated but still present
      removeListener: jest.fn(), // Deprecated but still present
      dispatchEvent: jest.fn(),
      onchange: null,
    }));

    window.matchMedia = mockMatchMedia;
  });

  it('should return false when query does not match', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(max-width: 767px)',
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);
  });

  it('should return true when query matches', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      media: '(max-width: 767px)',
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    });

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(true);
  });

  it('should call matchMedia with correct query', () => {
    const query = '(min-width: 1024px)';
    renderHook(() => useMediaQuery(query));
    expect(mockMatchMedia).toHaveBeenCalledWith(query);
  });

  it('should subscribe to matchMedia changes', () => {
    renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should update when matchMedia changes', () => {
    let currentMatches = false;
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: currentMatches,
      media: query,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    }));

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);

    // Simulate matchMedia change
    act(() => {
      currentMatches = true;
      const event = { matches: true } as MediaQueryListEvent;
      listeners.forEach(listener => listener(event));
    });

    expect(result.current).toBe(true);
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should return false during SSR (getServerSnapshot)', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR behavior
    delete global.window;

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);

    global.window = originalWindow;
  });

  it('should handle multiple queries independently', () => {
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    }));

    const { result: mobileResult } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    const { result: desktopResult } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    expect(mobileResult.current).toBe(true);
    expect(desktopResult.current).toBe(false);
  });
});
