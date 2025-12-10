'use client';

import * as React from 'react';
import type { VariantProps } from 'class-variance-authority';
import type { PlateContentProps } from 'platejs/react';
import { cva } from 'class-variance-authority';
import { PlateContainer, PlateContent } from 'platejs/react';
import { cn } from '@/app/_lib/utils/utils';
import { useBreakpoint } from '@/hooks/use-breakpoint';

const responsiveEditorContainerVariants = cva(
    'relative w-full max-w-full cursor-text select-text overflow-y-auto overflow-x-hidden caret-primary selection:bg-brand/25 focus-visible:outline-none [&_.slate-selection-area]:z-50 [&_.slate-selection-area]:border [&_.slate-selection-area]:border-brand/25 [&_.slate-selection-area]:bg-brand/15',
    {
        defaultVariants: {
            variant: 'default',
        },
        variants: {
            variant: {
                default: 'h-full',
                demo: 'h-auto min-h-[400px] md:h-[650px]',
            },
        },
    }
);

/**
 * Container responsivo para o editor
 * Ajusta altura e padding baseado no viewport
 */
export function ResponsiveEditorContainer({
    className,
    variant,
    ...props
}: React.ComponentProps<'div'> & VariantProps<typeof responsiveEditorContainerVariants>) {
    const isMobile = !useBreakpoint('md');

    return (
        <PlateContainer
            className={cn(
                'ignore-click-outside/toolbar',
                responsiveEditorContainerVariants({ variant }),
                // Mobile: altura adequada considerando teclado virtual
                isMobile && 'min-h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]',
                className
            )}
            {...props}
        />
    );
}

const responsiveEditorVariants = cva(
    cn(
        'group/editor',
        'relative w-full max-w-full cursor-text select-text overflow-x-hidden whitespace-pre-wrap break-words',
        'rounded-md ring-offset-background focus-visible:outline-none',
        '**:data-slate-placeholder:!top-1/2 **:data-slate-placeholder:-translate-y-1/2 placeholder:text-muted-foreground/80 **:data-slate-placeholder:text-muted-foreground/80 **:data-slate-placeholder:opacity-100!',
        '[&_strong]:font-bold',
        // Responsividade para tabelas
        '[&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:block',
        // Responsividade para imagens
        '[&_img]:max-w-full [&_img]:h-auto',
        // Responsividade para code blocks
        '[&_pre]:max-w-full [&_pre]:overflow-x-auto',
        '[&_code]:break-words',
        // Scroll suave
        'scroll-smooth'
    ),
    {
        defaultVariants: {
            variant: 'default',
        },
        variants: {
            disabled: {
                true: 'cursor-not-allowed opacity-50',
            },
            focused: {
                true: 'ring-2 ring-ring ring-offset-2',
            },
            variant: {
                default:
                    'size-full max-w-full text-base',
                demo: 'size-full max-w-full text-base',
            },
        },
    }
);

export type ResponsiveEditorProps = PlateContentProps &
    VariantProps<typeof responsiveEditorVariants>;

/**
 * Editor responsivo com otimizações para mobile
 * 
 * - Mobile (< 768px): Padding reduzido, altura otimizada para teclado virtual
 * - Tablet (768px-1024px): Padding médio
 * - Desktop (>= 1024px): Padding completo
 */
export const ResponsiveEditor = ({
    className,
    disabled,
    focused,
    variant,
    ref,
    ...props
}: ResponsiveEditorProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
    // Call all hooks unconditionally to follow Rules of Hooks
    const isMdOrAbove = useBreakpoint('md');
    const isLgOrAbove = useBreakpoint('lg');

    // Derive states from hook results
    const isMobile = !isMdOrAbove;
    const isTablet = isMdOrAbove && !isLgOrAbove;
    const isDesktop = isLgOrAbove;

    return (
        <PlateContent
            ref={ref}
            className={cn(
                responsiveEditorVariants({
                    disabled,
                    focused,
                    variant,
                }),
                // Padding responsivo
                isMobile && 'px-3 pt-3 pb-32',
                isTablet && 'px-6 pt-4 pb-48',
                isDesktop && 'px-8 pt-4 pb-72 sm:px-12 lg:px-16',
                className
            )}
            disabled={disabled}
            disableDefaultStyles
            {...props}
        />
    );
};

ResponsiveEditor.displayName = 'ResponsiveEditor';
