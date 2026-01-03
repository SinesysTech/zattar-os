/**
 * Property-Based Tests - UI Integration
 *
 * Testes de propriedades para composições complexas de componentes
 * usando fast-check para validar comportamentos universais.
 */

import * as fc from 'fast-check';
import { render, waitFor } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    setViewport,
    COMMON_VIEWPORTS,
} from '@/testing/helpers/responsive-test-helpers';

describe('UI Integration - Property-Based Tests', () => {
    beforeEach(() => {
        setViewport(COMMON_VIEWPORTS.desktop);
    });

    /**
     * Feature: card-dialog, Property 47: Card with Dialog trigger
     * Validates: Requirements 11.1
     *
     * Para qualquer Card com Dialog trigger,
     * deve abrir Dialog ao clicar
     */
    test('Property 47: Card with Dialog trigger opens Dialog', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.record({
                    cardTitle: fc.string({ minLength: 5, maxLength: 30 }),
                    dialogTitle: fc.string({ minLength: 5, maxLength: 30 }),
                }),
                async ({ cardTitle, dialogTitle }) => {
                    const { container } = render(
                        <Card>
                            <CardHeader>
                                <CardTitle>{cardTitle}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Dialog defaultOpen={true}>
                                    <DialogTrigger asChild>
                                        <Button>Open Dialog</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{dialogTitle}</DialogTitle>
                                        </DialogHeader>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    );

                    await waitFor(() => {
                        // Verifica Card
                        const card = container.querySelector('[data-slot="card"]');
                        expect(card).toBeInTheDocument();
                        expect(card).toHaveTextContent(cardTitle);

                        // Verifica Dialog content
                        const dialogContent = container.querySelector('[data-slot="dialog-content"]');
                        expect(dialogContent).toBeInTheDocument();
                        expect(dialogContent).toHaveTextContent(dialogTitle);
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: tooltip-button-card, Property 48: Tooltip in Button inside Card
     * Validates: Requirements 11.2
     *
     * Para qualquer Tooltip em Button dentro de Card,
     * deve renderizar corretamente
     */
    test('Property 48: Tooltip in Button inside Card renders correctly', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.record({
                    cardTitle: fc.string({ minLength: 5, maxLength: 30 }),
                    buttonText: fc.string({ minLength: 3, maxLength: 20 }),
                    tooltipText: fc.string({ minLength: 5, maxLength: 50 }),
                }),
                async ({ cardTitle, buttonText, tooltipText }) => {
                    const { container } = render(
                        <Card>
                            <CardHeader>
                                <CardTitle>{cardTitle}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tooltip defaultOpen={true}>
                                    <TooltipTrigger asChild>
                                        <Button>{buttonText}</Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{tooltipText}</TooltipContent>
                                </Tooltip>
                            </CardContent>
                        </Card>
                    );

                    await waitFor(() => {
                        // Verifica Card
                        const card = container.querySelector('[data-slot="card"]');
                        expect(card).toBeInTheDocument();

                        // Verifica Button
                        const button = container.querySelector('button');
                        expect(button).toBeInTheDocument();
                        expect(button).toHaveTextContent(buttonText);

                        // Verifica Tooltip
                        const tooltip = container.querySelector('[data-slot="tooltip-content"]');
                        expect(tooltip).toBeInTheDocument();
                        expect(tooltip).toHaveTextContent(tooltipText);
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: avatar-badge, Property 49: Badge inside Avatar composition
     * Validates: Requirements 11.3
     *
     * Para qualquer Badge dentro de Avatar,
     * deve manter tamanho e posicionamento
     */
    test('Property 49: Badge inside Avatar maintains size and positioning', () => {
        fc.assert(
            fc.property(
                fc.record({
                    initials: fc.string({ minLength: 1, maxLength: 2 }),
                    badgeText: fc.string({ minLength: 1, maxLength: 5 }),
                    badgeVariant: fc.constantFrom('default', 'success', 'warning', 'destructive') as fc.Arbitrary<'default' | 'success' | 'warning' | 'destructive'>,
                }),
                ({ initials, badgeText, badgeVariant }) => {
                    const { container } = render(
                        <div className="relative inline-block">
                            <Avatar>
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <Badge
                                variant={badgeVariant}
                                className="absolute -top-1 -right-1"
                            >
                                {badgeText}
                            </Badge>
                        </div>
                    );

                    // Verifica Avatar
                    const avatar = container.querySelector('[data-slot="avatar"]');
                    expect(avatar).toBeInTheDocument();
                    expect(avatar?.classList.contains('size-8')).toBe(true);
                    expect(avatar?.classList.contains('rounded-full')).toBe(true);

                    // Verifica Badge
                    const badge = container.querySelector('[data-slot="badge"]');
                    expect(badge).toBeInTheDocument();
                    expect(badge).toHaveTextContent(badgeText);

                    // Verifica que Badge tem posicionamento absoluto
                    const badgeClassName = badge?.className || '';
                    expect(badgeClassName).toMatch(/absolute/);

                    // Verifica container relativo
                    const relativeContainer = container.querySelector('.relative.inline-block');
                    expect(relativeContainer).toBeInTheDocument();
                }
            ),
            { numRuns: 100 }
        );
    });
});
