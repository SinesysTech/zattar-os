import { renderHook } from '@testing-library/react';
import { useIsTouchDevice } from '../use-is-touch-device';

describe('useIsTouchDevice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return false on desktop (no touch support)', () => {
    Object.defineProperty(window, 'ontouchstart', {
      value: undefined,
      writable: true,
      configurable: true
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      writable: true,
      configurable: true
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(false);
  });

  it('should return true when ontouchstart is present (mobile/tablet)', () => {
    Object.defineProperty(window, 'ontouchstart', {
      value: null,
      writable: true,
      configurable: true
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      writable: true,
      configurable: true
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
  });

  it('should return true when maxTouchPoints > 0 (tablet/hybrid)', () => {
    Object.defineProperty(window, 'ontouchstart', {
      value: undefined,
      writable: true,
      configurable: true
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 5,
      writable: true,
      configurable: true
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
  });

  it('should return false during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR behavior
    delete global.window;

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(false);

    global.window = originalWindow;
  });

  it('should detect touch on modern mobile devices', () => {
    Object.defineProperty(window, 'ontouchstart', {
      value: null,
      writable: true,
      configurable: true
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 10,
      writable: true,
      configurable: true
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
  });

  it('should detect touch on tablets with high touch point count', () => {
    Object.defineProperty(window, 'ontouchstart', {
      value: null,
      writable: true,
      configurable: true
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 10,
      writable: true,
      configurable: true
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
  });

  it('should handle edge case: ontouchstart undefined and maxTouchPoints 0', () => {
    Object.defineProperty(window, 'ontouchstart', {
      value: undefined,
      writable: true,
      configurable: true
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 0,
      writable: true,
      configurable: true
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(false);
  });

  it('should detect hybrid devices with both properties set', () => {
    Object.defineProperty(window, 'ontouchstart', {
      value: null,
      writable: true,
      configurable: true
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 2,
      writable: true,
      configurable: true
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
  });
});
