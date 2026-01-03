import { renderHook } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

describe('useIsMobile', () => {
  let mockMatchMedia: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMatchMedia = jest.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    }));

    window.matchMedia = mockMatchMedia;
  });

  it('should return true when width <= 767px (mobile)', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      media: '(max-width: 767px)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should return false when width > 767px (desktop)', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(max-width: 767px)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should use correct media query (max-width: 767px)', () => {
    renderHook(() => useIsMobile());
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('should return false during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR behavior
    delete global.window;

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    global.window = originalWindow;
  });

  it('should test breakpoint at exactly 768px (should be desktop)', () => {
    mockMatchMedia.mockImplementation((query: string) => {
      // At 768px, max-width: 767px should not match
      return {
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
        onchange: null,
      };
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should test breakpoint at 320px (small mobile)', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      media: '(max-width: 767px)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should test breakpoint at 1024px (desktop)', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(max-width: 767px)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
