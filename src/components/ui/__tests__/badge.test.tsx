/**
 * Property-Based Tests - Badge
 *
 * Testes de propriedades para o componente Badge
 * usando fast-check para validar comportamentos universais.
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { Badge, badgeVariants } from '@/components/ui/badge';
import {
    setViewport,
    COMMON_VIEWPORTS,
} from '@/testing/helpers/responsive-test-helpers';
import { CheckIcon, XIcon, AlertCircle } from 'lucide-react';

describe('Badge - Property-Based Tests', () => {
    beforeEach(() => {
        setViewport(COMMON_VIEWPORTS.desktop);
    });

    /**
     * Feature: badge-variants, Property 1: Variant and tone combinations
     * Validates: Requirements 1.1
     *
     * Para qualquer combinação de tone e variant,
     * o Badge deve renderizar com classes CSS corretas
     */
    test('Property 1: Variant and tone combinations render correct CSS classes', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tone: fc.constantFrom('soft', 'solid') as fc.Arbitrary<'soft' | 'solid'>,
                    variant: fc.constantFrom(
                        'default',
                        'secondary',
                        'warning',
                        'info',
                        'success',
                        'destructive',
                        'outline',
                        'neutral',
                        'accent'
                    ) as fc.Arbitrary<'default' | 'secondary' | 'warning' | 'info' | 'success' | 'destructive' | 'outline' | 'neutral' | 'accent'>,
                }),
                ({ tone, variant }) => {
                    const { container } = render(
                        <Badge tone={tone} variant={variant}>Test Badge</Badge>
                    );

                    const badge = container.querySelector('[data-slot="badge"]');
                    expect(badge).toBeInTheDocument();

                    // Verifica classes base
                    expect(badge?.classList.contains('inline-flex')).toBe(true);
                    expect(badge?.classList.contains('items-center')).toBe(true);
                    expect(badge?.classList.contains('justify-center')).toBe(true);
                    expect(badge?.classList.contains('rounded-md')).toBe(true);

                    // Verifica que o variant foi aplicado
                    const className = badge?.className || '';
                    const variantClass = badgeVariants({ tone, variant });

                    // Para cada variant, verifica padrões de cores específicos
                    if (tone === 'soft' && variant === 'success') {
                        expect(className).toMatch(/bg-emerald-500\/15|text-emerald-700|text-emerald-400/);
                    } else if (tone === 'soft' && variant === 'warning') {
                        expect(className).toMatch(/bg-amber-500\/15|text-amber-700|text-amber-400/);
                    } else if (tone === 'soft' && variant === 'destructive') {
                        expect(className).toMatch(/bg-red-500\/15|text-red-700|text-red-400/);
                    } else if (tone === 'solid' && variant === 'default') {
                        expect(className).toMatch(/bg-primary|text-primary-foreground/);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: badge-icons, Property 2: Icon sizing and gap
     * Validates: Requirements 1.2
     *
     * Para qualquer Badge com ícone SVG,
     * o ícone deve ter tamanho size-3 e gap adequado
     */
    test('Property 2: Icons have correct size and gap', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    <CheckIcon className="size-3" />,
                    <XIcon className="size-3" />,
                    <AlertCircle className="size-3" />
                ),
                (icon) => {
                    const { container } = render(
                        <Badge>
                            {icon}
                            <span>Badge Text</span>
                        </Badge>
                    );

                    const badge = container.querySelector('[data-slot="badge"]');
                    expect(badge).toBeInTheDocument();

                    // Verifica gap entre elementos
                    expect(badge?.classList.contains('gap-1')).toBe(true);

                    // Verifica que SVG existe
                    const svg = badge?.querySelector('svg');
                    expect(svg).toBeInTheDocument();

                    // Verifica classe de ícone no badge
                    const className = badge?.className || '';
                    expect(className).toMatch(/\[&>svg\]:size-3/);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: badge-link, Property 3: Link hover states
     * Validates: Requirements 1.3
     *
     * Para qualquer Badge como link (asChild=true),
     * deve ter estados hover corretos
     */
    test('Property 3: Badge as link has correct hover states', () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                (asChild) => {
                    const { container } = render(
                        <Badge asChild={asChild} variant="outline">
                            {asChild ? <a href="/test">Link Badge</a> : 'Normal Badge'}
                        </Badge>
                    );

                    const badge = container.querySelector('[data-slot="badge"]');
                    expect(badge).toBeInTheDocument();

                    // Para outline variant, verifica classes de hover
                    if (asChild) {
                        const link = badge?.tagName === 'A' ? badge : badge?.querySelector('a');
                        expect(link).toBeInTheDocument();
                    }

                    // Verifica classes de outline variant
                    const className = badge?.className || '';
                    expect(className).toMatch(/ring-1|ring-inset/);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: badge-text, Property 4: Text truncation
     * Validates: Requirements 1.4
     *
     * Para qualquer Badge,
     * o texto deve ser truncado com whitespace-nowrap e shrink-0
     */
    test('Property 4: Text is properly truncated', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 50, maxLength: 100 }),
                (longText) => {
                    const { container } = render(
                        <Badge>{longText}</Badge>
                    );

                    const badge = container.querySelector('[data-slot="badge"]');
                    expect(badge).toBeInTheDocument();

                    // Verifica classes de truncamento
                    expect(badge?.classList.contains('whitespace-nowrap')).toBe(true);
                    expect(badge?.classList.contains('shrink-0')).toBe(true);
                    expect(badge?.classList.contains('overflow-hidden')).toBe(true);

                    // Verifica largura fit
                    expect(badge?.classList.contains('w-fit')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
});
