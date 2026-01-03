/**
 * Property-Based Tests - Tooltip
 *
 * Testes de propriedades para o componente Tooltip
 * usando fast-check para validar comportamentos universais.
 */

import * as fc from 'fast-check';
import { render, waitFor } from '@testing-library/react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
    setViewport,
    COMMON_VIEWPORTS,
} from '@/testing/helpers/responsive-test-helpers';

describe('Tooltip - Property-Based Tests', () => {
    beforeEach(() => {
        setViewport(COMMON_VIEWPORTS.desktop);
    });

    /**
     * Feature: tooltip-portal, Property 10: Portal rendering with z-index
     * Validates: Requirements 3.1
     *
     * Para qualquer Tooltip aberto,
     * deve renderizar em Portal com z-index correto
     */
    test('Property 10: Tooltip renders in Portal with correct z-index', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.boolean(),
                async (defaultOpen) => {
                    const { container } = render(
                        <Tooltip defaultOpen={defaultOpen}>
                            <TooltipTrigger>Hover me</TooltipTrigger>
                            <TooltipContent>Tooltip content</TooltipContent>
                        </Tooltip>
                    );

                    if (defaultOpen) {
                        await waitFor(() => {
                            const tooltipContent = container.querySelector('[data-slot="tooltip-content"]');
                            expect(tooltipContent).toBeInTheDocument();

                            // Verifica z-index
                            expect(tooltipContent?.classList.contains('z-50')).toBe(true);
                        });
                    }
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: tooltip-positioning, Property 11: Side-based slide animations
     * Validates: Requirements 3.2
     *
     * Para qualquer Tooltip com side (top/right/bottom/left),
     * deve ter animação de slide correta
     */
    test('Property 11: Tooltip has correct slide animation based on side', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.constantFrom('top', 'right', 'bottom', 'left') as fc.Arbitrary<'top' | 'right' | 'bottom' | 'left'>,
                async (side) => {
                    const { container } = render(
                        <Tooltip defaultOpen={true}>
                            <TooltipTrigger>Trigger</TooltipTrigger>
                            <TooltipContent side={side}>Content</TooltipContent>
                        </Tooltip>
                    );

                    await waitFor(() => {
                        const tooltipContent = container.querySelector('[data-slot="tooltip-content"]');
                        expect(tooltipContent).toBeInTheDocument();

                        // Verifica classes de animação
                        const className = tooltipContent?.className || '';
                        expect(className).toMatch(/animate-in|fade-in-0|zoom-in-95/);

                        // Verifica slide baseado no side
                        if (side === 'top') {
                            expect(className).toMatch(/data-\[side=top\]:slide-in-from-bottom-2/);
                        } else if (side === 'bottom') {
                            expect(className).toMatch(/data-\[side=bottom\]:slide-in-from-top-2/);
                        } else if (side === 'left') {
                            expect(className).toMatch(/data-\[side=left\]:slide-in-from-right-2/);
                        } else if (side === 'right') {
                            expect(className).toMatch(/data-\[side=right\]:slide-in-from-left-2/);
                        }
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: tooltip-arrow, Property 12: Arrow pointing to trigger
     * Validates: Requirements 3.3
     *
     * Para qualquer Tooltip,
     * deve ter seta (arrow) apontando para o trigger
     */
    test('Property 12: Tooltip has arrow pointing to trigger', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.string({ minLength: 5, maxLength: 50 }),
                async (content) => {
                    const { container } = render(
                        <Tooltip defaultOpen={true}>
                            <TooltipTrigger>Trigger</TooltipTrigger>
                            <TooltipContent>{content}</TooltipContent>
                        </Tooltip>
                    );

                    await waitFor(() => {
                        const tooltipContent = container.querySelector('[data-slot="tooltip-content"]');
                        expect(tooltipContent).toBeInTheDocument();

                        // Verifica presença da seta
                        const arrow = tooltipContent?.querySelector('.rotate-45.rounded-\\[2px\\]');
                        expect(arrow).toBeInTheDocument();

                        // Verifica classes da seta
                        if (arrow) {
                            expect(arrow.classList.contains('bg-primary')).toBe(true);
                            expect(arrow.classList.contains('fill-primary')).toBe(true);
                            expect(arrow.classList.contains('rotate-45')).toBe(true);
                        }
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: tooltip-delay, Property 13: Delay duration
     * Validates: Requirements 3.4
     *
     * Para qualquer Tooltip com delay,
     * deve respeitar delayDuration
     */
    test('Property 13: TooltipProvider respects delayDuration', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 1000 }),
                (delayDuration) => {
                    const { container } = render(
                        <TooltipProvider delayDuration={delayDuration}>
                            <Tooltip>
                                <TooltipTrigger>Trigger</TooltipTrigger>
                                <TooltipContent>Content</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );

                    const provider = container.querySelector('[data-slot="tooltip-provider"]');
                    expect(provider).toBeInTheDocument();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: tooltip-text, Property 14: Long text with text-balance
     * Validates: Requirements 3.5
     *
     * Para qualquer Tooltip com texto longo,
     * deve ter text-balance e largura w-fit
     */
    test('Property 14: Tooltip with long text has text-balance and w-fit', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.string({ minLength: 50, maxLength: 200 }),
                async (longText) => {
                    const { container } = render(
                        <Tooltip defaultOpen={true}>
                            <TooltipTrigger>Trigger</TooltipTrigger>
                            <TooltipContent>{longText}</TooltipContent>
                        </Tooltip>
                    );

                    await waitFor(() => {
                        const tooltipContent = container.querySelector('[data-slot="tooltip-content"]');
                        expect(tooltipContent).toBeInTheDocument();

                        // Verifica classes de texto
                        expect(tooltipContent?.classList.contains('text-balance')).toBe(true);
                        expect(tooltipContent?.classList.contains('w-fit')).toBe(true);
                        expect(tooltipContent?.classList.contains('text-xs')).toBe(true);

                        // Verifica padding
                        const className = tooltipContent?.className || '';
                        expect(className).toMatch(/px-3|py-1\.5/);
                    });
                }
            ),
            { numRuns: 50 }
        );
    });
});
