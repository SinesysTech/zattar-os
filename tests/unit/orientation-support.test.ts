/**
 * Tests for orientation detection and adaptation
 * 
 * Validates Requirements 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { renderHook, act } from '@testing-library/react';
import {
    useOrientation,
    useIsPortrait,
    useIsLandscape,
    useOrientationChange,
    useOrientationInfo,
} from '@/hooks/use-orientation';
import {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
} from '@/lib/utils/scroll-preservation';

describe('Orientation Detection', () => {
    beforeEach(() => {
        // Reset window dimensions
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1024,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 768,
        });
    });

    describe('useOrientation hook', () => {
        it('should detect landscape orientation when width > height', () => {
            Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

            const { result } = renderHook(() => useOrientation());
            expect(result.current).toBe('landscape');
        });

        it('should detect portrait orientation when height > width', () => {
            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

            const { result } = renderHook(() => useOrientation());
            expect(result.current).toBe('portrait');
        });

        it('should update orientation on window resize', () => {
            const { result } = renderHook(() => useOrientation());

            // Start in landscape
            Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

            act(() => {
                window.dispatchEvent(new Event('resize'));
            });

            expect(result.current).toBe('landscape');

            // Change to portrait
            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

            act(() => {
                window.dispatchEvent(new Event('resize'));
            });

            expect(result.current).toBe('portrait');
        });

        it('should update orientation on orientationchange event', () => {
            const { result } = renderHook(() => useOrientation());

            Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });

            act(() => {
                window.dispatchEvent(new Event('orientationchange'));
            });

            expect(result.current).toBe('landscape');
        });
    });

    describe('useIsPortrait hook', () => {
        it('should return true when in portrait mode', () => {
            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

            const { result } = renderHook(() => useIsPortrait());
            expect(result.current).toBe(true);
        });

        it('should return false when in landscape mode', () => {
            Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });

            const { result } = renderHook(() => useIsPortrait());
            expect(result.current).toBe(false);
        });
    });

    describe('useIsLandscape hook', () => {
        it('should return true when in landscape mode', () => {
            Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });

            const { result } = renderHook(() => useIsLandscape());
            expect(result.current).toBe(true);
        });

        it('should return false when in portrait mode', () => {
            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

            const { result } = renderHook(() => useIsLandscape());
            expect(result.current).toBe(false);
        });
    });

    describe('useOrientationChange hook', () => {
        it('should call callback when orientation changes', () => {
            const callback = jest.fn();

            Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

            renderHook(() => useOrientationChange(callback));

            // Initial call
            expect(callback).toHaveBeenCalledWith('portrait');

            // Change orientation
            Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });

            act(() => {
                window.dispatchEvent(new Event('resize'));
            });

            expect(callback).toHaveBeenCalledWith('landscape');
        });
    });

    describe('useOrientationInfo hook', () => {
        it('should return complete orientation information', () => {
            Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });

            const { result } = renderHook(() => useOrientationInfo());

            expect(result.current.orientation).toBe('landscape');
            expect(result.current.isLandscape).toBe(true);
            expect(result.current.isPortrait).toBe(false);
            expect(result.current.aspectRatio).toBeCloseTo(1024 / 768, 2);
        });

        it('should update aspect ratio on resize', () => {
            const { result } = renderHook(() => useOrientationInfo());

            Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
            Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });

            act(() => {
                window.dispatchEvent(new Event('resize'));
            });

            expect(result.current.aspectRatio).toBeCloseTo(1920 / 1080, 2);
        });
    });
});

describe('Scroll Position Preservation', () => {
    beforeEach(() => {
        // Clear sessionStorage before each test
        sessionStorage.clear();

        // Mock window.scrollTo
        window.scrollTo = jest.fn();

        // Mock window scroll position
        Object.defineProperty(window, 'scrollX', {
            writable: true,
            configurable: true,
            value: 0,
        });
        Object.defineProperty(window, 'scrollY', {
            writable: true,
            configurable: true,
            value: 0,
        });
    });

    describe('saveScrollPosition', () => {
        it('should save current scroll position to sessionStorage', () => {
            Object.defineProperty(window, 'scrollX', { value: 100, writable: true });
            Object.defineProperty(window, 'scrollY', { value: 200, writable: true });

            saveScrollPosition('test-key');

            const stored = sessionStorage.getItem('scroll-position');
            expect(stored).toBeTruthy();

            const positions = JSON.parse(stored!);
            expect(positions['test-key']).toBeDefined();
            expect(positions['test-key'].x).toBe(100);
            expect(positions['test-key'].y).toBe(200);
        });

        it('should use default key when no key provided', () => {
            Object.defineProperty(window, 'scrollX', { value: 50, writable: true });
            Object.defineProperty(window, 'scrollY', { value: 150, writable: true });

            saveScrollPosition();

            const stored = sessionStorage.getItem('scroll-position');
            const positions = JSON.parse(stored!);
            expect(positions['default']).toBeDefined();
        });
    });

    describe('restoreScrollPosition', () => {
        it('should restore scroll position from sessionStorage', () => {
            // Save position first
            Object.defineProperty(window, 'scrollX', { value: 100, writable: true });
            Object.defineProperty(window, 'scrollY', { value: 200, writable: true });
            saveScrollPosition('test-key');

            // Restore position
            const restored = restoreScrollPosition('test-key');

            expect(restored).toBe(true);
            expect(window.scrollTo).toHaveBeenCalledWith(100, 200);
        });

        it('should return false when no position stored', () => {
            const restored = restoreScrollPosition('non-existent');
            expect(restored).toBe(false);
        });

        it('should return false for expired positions', () => {
            // Manually create an expired position
            const expiredPosition = {
                'test-key': {
                    x: 100,
                    y: 200,
                    timestamp: Date.now() - 10000, // 10 seconds ago (expired)
                },
            };
            sessionStorage.setItem('scroll-position', JSON.stringify(expiredPosition));

            const restored = restoreScrollPosition('test-key');
            expect(restored).toBe(false);
        });
    });

    describe('clearScrollPosition', () => {
        it('should clear specific scroll position', () => {
            saveScrollPosition('key1');
            saveScrollPosition('key2');

            clearScrollPosition('key1');

            const stored = sessionStorage.getItem('scroll-position');
            const positions = JSON.parse(stored!);
            expect(positions['key1']).toBeUndefined();
            expect(positions['key2']).toBeDefined();
        });

        it('should clear all positions when no key provided', () => {
            saveScrollPosition('key1');
            saveScrollPosition('key2');

            clearScrollPosition();

            const stored = sessionStorage.getItem('scroll-position');
            expect(stored).toBeNull();
        });
    });
});

describe('Orientation Adaptation Scenarios', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 667,
        });
    });

    it('should handle portrait to landscape transition', () => {
        const { result } = renderHook(() => useOrientation());

        // Start in portrait
        expect(result.current).toBe('portrait');

        // Rotate to landscape
        Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });

        act(() => {
            window.dispatchEvent(new Event('orientationchange'));
        });

        expect(result.current).toBe('landscape');
    });

    it('should handle landscape to portrait transition', () => {
        // Start in landscape
        Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });

        const { result } = renderHook(() => useOrientation());
        expect(result.current).toBe('landscape');

        // Rotate to portrait
        Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });

        act(() => {
            window.dispatchEvent(new Event('orientationchange'));
        });

        expect(result.current).toBe('portrait');
    });

    it('should preserve state during orientation change', () => {
        const callback = jest.fn();
        const { result } = renderHook(() => {
            const orientation = useOrientation();
            useOrientationChange(callback);
            return orientation;
        });

        // Initial state
        expect(result.current).toBe('portrait');
        expect(callback).toHaveBeenCalledTimes(1);

        // Change orientation
        Object.defineProperty(window, 'innerWidth', { value: 667, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 375, writable: true });

        act(() => {
            window.dispatchEvent(new Event('orientationchange'));
        });

        // State should be updated
        expect(result.current).toBe('landscape');
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenLastCalledWith('landscape');
    });
});
