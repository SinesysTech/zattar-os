/**
 * Hook para detecção de viewport atual
 * 
 * Detecta o tamanho do viewport e fornece informações sobre
 * o breakpoint atual, orientação e tipo de dispositivo.
 */

import { useState, useEffect } from 'react';
import type { ViewportState, Breakpoint, Orientation } from '@/types/responsive';

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
 * Determina o breakpoint atual baseado na largura
 */
function getBreakpoint(width: number): Breakpoint {
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
}

/**
 * Determina a orientação baseada nas dimensões
 */
function getOrientation(width: number, height: number): Orientation {
    return width > height ? 'landscape' : 'portrait';
}

/**
 * Cria o estado do viewport baseado nas dimensões
 */
function createViewportState(width: number, height: number): ViewportState {
    const breakpoint = getBreakpoint(width);
    const orientation = getOrientation(width, height);

    return {
        width,
        height,
        isMobile: width < BREAKPOINTS.md,
        isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isDesktop: width >= BREAKPOINTS.lg,
        orientation,
        breakpoint,
    };
}

/**
 * Hook que retorna o estado atual do viewport
 * 
 * @returns Estado do viewport com informações sobre tamanho, breakpoint e orientação
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const viewport = useViewport();
 *   
 *   return (
 *     <div>
 *       {viewport.isMobile ? <MobileView /> : <DesktopView />}
 *       <p>Breakpoint: {viewport.breakpoint}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useViewport(): ViewportState {
    const [viewport, setViewport] = useState<ViewportState>(() => {
        // SSR-safe: retorna valores padrão no servidor
        if (typeof window === 'undefined') {
            return createViewportState(1024, 768);
        }
        return createViewportState(window.innerWidth, window.innerHeight);
    });

    useEffect(() => {
        // Atualiza o viewport no cliente
        const updateViewport = () => {
            setViewport(createViewportState(window.innerWidth, window.innerHeight));
        };

        // Atualiza imediatamente
        updateViewport();

        // Escuta mudanças de tamanho
        window.addEventListener('resize', updateViewport);

        // Escuta mudanças de orientação
        window.addEventListener('orientationchange', updateViewport);

        return () => {
            window.removeEventListener('resize', updateViewport);
            window.removeEventListener('orientationchange', updateViewport);
        };
    }, []);

    return viewport;
}

/**
 * Hook que retorna apenas a largura do viewport
 * Útil quando você só precisa da largura e quer evitar re-renders desnecessários
 */
export function useViewportWidth(): number {
    const [width, setWidth] = useState<number>(() => {
        if (typeof window === 'undefined') return 1024;
        return window.innerWidth;
    });

    useEffect(() => {
        const updateWidth = () => setWidth(window.innerWidth);
        updateWidth();

        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    return width;
}

/**
 * Hook que retorna apenas a altura do viewport
 */
export function useViewportHeight(): number {
    const [height, setHeight] = useState<number>(() => {
        if (typeof window === 'undefined') return 768;
        return window.innerHeight;
    });

    useEffect(() => {
        const updateHeight = () => setHeight(window.innerHeight);
        updateHeight();

        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    return height;
}
