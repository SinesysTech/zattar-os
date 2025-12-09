/**
 * Utilities for preserving scroll position during orientation changes
 */

interface ScrollPosition {
    x: number;
    y: number;
    timestamp: number;
}

const SCROLL_STORAGE_KEY = 'scroll-position';
const SCROLL_EXPIRY_MS = 5000; // 5 seconds

/**
 * Save current scroll position to sessionStorage
 */
export function saveScrollPosition(key: string = 'default'): void {
    if (typeof window === 'undefined') return;

    const position: ScrollPosition = {
        x: window.scrollX,
        y: window.scrollY,
        timestamp: Date.now(),
    };

    try {
        const stored = sessionStorage.getItem(SCROLL_STORAGE_KEY);
        const positions = stored ? JSON.parse(stored) : {};
        positions[key] = position;
        sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
    } catch (error) {
        console.warn('Failed to save scroll position:', error);
    }
}

/**
 * Restore scroll position from sessionStorage
 */
export function restoreScrollPosition(key: string = 'default'): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const stored = sessionStorage.getItem(SCROLL_STORAGE_KEY);
        if (!stored) return false;

        const positions = JSON.parse(stored);
        const position: ScrollPosition | undefined = positions[key];

        if (!position) return false;

        // Check if position is not expired
        if (Date.now() - position.timestamp > SCROLL_EXPIRY_MS) {
            return false;
        }

        window.scrollTo(position.x, position.y);
        return true;
    } catch (error) {
        console.warn('Failed to restore scroll position:', error);
        return false;
    }
}

/**
 * Clear stored scroll position
 */
export function clearScrollPosition(key?: string): void {
    if (typeof window === 'undefined') return;

    try {
        if (key) {
            const stored = sessionStorage.getItem(SCROLL_STORAGE_KEY);
            if (stored) {
                const positions = JSON.parse(stored);
                delete positions[key];
                sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
            }
        } else {
            sessionStorage.removeItem(SCROLL_STORAGE_KEY);
        }
    } catch (error) {
        console.warn('Failed to clear scroll position:', error);
    }
}

/**
 * Hook to automatically preserve scroll position on orientation change
 */
export function useScrollPreservation(key: string = 'default') {
    if (typeof window === 'undefined') return;

    const handleOrientationChange = () => {
        saveScrollPosition(key);
        // Restore after a short delay to allow layout reflow
        setTimeout(() => {
            restoreScrollPosition(key);
        }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
        window.removeEventListener('orientationchange', handleOrientationChange);
        window.removeEventListener('resize', handleOrientationChange);
    };
}
