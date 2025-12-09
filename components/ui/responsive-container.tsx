/**
 * ResponsiveContainer
 * 
 * Componente container que aplica classes responsivas automaticamente
 * e detecta touch devices para otimizações específicas.
 */

'use client';

import { forwardRef, HTMLAttributes, useMemo } from 'react';
import { cn } from '@/app/_lib/utils/utils';
import { useViewport } from '@/hooks/use-viewport';

/**
 * Configuração de spacing responsivo
 */
export interface ResponsiveSpacing {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
}

export interface ResponsiveContainerProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Padding responsivo
     * Pode ser um valor único ou objeto com valores por breakpoint
     */
    padding?: string | ResponsiveSpacing;

    /**
     * Margin responsivo
     * Pode ser um valor único ou objeto com valores por breakpoint
     */
    margin?: string | ResponsiveSpacing;

    /**
     * Gap responsivo (para flex/grid containers)
     * Pode ser um valor único ou objeto com valores por breakpoint
     */
    gap?: string | ResponsiveSpacing;

    /**
     * Se deve aplicar classes específicas para touch devices
     */
    touchOptimized?: boolean;

    /**
     * Se deve aplicar max-width responsivo
     */
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';

    /**
     * Se deve centralizar o container
     */
    centered?: boolean;

    /**
     * Classes adicionais
     */
    className?: string;
}

/**
 * Converte spacing responsivo em classes Tailwind
 */
function getResponsiveClasses(
    property: 'p' | 'm' | 'gap',
    spacing: string | ResponsiveSpacing | undefined
): string {
    if (!spacing) return '';

    if (typeof spacing === 'string') {
        return `${property}-${spacing}`;
    }

    const classes: string[] = [];

    if (spacing.xs) classes.push(`${property}-${spacing.xs}`);
    if (spacing.sm) classes.push(`sm:${property}-${spacing.sm}`);
    if (spacing.md) classes.push(`md:${property}-${spacing.md}`);
    if (spacing.lg) classes.push(`lg:${property}-${spacing.lg}`);
    if (spacing.xl) classes.push(`xl:${property}-${spacing.xl}`);
    if (spacing['2xl']) classes.push(`2xl:${property}-${spacing['2xl']}`);

    return classes.join(' ');
}

/**
 * Detecta se é um touch device
 */
function isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;

    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints é específico do IE
        navigator.msMaxTouchPoints > 0
    );
}

/**
 * Container responsivo que aplica classes automaticamente baseado no viewport
 * 
 * @example
 * ```tsx
 * // Padding responsivo simples
 * <ResponsiveContainer padding="4">
 *   Content
 * </ResponsiveContainer>
 * 
 * // Padding diferente por breakpoint
 * <ResponsiveContainer 
 *   padding={{ xs: '2', md: '4', lg: '6' }}
 *   maxWidth="lg"
 *   centered
 * >
 *   Content
 * </ResponsiveContainer>
 * 
 * // Touch optimized
 * <ResponsiveContainer touchOptimized>
 *   <button>Touch-friendly button</button>
 * </ResponsiveContainer>
 * ```
 */
export const ResponsiveContainer = forwardRef<HTMLDivElement, ResponsiveContainerProps>(
    (
        {
            padding,
            margin,
            gap,
            touchOptimized = false,
            maxWidth,
            centered = false,
            className,
            children,
            ...props
        },
        ref
    ) => {
        const viewport = useViewport();

        const isTouch = useMemo(() => {
            return touchOptimized && isTouchDevice();
        }, [touchOptimized]);

        const containerClasses = cn(
            // Classes base
            'responsive-container',

            // Spacing responsivo
            getResponsiveClasses('p', padding),
            getResponsiveClasses('m', margin),
            getResponsiveClasses('gap', gap),

            // Max width
            maxWidth && maxWidth !== 'none' && `max-w-${maxWidth}`,
            maxWidth === 'full' && 'max-w-full',

            // Centralização
            centered && 'mx-auto',

            // Touch optimizations
            isTouch && [
                'touch-manipulation', // Melhora performance de touch
                'select-none', // Previne seleção acidental
            ],

            // Breakpoint específico (data attribute para testes)
            `data-breakpoint-${viewport.breakpoint}`,

            // Classes customizadas
            className
        );

        return (
            <div
                ref={ref}
                className={containerClasses}
                data-viewport-width={viewport.width}
                data-viewport-height={viewport.height}
                data-is-mobile={viewport.isMobile}
                data-is-tablet={viewport.isTablet}
                data-is-desktop={viewport.isDesktop}
                data-orientation={viewport.orientation}
                data-touch-device={isTouch}
                {...props}
            >
                {children}
            </div>
        );
    }
);

ResponsiveContainer.displayName = 'ResponsiveContainer';
