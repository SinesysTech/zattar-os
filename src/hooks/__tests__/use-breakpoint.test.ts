import { renderHook, act } from '@testing-library/react';
import {
  useBreakpoint,
  useBreakpointBelow,
  useBreakpointBetween,
  useBreakpoints,
  useIsMobile,
} from '../use-breakpoint';

describe('useBreakpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when width >= breakpoint (lg = 1024)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpoint('lg'));
    expect(result.current).toBe(true);
  });

  it('should return false when width < breakpoint (lg = 1024)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpoint('lg'));
    expect(result.current).toBe(false);
  });

  it('should return false during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR behavior
    delete global.window;

    const { result } = renderHook(() => useBreakpoint('lg'));
    expect(result.current).toBe(false);

    global.window = originalWindow;
  });

  it('should update on resize event', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpoint('lg'));
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(true);
  });

  it('should test all breakpoint values', () => {
    const breakpoints = [
      { name: 'xs' as const, minWidth: 0, testWidth: 320, expected: true },
      { name: 'sm' as const, minWidth: 640, testWidth: 640, expected: true },
      { name: 'md' as const, minWidth: 768, testWidth: 768, expected: true },
      { name: 'lg' as const, minWidth: 1024, testWidth: 1024, expected: true },
      { name: 'xl' as const, minWidth: 1280, testWidth: 1280, expected: true },
      { name: '2xl' as const, minWidth: 1536, testWidth: 1536, expected: true },
    ];

    breakpoints.forEach(({ name, testWidth, expected }) => {
      Object.defineProperty(window, 'innerWidth', { value: testWidth, writable: true, configurable: true });
      const { result } = renderHook(() => useBreakpoint(name));
      expect(result.current).toBe(expected);
    });
  });
});

describe('useBreakpointBelow', () => {
  it('should return true when width < breakpoint (md = 768)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 640, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpointBelow('md'));
    expect(result.current).toBe(true);
  });

  it('should return false when width >= breakpoint (md = 768)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpointBelow('md'));
    expect(result.current).toBe(false);
  });

  it('should return false during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR behavior
    delete global.window;

    const { result } = renderHook(() => useBreakpointBelow('md'));
    expect(result.current).toBe(false);

    global.window = originalWindow;
  });

  it('should test breakpoint transitions (320 -> sm)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 320, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpointBelow('sm'));
    expect(result.current).toBe(true);
  });
});

describe('useBreakpointBetween', () => {
  it('should return true when width is between md (768) and lg (1024)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 900, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpointBetween('md', 'lg'));
    expect(result.current).toBe(true);
  });

  it('should return false when width < min breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { value: 640, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpointBetween('md', 'lg'));
    expect(result.current).toBe(false);
  });

  it('should return false when width >= max breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpointBetween('md', 'lg'));
    expect(result.current).toBe(false);
  });

  it('should return false during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR behavior
    delete global.window;

    const { result } = renderHook(() => useBreakpointBetween('md', 'lg'));
    expect(result.current).toBe(false);

    global.window = originalWindow;
  });

  it('should test edge cases (exactly at min)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpointBetween('md', 'lg'));
    expect(result.current).toBe(true);
  });
});

describe('useBreakpoints', () => {
  it('should return all breakpoint flags for desktop (1024)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpoints());

    expect(result.current).toEqual({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isSmallMobile: false,
      isLargeDesktop: false,
    });
  });

  it('should return all breakpoint flags for mobile (375)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpoints());

    expect(result.current).toEqual({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isSmallMobile: true,
      isLargeDesktop: false,
    });
  });

  it('should return all breakpoint flags for tablet (768)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpoints());

    expect(result.current).toEqual({
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      isSmallMobile: false,
      isLargeDesktop: false,
    });
  });

  it('should return all breakpoint flags for large desktop (1920)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpoints());

    expect(result.current).toEqual({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isSmallMobile: false,
      isLargeDesktop: true,
    });
  });

  it('should update on resize from mobile to large desktop', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
    const { result } = renderHook(() => useBreakpoints());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isLargeDesktop).toBe(false);

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true, configurable: true });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isLargeDesktop).toBe(true);
  });

  it('should return default values during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR behavior
    delete global.window;

    const { result } = renderHook(() => useBreakpoints());

    expect(result.current).toEqual({
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      isSmallMobile: false,
      isLargeDesktop: false,
    });

    global.window = originalWindow;
  });
});

describe('useIsMobile', () => {
  it('should return true when width < 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 640, writable: true, configurable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should return false when width >= 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true, configurable: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should be alias for useBreakpointBelow("md")', () => {
    Object.defineProperty(window, 'innerWidth', { value: 640, writable: true, configurable: true });
    const { result: isMobileResult } = renderHook(() => useIsMobile());
    const { result: belowMdResult } = renderHook(() => useBreakpointBelow('md'));
    expect(isMobileResult.current).toBe(belowMdResult.current);
  });

  it('should return false during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR behavior
    delete global.window;

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    global.window = originalWindow;
  });
});
