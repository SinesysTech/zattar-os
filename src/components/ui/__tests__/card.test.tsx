/**
 * Property-Based Tests - Card
 *
 * Testes de propriedades para o componente Card
 * usando fast-check para validar comportamentos universais.
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card';
import {
    setViewport,
    COMMON_VIEWPORTS,
} from '@/testing/helpers/responsive-test-helpers';

describe('Card - Property-Based Tests', () => {
    beforeEach(() => {
        setViewport(COMMON_VIEWPORTS.desktop);
    });

    /**
     * Feature: card-composition, Property 15: Card hierarchy with header, title and description
     * Validates: Requirements 4.1
     *
     * Para qualquer Card com CardHeader + CardTitle + CardDescription,
     * deve renderizar hierarquia correta
     */
    test('Property 15: Card renders correct hierarchy with header, title and description', () => {
        fc.assert(
            fc.property(
                fc.record({
                    title: fc.string({ minLength: 3, maxLength: 50 }),
                    description: fc.string({ minLength: 10, maxLength: 100 }),
                }),
                ({ title, description }) => {
                    const { container } = render(
                        <Card>
                            <CardHeader>
                                <CardTitle>{title}</CardTitle>
                                <CardDescription>{description}</CardDescription>
                            </CardHeader>
                        </Card>
                    );

                    // Verifica Card root
                    const card = container.querySelector('[data-slot="card"]');
                    expect(card).toBeInTheDocument();
                    expect(card?.classList.contains('flex')).toBe(true);
                    expect(card?.classList.contains('flex-col')).toBe(true);

                    // Verifica CardHeader
                    const header = container.querySelector('[data-slot="card-header"]');
                    expect(header).toBeInTheDocument();
                    expect(header?.classList.contains('grid')).toBe(true);

                    // Verifica CardTitle
                    const cardTitle = container.querySelector('[data-slot="card-title"]');
                    expect(cardTitle).toBeInTheDocument();
                    expect(cardTitle).toHaveTextContent(title);
                    expect(cardTitle?.classList.contains('font-semibold')).toBe(true);

                    // Verifica CardDescription
                    const cardDescription = container.querySelector('[data-slot="card-description"]');
                    expect(cardDescription).toBeInTheDocument();
                    expect(cardDescription).toHaveTextContent(description);
                    expect(cardDescription?.classList.contains('text-muted-foreground')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: card-action, Property 16: CardAction positioning
     * Validates: Requirements 4.2
     *
     * Para qualquer Card com CardAction,
     * deve posicionar ação no canto superior direito
     */
    test('Property 16: CardAction is positioned in top-right corner', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                (actionText) => {
                    const { container } = render(
                        <Card>
                            <CardHeader>
                                <CardTitle>Title</CardTitle>
                                <CardAction>
                                    <button>{actionText}</button>
                                </CardAction>
                            </CardHeader>
                        </Card>
                    );

                    const action = container.querySelector('[data-slot="card-action"]');
                    expect(action).toBeInTheDocument();

                    // Verifica posicionamento com grid
                    expect(action?.classList.contains('col-start-2')).toBe(true);
                    expect(action?.classList.contains('row-span-2')).toBe(true);
                    expect(action?.classList.contains('row-start-1')).toBe(true);
                    expect(action?.classList.contains('self-start')).toBe(true);
                    expect(action?.classList.contains('justify-self-end')).toBe(true);

                    // Verifica que o header tem grid de 2 colunas
                    const header = container.querySelector('[data-slot="card-header"]');
                    const className = header?.className || '';
                    expect(className).toMatch(/has-\[data-slot=card-action\]:grid-cols-\[1fr_auto\]/);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: card-footer, Property 17: CardFooter with border-t padding
     * Validates: Requirements 4.3
     *
     * Para qualquer Card com CardFooter e border-t,
     * deve ter padding-top adequado
     */
    test('Property 17: CardFooter with border-t has correct padding', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 30 }),
                (footerText) => {
                    const { container } = render(
                        <Card>
                            <CardContent>Content</CardContent>
                            <CardFooter className="border-t">
                                {footerText}
                            </CardFooter>
                        </Card>
                    );

                    const footer = container.querySelector('[data-slot="card-footer"]');
                    expect(footer).toBeInTheDocument();

                    // Verifica classes base
                    expect(footer?.classList.contains('flex')).toBe(true);
                    expect(footer?.classList.contains('items-center')).toBe(true);
                    expect(footer?.classList.contains('px-6')).toBe(true);

                    // Verifica padding condicional para border-t
                    const className = footer?.className || '';
                    expect(className).toMatch(/\[\.border-t\]:pt-6/);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: card-spacing, Property 18: Consistent gap between sections
     * Validates: Requirements 4.4
     *
     * Para qualquer Card,
     * deve ter gap consistente de gap-6 entre seções
     */
    test('Property 18: Card has consistent gap-6 between sections', () => {
        fc.assert(
            fc.property(
                fc.record({
                    title: fc.string({ minLength: 3, maxLength: 30 }),
                    content: fc.string({ minLength: 10, maxLength: 100 }),
                    footer: fc.string({ minLength: 5, maxLength: 30 }),
                }),
                ({ title, content, footer }) => {
                    const { container } = render(
                        <Card>
                            <CardHeader>
                                <CardTitle>{title}</CardTitle>
                            </CardHeader>
                            <CardContent>{content}</CardContent>
                            <CardFooter>{footer}</CardFooter>
                        </Card>
                    );

                    const card = container.querySelector('[data-slot="card"]');
                    expect(card).toBeInTheDocument();

                    // Verifica gap-6 no Card root
                    expect(card?.classList.contains('gap-6')).toBe(true);

                    // Verifica que é flex-col para aplicar gap vertical
                    expect(card?.classList.contains('flex-col')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: card-multiple-content, Property 19: Multiple CardContent sections with consistent padding
     * Validates: Requirements 4.5
     *
     * Para qualquer Card com múltiplos CardContent,
     * deve manter espaçamento consistente
     */
    test('Property 19: Multiple CardContent sections have consistent padding', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 5 }),
                (numSections) => {
                    const sections = Array.from({ length: numSections }, (_, i) => `Content ${i + 1}`);

                    const { container } = render(
                        <Card>
                            <CardHeader>
                                <CardTitle>Title</CardTitle>
                            </CardHeader>
                            {sections.map((text, i) => (
                                <CardContent key={i}>{text}</CardContent>
                            ))}
                        </Card>
                    );

                    const contentSections = container.querySelectorAll('[data-slot="card-content"]');
                    expect(contentSections).toHaveLength(numSections);

                    // Verifica que cada CardContent tem px-6
                    contentSections.forEach((section) => {
                        expect(section.classList.contains('px-6')).toBe(true);
                    });

                    // Verifica que o Card mantém gap-6
                    const card = container.querySelector('[data-slot="card"]');
                    expect(card?.classList.contains('gap-6')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
});
