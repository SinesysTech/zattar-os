/**
 * Property-Based Tests - Dialog
 *
 * Testes de propriedades para o componente Dialog
 * usando fast-check para validar comportamentos universais.
 */

import * as fc from 'fast-check';
import { render, waitFor } from '@testing-library/react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
    setViewport,
    COMMON_VIEWPORTS,
} from '@/testing/helpers/responsive-test-helpers';

describe('Dialog - Property-Based Tests', () => {
    beforeEach(() => {
        setViewport(COMMON_VIEWPORTS.desktop);
    });

    /**
     * Feature: dialog-overlay, Property 20: Overlay with bg-black/50
     * Validates: Requirements 5.1
     *
     * Para qualquer Dialog aberto,
     * deve renderizar overlay com bg-black/50
     */
    test('Property 20: Dialog renders overlay with bg-black/50', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.boolean(),
                async (defaultOpen) => {
                    const { container } = render(
                        <Dialog defaultOpen={defaultOpen}>
                            <DialogTrigger>Open</DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Title</DialogTitle>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    );

                    if (defaultOpen) {
                        await waitFor(() => {
                            const overlay = container.querySelector('[data-slot="dialog-overlay"]');
                            expect(overlay).toBeInTheDocument();

                            // Verifica background com opacidade
                            const className = overlay?.className || '';
                            expect(className).toMatch(/bg-black\/50/);

                            // Verifica z-index
                            expect(overlay?.classList.contains('z-50')).toBe(true);

                            // Verifica posicionamento fixed inset-0
                            expect(overlay?.classList.contains('fixed')).toBe(true);
                            expect(overlay?.classList.contains('inset-0')).toBe(true);
                        });
                    }
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: dialog-animations, Property 21: Fade and zoom animations
     * Validates: Requirements 5.2
     *
     * Para qualquer Dialog,
     * deve ter animações de fade-in/fade-out e zoom
     */
    test('Property 21: Dialog has fade and zoom animations', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.string({ minLength: 5, maxLength: 50 }),
                async (title) => {
                    const { container } = render(
                        <Dialog defaultOpen={true}>
                            <DialogTrigger>Open</DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{title}</DialogTitle>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    );

                    await waitFor(() => {
                        const content = container.querySelector('[data-slot="dialog-content"]');
                        expect(content).toBeInTheDocument();

                        const className = content?.className || '';

                        // Verifica animações de fade
                        expect(className).toMatch(/data-\[state=open\]:fade-in-0/);
                        expect(className).toMatch(/data-\[state=closed\]:fade-out-0/);

                        // Verifica animações de zoom
                        expect(className).toMatch(/data-\[state=open\]:zoom-in-95/);
                        expect(className).toMatch(/data-\[state=closed\]:zoom-out-95/);

                        // Verifica duração
                        expect(className).toMatch(/duration-200/);
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: dialog-close-icon, Property 22: Close icon toggle
     * Validates: Requirements 5.3
     *
     * Para qualquer Dialog com showCloseIcon={false},
     * não deve renderizar botão X
     */
    test('Property 22: Dialog respects showCloseIcon prop', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.boolean(),
                async (showCloseIcon) => {
                    const { container } = render(
                        <Dialog defaultOpen={true}>
                            <DialogTrigger>Open</DialogTrigger>
                            <DialogContent showCloseIcon={showCloseIcon}>
                                <DialogHeader>
                                    <DialogTitle>Title</DialogTitle>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    );

                    await waitFor(() => {
                        const content = container.querySelector('[data-slot="dialog-content"]');
                        expect(content).toBeInTheDocument();

                        const closeButton = content?.querySelector('button[class*="absolute"]');

                        if (showCloseIcon) {
                            expect(closeButton).toBeInTheDocument();
                            const xIcon = closeButton?.querySelector('svg');
                            expect(xIcon).toBeInTheDocument();
                        } else {
                            expect(closeButton).not.toBeInTheDocument();
                        }
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: dialog-positioning, Property 23: Desktop centered positioning
     * Validates: Requirements 5.4
     *
     * Para qualquer Dialog,
     * deve ter largura máxima sm:max-w-lg e centralização
     */
    test('Property 23: Dialog has correct desktop positioning and max-width', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.string({ minLength: 10, maxLength: 100 }),
                async (description) => {
                    const { container } = render(
                        <Dialog defaultOpen={true}>
                            <DialogTrigger>Open</DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Title</DialogTitle>
                                    <DialogDescription>{description}</DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    );

                    await waitFor(() => {
                        const content = container.querySelector('[data-slot="dialog-content"]');
                        expect(content).toBeInTheDocument();

                        const className = content?.className || '';

                        // Verifica centralização
                        expect(className).toMatch(/top-\[50%\]/);
                        expect(className).toMatch(/left-\[50%\]/);
                        expect(className).toMatch(/translate-x-\[-50%\]/);
                        expect(className).toMatch(/translate-y-\[-50%\]/);

                        // Verifica max-width em desktop
                        expect(className).toMatch(/sm:max-w-lg/);

                        // Verifica posicionamento fixed
                        expect(content?.classList.contains('fixed')).toBe(true);
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: dialog-mobile, Property 24: Mobile responsive width
     * Validates: Requirements 5.5
     *
     * Para qualquer Dialog em mobile (<640px),
     * deve ter largura max-w-[calc(100%-2rem)]
     */
    test('Property 24: Dialog has responsive width on mobile', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.integer({ min: 320, max: 639 }),
                async (width) => {
                    setViewport({ width, height: 667 });

                    const { container } = render(
                        <Dialog defaultOpen={true}>
                            <DialogTrigger>Open</DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Mobile Dialog</DialogTitle>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    );

                    await waitFor(() => {
                        const content = container.querySelector('[data-slot="dialog-content"]');
                        expect(content).toBeInTheDocument();

                        const className = content?.className || '';

                        // Verifica largura mobile responsiva
                        expect(className).toMatch(/max-w-\[calc\(100%-2rem\)\]/);

                        // Verifica w-full para mobile
                        expect(content?.classList.contains('w-full')).toBe(true);
                    });
                }
            ),
            { numRuns: 50 }
        );
    });
});
