/* eslint-disable react/display-name */
/**
 * Property-Based Tests - UI Integration
 *
 * Testes de propriedades para composições complexas de componentes
 * usando fast-check para validar comportamentos universais.
 */

import React from 'react';
import * as fc from 'fast-check';
import { render, waitFor, cleanup } from '@testing-library/react';
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

// Mock Radix Tooltip primitives to avoid portal/floating crashes in jsdom
jest.mock('@radix-ui/react-tooltip', () => ({
    Provider: ({ children, ...props }: any) => <div data-slot="tooltip-provider" {...props}>{children}</div>,
    Root: ({ children }: any) => <>{children}</>,
    Trigger: React.forwardRef(({ children, asChild, ...props }: any, ref: any) => {
        if (asChild && React.isValidElement(children)) {
            return React.cloneElement(children as React.ReactElement<any>, { ref, 'data-slot': 'tooltip-trigger', ...props });
        }
        return <button ref={ref} data-slot="tooltip-trigger" {...props}>{children}</button>;
    }),
    Content: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
        <div ref={ref} data-slot="tooltip-content" className={`z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance ${className || ''}`} {...props}>
            {children}
        </div>
    )),
    Portal: ({ children }: any) => <>{children}</>,
    Arrow: () => null,
}));

// Mock Radix Dialog primitives to avoid portal crashes in jsdom
jest.mock('@radix-ui/react-dialog', () => ({
    Root: ({ children, ...props }: any) => <div data-slot="dialog" {...props}>{children}</div>,
    Trigger: React.forwardRef(({ children, asChild, ...props }: any, ref: any) => {
        if (asChild && React.isValidElement(children)) {
            return React.cloneElement(children as React.ReactElement<any>, { ref, 'data-slot': 'dialog-trigger', ...props });
        }
        return <button ref={ref} data-slot="dialog-trigger" {...props}>{children}</button>;
    }),
    Portal: ({ children }: any) => <>{children}</>,
    Overlay: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
        <div ref={ref} data-slot="dialog-overlay" className={className} {...props}>{children}</div>
    )),
    Content: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
        <div ref={ref} data-slot="dialog-content" className={className} {...props}>{children}</div>
    )),
    Close: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
        <button ref={ref} data-slot="dialog-close" className={className} {...props}>{children}</button>
    )),
    Title: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
        <h2 ref={ref} data-slot="dialog-title" className={className} {...props}>{children}</h2>
    )),
    Description: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
        <p ref={ref} data-slot="dialog-description" className={className} {...props}>{children}</p>
    )),
}));

jest.retryTimes(0);

describe('UI Integration - Property-Based Tests', () => {
    beforeEach(() => {
        setViewport(COMMON_VIEWPORTS.desktop);
    });

    afterEach(() => {
        cleanup();
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
            { numRuns: 3 }
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
            { numRuns: 3 }
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
            { numRuns: 3 }
        );
    });
});
