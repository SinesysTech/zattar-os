/**
 * Hook para verificação de breakpoints específicos
 * 
 * Permite verificar se o viewport atual corresponde a um breakpoint específico
 * ou está acima/abaixo de um determinado breakpoint.
 */

import { useState, useEffect } from 'react';
import type { Breakpoint } from '@/types/responsive';

/**
 * Breakpoints do Tailwind CSS
 */
const BREAKPOINTS = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

/**
 * Verifica se o viewport está em um breakpoint específico ou acima
 */
function isBreakpointOrAbove(width: number, breakpoint: Breakpoint): boolean {
    return width >= BREAKPOINTS[breakpoint];
}

/**
 * Verifica se o viewport está abaixo de um breakpoint
 */
function isBreakpointBelow(width: number, breakpoint: Breakpoint): boolean {
    return width < BREAKPOINTS[breakpoint];
}

/**
 * Hook que verifica se o viewport está em um breakpoint específico ou acima
 * 
 * @param breakpoint - Breakpoint a verificar
 * @returns true se o viewport está no breakpoint ou acima
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isDesktop = useBreakpoint('lg');
 *   
 *   return (
 *     <div>
 *       {isDesktop ? 'Desktop View' : 'Mobile/Tablet View'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
    const [matches, setMatches] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return isBreakpointOrAbove(window.innerWidth, breakpoint);
    });

    useEffect(() => {
        const updateMatches = () => {
            setMatches(isBreakpointOrAbove(window.innerWidth, breakpoint));
        };

        updateMatches();

        window.addEventListener('resize', updateMatches);
        return () => window.removeEventListener('resize', updateMatches);
    }, [breakpoint]);

    return matches;
}

/**
 * Hook que verifica se o viewport está abaixo de um breakpoint
 * 
 * @param breakpoint - Breakpoint a verificar
 * @returns true se o viewport está abaixo do breakpoint
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isBelowTablet = useBreakpointBelow('md');
 *   
 *   return (
 *     <div>
 *       {isBelowTablet ? 'Mobile View' : 'Tablet/Desktop View'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBreakpointBelow(breakpoint: Breakpoint): boolean {
    const [matches, setMatches] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return isBreakpointBelow(window.innerWidth, breakpoint);
    });

    useEffect(() => {
        const updateMatches = () => {
            setMatches(isBreakpointBelow(window.innerWidth, breakpoint));
        };

        updateMatches();

        window.addEventListener('resize', updateMatches);
        return () => window.removeEventListener('resize', updateMatches);
    }, [breakpoint]);

    return matches;
}

/**
 * Hook que verifica se o viewport está entre dois breakpoints
 * 
 * @param min - Breakpoint mínimo (inclusive)
 * @param max - Breakpoint máximo (exclusive)
 * @returns true se o viewport está entre os breakpoints
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isTablet = useBreakpointBetween('md', 'lg');
 *   
 *   return (
 *     <div>
 *       {isTablet ? 'Tablet View' : 'Mobile or Desktop View'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBreakpointBetween(min: Breakpoint, max: Breakpoint): boolean {
    const [matches, setMatches] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        const width = window.innerWidth;
        return width >= BREAKPOINTS[min] && width < BREAKPOINTS[max];
    });

    useEffect(() => {
        const updateMatches = () => {
            const width = window.innerWidth;
            setMatches(width >= BREAKPOINTS[min] && width < BREAKPOINTS[max]);
        };

        updateMatches();

        window.addEventListener('resize', updateMatches);
        return () => window.removeEventListener('resize', updateMatches);
    }, [min, max]);

    return matches;
}

/**
 * Hook que retorna um objeto com verificações de breakpoints comuns
 * 
 * @returns Objeto com verificações de breakpoints
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, isTablet, isDesktop } = useBreakpoints();
 *   
 *   return (
 *     <div>
 *       {isMobile && <MobileView />}
 *       {isTablet && <TabletView />}
 *       {isDesktop && <DesktopView />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBreakpoints() {
    const isMobile = useBreakpointBelow('md');
    const isTablet = useBreakpointBetween('md', 'lg');
    const isDesktop = useBreakpoint('lg');
    const isSmallMobile = useBreakpointBelow('sm');
    const isLargeDesktop = useBreakpoint('xl');

    return {
        isMobile,
        isTablet,
        isDesktop,
        isSmallMobile,
        isLargeDesktop,
    };
}
