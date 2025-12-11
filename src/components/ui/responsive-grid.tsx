/**
 * ResponsiveGrid
 * 
 * Componente de grid responsivo que adapta o número de colunas
 * baseado no tamanho do viewport.
 * 
 * Sistema de colunas adaptativo:
 * - xs (< 640px): 1 coluna
 * - sm (640px-768px): 2 colunas
 * - md (768px-1024px): 3 colunas
 * - lg (1024px-1280px): 4 colunas
 * - xl (≥ 1280px): 4+ colunas (configurável)
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/use-viewport';
import type { Breakpoint } from '@/types/responsive';

/**
 * Configuração de colunas por breakpoint
 */
export interface ResponsiveGridColumns {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
}

/**
 * Configuração de gap responsivo
 */
export interface ResponsiveGridGap {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
}

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Elementos filhos do grid
     */
    children: React.ReactNode;

    /**
     * Número de colunas por breakpoint
     * Padrão: { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 }
     */
    columns?: ResponsiveGridColumns;

    /**
     * Gap entre itens (em unidades Tailwind)
     * Pode ser um número único ou objeto com valores por breakpoint
     * Padrão: 4
     */
    gap?: number | ResponsiveGridGap;

    /**
     * Se deve escalar imagens proporcionalmente
     * Padrão: true
     */
    scaleImages?: boolean;

    /**
     * Aspect ratio para imagens em cards
     * Padrão: 'auto'
     */
    imageAspectRatio?: 'auto' | 'square' | 'video' | '4/3' | '16/9';

    /**
     * Classes adicionais
     */
    className?: string;

    /**
     * Se deve aplicar animação de entrada nos itens
     */
    animated?: boolean;
}

/**
 * Configuração padrão de colunas
 */
const DEFAULT_COLUMNS: ResponsiveGridColumns = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4,
    '2xl': 4,
};

/**
 * Obtém o número de colunas para o breakpoint atual
 */
function getColumnsForBreakpoint(
    breakpoint: Breakpoint,
    columns: ResponsiveGridColumns
): number {
    // Tenta obter o valor exato do breakpoint
    if (columns[breakpoint] !== undefined) {
        return columns[breakpoint]!;
    }

    // Fallback para breakpoints menores
    const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);

    for (let i = currentIndex - 1; i >= 0; i--) {
        const bp = breakpointOrder[i];
        if (columns[bp] !== undefined) {
            return columns[bp]!;
        }
    }

    // Fallback final
    return DEFAULT_COLUMNS[breakpoint] || 1;
}

/**
 * Converte gap responsivo em classes Tailwind
 */
function getGapClasses(gap: number | ResponsiveGridGap | undefined): string {
    if (gap === undefined) {
        return 'gap-4';
    }

    if (typeof gap === 'number') {
        return `gap-${gap}`;
    }

    const classes: string[] = [];

    if (gap.xs !== undefined) classes.push(`gap-${gap.xs}`);
    if (gap.sm !== undefined) classes.push(`sm:gap-${gap.sm}`);
    if (gap.md !== undefined) classes.push(`md:gap-${gap.md}`);
    if (gap.lg !== undefined) classes.push(`lg:gap-${gap.lg}`);
    if (gap.xl !== undefined) classes.push(`xl:gap-${gap.xl}`);
    if (gap['2xl'] !== undefined) classes.push(`2xl:gap-${gap['2xl']}`);

    return classes.join(' ');
}

/**
 * Obtém classes de colunas do grid
 */
function getGridColumnsClasses(columns: ResponsiveGridColumns): string {
    const classes: string[] = [];

    if (columns.xs !== undefined) {
        classes.push(`grid-cols-${columns.xs}`);
    }
    if (columns.sm !== undefined) {
        classes.push(`sm:grid-cols-${columns.sm}`);
    }
    if (columns.md !== undefined) {
        classes.push(`md:grid-cols-${columns.md}`);
    }
    if (columns.lg !== undefined) {
        classes.push(`lg:grid-cols-${columns.lg}`);
    }
    if (columns.xl !== undefined) {
        classes.push(`xl:grid-cols-${columns.xl}`);
    }
    if (columns['2xl'] !== undefined) {
        classes.push(`2xl:grid-cols-${columns['2xl']}`);
    }

    return classes.join(' ');
}

/**
 * Obtém classes de aspect ratio para imagens
 */
function getImageAspectRatioClass(aspectRatio: string): string {
    switch (aspectRatio) {
        case 'square':
            return 'aspect-square';
        case 'video':
        case '16/9':
            return 'aspect-video';
        case '4/3':
            return 'aspect-[4/3]';
        case 'auto':
        default:
            return 'aspect-auto';
    }
}

