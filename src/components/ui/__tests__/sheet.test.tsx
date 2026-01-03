/**
 * Property-Based Tests - Sheet
 *
 * Testes de propriedades para o componente Sheet
 * usando fast-check para validar comportamentos universais.
 */

import * as fc from 'fast-check';
import { render, waitFor } from '@testing-library/react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import {
    setViewport,
    COMMON_VIEWPORTS,
} from '@/testing/helpers/responsive-test-helpers';

describe('Sheet - Property-Based Tests', () => {
    beforeEach(() => {
        setViewport(COMMON_VIEWPORTS.desktop);
    });

    /**
     * Feature: sheet-sides, Property 25: Side-based slide animations
     * Validates: Requirements 6.1
     *
     * Para qualquer Sheet com side (top/right/bottom/left),
     * deve ter animação de slide correta
     */
    test('Property 25: Sheet has correct slide animation based on side', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.constantFrom('top', 'right', 'bottom', 'left') as fc.Arbitrary<'top' | 'right' | 'bottom' | 'left'>,
                async (side) => {
                    const { container } = render(
                        <Sheet defaultOpen={true}>
                            <SheetTrigger>Open</SheetTrigger>
                            <SheetContent side={side}>
                                <SheetHeader>
                                    <SheetTitle>Sheet Title</SheetTitle>
                                </SheetHeader>
                            </SheetContent>
                        </Sheet>
                    );

                    await waitFor(() => {
                        const content = container.querySelector('[data-slot="sheet-content"]');
                        expect(content).toBeInTheDocument();

                        const className = content?.className || '';

                        // Verifica animações de slide baseadas no side
                        if (side === 'top') {
                            expect(className).toMatch(/data-\[state=closed\]:slide-out-to-top/);
                            expect(className).toMatch(/data-\[state=open\]:slide-in-from-top/);
                        } else if (side === 'right') {
                            expect(className).toMatch(/data-\[state=closed\]:slide-out-to-right/);
                            expect(className).toMatch(/data-\[state=open\]:slide-in-from-right/);
                        } else if (side === 'bottom') {
                            expect(className).toMatch(/data-\[state=closed\]:slide-out-to-bottom/);
                            expect(className).toMatch(/data-\[state=open\]:slide-in-from-bottom/);
                        } else if (side === 'left') {
                            expect(className).toMatch(/data-\[state=closed\]:slide-out-to-left/);
                            expect(className).toMatch(/data-\[state=open\]:slide-in-from-left/);
                        }
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: sheet-width, Property 26: Right side width and border
     * Validates: Requirements 6.2
     *
     * Para qualquer Sheet com side=right,
     * deve ter largura w-3/4 sm:max-w-sm
     */
    test('Property 26: Sheet with side=right has correct width and border', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.string({ minLength: 5, maxLength: 50 }),
                async (title) => {
                    const { container } = render(
                        <Sheet defaultOpen={true}>
                            <SheetTrigger>Open</SheetTrigger>
                            <SheetContent side="right">
                                <SheetHeader>
                                    <SheetTitle>{title}</SheetTitle>
                                </SheetHeader>
                            </SheetContent>
                        </Sheet>
                    );

                    await waitFor(() => {
                        const content = container.querySelector('[data-slot="sheet-content"]');
                        expect(content).toBeInTheDocument();

                        const className = content?.className || '';

                        // Verifica largura
                        expect(className).toMatch(/w-3\/4/);
                        expect(className).toMatch(/sm:max-w-sm/);

                        // Verifica border-l
                        expect(className).toMatch(/border-l/);

                        // Verifica posicionamento
                        expect(className).toMatch(/inset-y-0/);
                        expect(className).toMatch(/right-0/);
                        expect(className).toMatch(/h-full/);
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: sheet-height, Property 27: Bottom side auto height and border
     * Validates: Requirements 6.3
     *
     * Para qualquer Sheet com side=bottom,
     * deve ter altura automática e border-t
     */
    test('Property 27: Sheet with side=bottom has auto height and border-t', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.string({ minLength: 10, maxLength: 100 }),
                async (description) => {
                    const { container } = render(
                        <Sheet defaultOpen={true}>
                            <SheetTrigger>Open</SheetTrigger>
                            <SheetContent side="bottom">
                                <SheetHeader>
                                    <SheetTitle>Bottom Sheet</SheetTitle>
                                    <SheetDescription>{description}</SheetDescription>
                                </SheetHeader>
                            </SheetContent>
                        </Sheet>
                    );

                    await waitFor(() => {
                        const content = container.querySelector('[data-slot="sheet-content"]');
                        expect(content).toBeInTheDocument();

                        const className = content?.className || '';

                        // Verifica altura automática
                        expect(className).toMatch(/h-auto/);

                        // Verifica border-t
                        expect(className).toMatch(/border-t/);

                        // Verifica posicionamento
                        expect(className).toMatch(/inset-x-0/);
                        expect(className).toMatch(/bottom-0/);
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: sheet-overlay-close, Property 28: Overlay and close button
     * Validates: Requirements 6.4
     *
     * Para qualquer Sheet aberto,
     * deve renderizar overlay e botão X
     */
    test('Property 28: Sheet renders overlay and close button', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.constantFrom('top', 'right', 'bottom', 'left') as fc.Arbitrary<'top' | 'right' | 'bottom' | 'left'>,
                async (side) => {
                    const { container } = render(
                        <Sheet defaultOpen={true}>
                            <SheetTrigger>Open</SheetTrigger>
                            <SheetContent side={side}>
                                <SheetHeader>
                                    <SheetTitle>Title</SheetTitle>
                                </SheetHeader>
                            </SheetContent>
                        </Sheet>
                    );

                    await waitFor(() => {
                        // Verifica overlay
                        const overlay = container.querySelector('[data-slot="sheet-overlay"]');
                        expect(overlay).toBeInTheDocument();
                        expect(overlay?.classList.contains('bg-black/50')).toBe(true);
                        expect(overlay?.classList.contains('z-50')).toBe(true);

                        // Verifica botão X
                        const content = container.querySelector('[data-slot="sheet-content"]');
                        const closeButton = content?.querySelector('button[class*="absolute"]');
                        expect(closeButton).toBeInTheDocument();

                        const xIcon = closeButton?.querySelector('svg');
                        expect(xIcon).toBeInTheDocument();
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: sheet-animation-duration, Property 29: Different durations for open/close
     * Validates: Requirements 6.5
     *
     * Para qualquer Sheet,
     * deve ter duração de animação diferente para open (500ms) e close (300ms)
     */
    test('Property 29: Sheet has different animation durations for open and close', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.constantFrom('top', 'right', 'bottom', 'left') as fc.Arbitrary<'top' | 'right' | 'bottom' | 'left'>,
                async (side) => {
                    const { container } = render(
                        <Sheet defaultOpen={true}>
                            <SheetTrigger>Open</SheetTrigger>
                            <SheetContent side={side}>
                                <SheetHeader>
                                    <SheetTitle>Title</SheetTitle>
                                </SheetHeader>
                            </SheetContent>
                        </Sheet>
                    );

                    await waitFor(() => {
                        const content = container.querySelector('[data-slot="sheet-content"]');
                        expect(content).toBeInTheDocument();

                        const className = content?.className || '';

                        // Verifica duração de animação
                        expect(className).toMatch(/data-\[state=closed\]:duration-300/);
                        expect(className).toMatch(/data-\[state=open\]:duration-500/);

                        // Verifica transição ease-in-out
                        expect(className).toMatch(/ease-in-out/);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});
