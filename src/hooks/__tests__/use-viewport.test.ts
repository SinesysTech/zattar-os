import { renderHook, act } from '@testing-library/react';
import { useViewport, useViewportWidth, useViewportHeight } from '../use-viewport';

describe('useViewport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return default values during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR behavior
    delete global.window;

    const { result } = renderHook(() => useViewport());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
    expect(result.current.breakpoint).toBe('lg');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);

    global.window = originalWindow;
  });

  it('should detect desktop viewport (1920x1080)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true, configurable: true });

    const { result } = renderHook(() => useViewport());

    expect(result.current.width).toBe(1920);
    expect(result.current.height).toBe(1080);
    expect(result.current.breakpoint).toBe('2xl');
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
  });

  it('should detect tablet viewport (768x1024)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1024, writable: true, configurable: true });

    const { result } = renderHook(() => useViewport());

    expect(result.current.width).toBe(768);
    expect(result.current.height).toBe(1024);
    expect(result.current.breakpoint).toBe('md');
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('should detect mobile viewport (375x667)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, writable: true, configurable: true });

    const { result } = renderHook(() => useViewport());

    expect(result.current.width).toBe(375);
    expect(result.current.height).toBe(667);
    expect(result.current.breakpoint).toBe('xs');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('should update on resize event', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, writable: true, configurable: true });

    const { result } = renderHook(() => useViewport());

    expect(result.current.width).toBe(375);
    expect(result.current.breakpoint).toBe('xs');
    expect(result.current.isMobile).toBe(true);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true, configurable: true });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(1920);
    expect(result.current.height).toBe(1080);
    expect(result.current.breakpoint).toBe('2xl');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(true);
  });

  it('should update on orientationchange event', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1024, writable: true, configurable: true });

    const { result } = renderHook(() => useViewport());

    expect(result.current.width).toBe(768);
    expect(result.current.height).toBe(1024);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true, configurable: true });
      window.dispatchEvent(new Event('orientationchange'));
    });

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useViewport());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should detect all breakpoint transitions', () => {
    const breakpointTests = [
      { width: 320, expected: 'xs' },
      { width: 640, expected: 'sm' },
      { width: 768, expected: 'md' },
      { width: 1024, expected: 'lg' },
      { width: 1280, expected: 'xl' },
      { width: 1536, expected: '2xl' },
    ];

    breakpointTests.forEach(({ width, expected }) => {
      Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true });
      const { result } = renderHook(() => useViewport());
      expect(result.current.breakpoint).toBe(expected);
    });
  });
});

describe('useViewportWidth', () => {
  it('should return current viewport width', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    const { result } = renderHook(() => useViewportWidth());
    expect(result.current).toBe(1024);
  });

  it('should update on resize', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true });
    const { result } = renderHook(() => useViewportWidth());
    expect(result.current).toBe(768);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true, configurable: true });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(1920);
  });

  it('should return default width during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR behavior
    delete global.window;

    const { result } = renderHook(() => useViewportWidth());
    expect(result.current).toBe(1024);

    global.window = originalWindow;
  });
});

describe('useViewportHeight', () => {
  it('should return current viewport height', () => {
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true, configurable: true });
    const { result } = renderHook(() => useViewportHeight());
    expect(result.current).toBe(768);
  });

  it('should update on resize', () => {
    Object.defineProperty(window, 'innerHeight', { value: 600, writable: true, configurable: true });
    const { result } = renderHook(() => useViewportHeight());
    expect(result.current).toBe(600);

    act(() => {
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true, configurable: true });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(1080);
  });

  it('should return default height during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR behavior
    delete global.window;

    const { result } = renderHook(() => useViewportHeight());
    expect(result.current).toBe(768);

    global.window = originalWindow;
  });
});