/**
 * Grid responsivo que adapta automaticamente o número de colunas
 * baseado no tamanho do viewport.
 * 
 * @example
 * ```tsx
 * // Grid básico com configuração padrão
 * <ResponsiveGrid>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </ResponsiveGrid>
 * 
 * // Grid com configuração customizada
 * <ResponsiveGrid 
 *   columns={{ xs: 1, sm: 2, md: 3, lg: 4, xl: 6 }}
 *   gap={{ xs: 2, md: 4, lg: 6 }}
 *   scaleImages
 *   imageAspectRatio="16/9"
 * >
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 * </ResponsiveGrid>
 * ```
 */
export const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
    (
        {
            children,
            columns = DEFAULT_COLUMNS,
            gap = 4,
            scaleImages = true,
            imageAspectRatio = 'auto',
            className,
            animated = false,
            ...props
        },
        ref
    ) => {
        const viewport = useViewport();

        // Mescla configuração de colunas com padrão
        const mergedColumns = React.useMemo(() => {
            return {
                ...DEFAULT_COLUMNS,
                ...columns,
            };
        }, [columns]);

        // Obtém número de colunas atual
        const currentColumns = React.useMemo(() => {
            return getColumnsForBreakpoint(viewport.breakpoint, mergedColumns);
        }, [viewport.breakpoint, mergedColumns]);

        // Classes do grid
        const gridClasses = cn(
            'grid',
            'w-full',
            getGridColumnsClasses(mergedColumns),
            getGapClasses(gap),
            animated && 'animate-in fade-in duration-300',
            className
        );

        // Processa children para adicionar classes de imagem se necessário
        const processedChildren = React.useMemo(() => {
            if (!scaleImages) return children;

            return React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return child;

                // Fragment não aceita props como className, então pulamos
                if (child.type === React.Fragment) return child;

                // Adiciona classes de imagem aos filhos
                const imageClasses = cn(
                    'responsive-grid-item',
                    scaleImages && [
                        '[&_img]:w-full',
                        '[&_img]:h-auto',
                        '[&_img]:object-cover',
                        imageAspectRatio !== 'auto' && `[&_img]:${getImageAspectRatioClass(imageAspectRatio)}`,
                    ]
                );

                return React.cloneElement(child as React.ReactElement<{ className?: string }>, {
                    // @ts-expect-error - className pode não existir em todos os elementos
                    className: cn(child.props.className, imageClasses),
                });
            });
        }, [children, scaleImages, imageAspectRatio]);

        return (
            <div
                ref={ref}
                className={gridClasses}
                data-columns={currentColumns}
                data-breakpoint={viewport.breakpoint}
                data-viewport-width={viewport.width}
                {...props}
            >
                {processedChildren}
            </div>
        );
    }
);

ResponsiveGrid.displayName = 'ResponsiveGrid';

/**
 * Item do grid com suporte a aspect ratio customizado
 * Útil quando você precisa de controle individual sobre itens
 */
export interface ResponsiveGridItemProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Aspect ratio específico para este item
     */
    aspectRatio?: 'auto' | 'square' | 'video' | '4/3' | '16/9';

    /**
     * Se deve escalar imagens neste item
     */
    scaleImages?: boolean;

    /**
     * Span de colunas (quantas colunas este item deve ocupar)
     */
    colSpan?: number | Partial<Record<Breakpoint, number>>;

    /**
     * Classes adicionais
     */
    className?: string;
}

/**
 * Obtém classes de col-span
 */
function getColSpanClasses(colSpan: number | Partial<Record<Breakpoint, number>> | undefined): string {
    if (colSpan === undefined) return '';

    if (typeof colSpan === 'number') {
        return `col-span-${colSpan}`;
    }

    const classes: string[] = [];

    if (colSpan.xs !== undefined) classes.push(`col-span-${colSpan.xs}`);
    if (colSpan.sm !== undefined) classes.push(`sm:col-span-${colSpan.sm}`);
    if (colSpan.md !== undefined) classes.push(`md:col-span-${colSpan.md}`);
    if (colSpan.lg !== undefined) classes.push(`lg:col-span-${colSpan.lg}`);
    if (colSpan.xl !== undefined) classes.push(`xl:col-span-${colSpan.xl}`);
    if (colSpan['2xl'] !== undefined) classes.push(`2xl:col-span-${colSpan['2xl']}`);

    return classes.join(' ');
}

export const ResponsiveGridItem = React.forwardRef<HTMLDivElement, ResponsiveGridItemProps>(
    (
        {
            aspectRatio = 'auto',
            scaleImages = true,
            colSpan,
            className,
            children,
            ...props
        },
        ref
    ) => {
        const itemClasses = cn(
            'responsive-grid-item',
            getColSpanClasses(colSpan),
            scaleImages && [
                '[&_img]:w-full',
                '[&_img]:h-auto',
                '[&_img]:object-cover',
                aspectRatio !== 'auto' && `[&_img]:${getImageAspectRatioClass(aspectRatio)}`,
            ],
            className
        );

        return (
            <div ref={ref} className={itemClasses} {...props}>
                {children}
            </div>
        );
    }
);

ResponsiveGridItem.displayName = 'ResponsiveGridItem';
