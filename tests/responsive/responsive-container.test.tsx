/**
 * Property-based tests para ResponsiveContainer
 * 
 * Testes que validam propriedades universais do componente
 * ResponsiveContainer em diferentes viewports.
 */

import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { setViewport, BREAKPOINTS } from '@/tests/helpers/responsive-test-helpers';

describe('ResponsiveContainer Property Tests', () => {
    /**
     * Feature: responsividade-frontend, Property 48: Components responsive classes
     * Validates: Requirements 11.1
     * 
     * Para qualquer componente UI renderizado em diferentes tamanhos de viewport,
     * classes responsivas apropriadas devem ser aplicadas.
     */
    test('Property 48: Components apply appropriate responsive classes for any viewport', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 2000 }), // viewport widths
                fc.integer({ min: 480, max: 1200 }), // viewport heights
                (width, height) => {
                    // Configura viewport
                    setViewport({ width, height });

                    // Renderiza componente
                    const { container } = render(
                        <ResponsiveContainer data-testid="container">
                            Test Content
                        </ResponsiveContainer>
                    );

                    const element = container.firstChild as HTMLElement;

                    // Verifica que o elemento tem a classe base
                    expect(element).toHaveClass('responsive-container');

                    // Verifica que tem data attributes corretos
                    expect(element).toHaveAttribute('data-viewport-width', width.toString());
                    expect(element).toHaveAttribute('data-viewport-height', height.toString());

                    // Verifica classificação de dispositivo
                    const isMobile = width < BREAKPOINTS.md;
                    const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
                    const isDesktop = width >= BREAKPOINTS.lg;

                    expect(element).toHaveAttribute('data-is-mobile', isMobile.toString());
                    expect(element).toHaveAttribute('data-is-tablet', isTablet.toString());
                    expect(element).toHaveAttribute('data-is-desktop', isDesktop.toString());

                    // Verifica orientação
                    const orientation = width > height ? 'landscape' : 'portrait';
                    expect(element).toHaveAttribute('data-orientation', orientation);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 49: Responsive spacing
     * Validates: Requirements 11.2
     * 
     * Para qualquer spacing e padding aplicados a componentes,
     * valores responsivos que escalam apropriadamente devem ser usados.
     */
    test('Property 49: Responsive spacing scales appropriately for any configuration', () => {
        fc.assert(
            fc.property(
                fc.record({
                    xs: fc.constantFrom('2', '4', '6', '8'),
                    sm: fc.constantFrom('2', '4', '6', '8'),
                    md: fc.constantFrom('4', '6', '8', '10'),
                    lg: fc.constantFrom('6', '8', '10', '12'),
                }),
                fc.integer({ min: 320, max: 2000 }),
                (spacing, width) => {
                    setViewport({ width, height: 800 });

                    const { container } = render(
                        <ResponsiveContainer padding={spacing}>
                            Test Content
                        </ResponsiveContainer>
                    );

                    const element = container.firstChild as HTMLElement;

                    // Verifica que classes de padding foram aplicadas
                    const classList = Array.from(element.classList);

                    // Deve ter pelo menos uma classe de padding
                    const hasPaddingClass = classList.some(
                        (cls) => cls.startsWith('p-') || cls.includes(':p-')
                    );
                    expect(hasPaddingClass).toBe(true);

                    // Verifica que as classes responsivas corretas foram aplicadas
                    if (width < BREAKPOINTS.sm) {
                        // xs: deve ter p-{xs}
                        expect(classList.some((cls) => cls === `p-${spacing.xs}`)).toBe(true);
                    } else if (width < BREAKPOINTS.md) {
                        // sm: deve ter sm:p-{sm}
                        expect(classList.some((cls) => cls === `sm:p-${spacing.sm}`)).toBe(true);
                    } else if (width < BREAKPOINTS.lg) {
                        // md: deve ter md:p-{md}
                        expect(classList.some((cls) => cls === `md:p-${spacing.md}`)).toBe(true);
                    } else {
                        // lg+: deve ter lg:p-{lg}
                        expect(classList.some((cls) => cls === `lg:p-${spacing.lg}`)).toBe(true);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Touch device detection
     * 
     * Verifica que o container detecta corretamente touch devices
     * e aplica otimizações apropriadas.
     */
    test('Touch optimized container applies touch-specific classes', () => {
        const { container } = render(
            <ResponsiveContainer touchOptimized>
                Test Content
            </ResponsiveContainer>
        );

        const element = container.firstChild as HTMLElement;

        // Verifica que tem o data attribute de touch device
        expect(element).toHaveAttribute('data-touch-device');
    });

    /**
     * Teste adicional: Max width constraints
     * 
     * Verifica que max-width é aplicado corretamente
     */
    test('Container applies max-width constraints correctly', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('sm', 'md', 'lg', 'xl', '2xl', 'full', 'none'),
                (maxWidth) => {
                    const { container } = render(
                        <ResponsiveContainer maxWidth={maxWidth as any}>
                            Test Content
                        </ResponsiveContainer>
                    );

                    const element = container.firstChild as HTMLElement;

                    if (maxWidth === 'none') {
                        // Não deve ter classe max-w
                        expect(element.className).not.toMatch(/max-w-/);
                    } else if (maxWidth === 'full') {
                        expect(element).toHaveClass('max-w-full');
                    } else {
                        expect(element).toHaveClass(`max-w-${maxWidth}`);
                    }
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Teste adicional: Centered container
     * 
     * Verifica que containers centralizados têm margin auto
     */
    test('Centered containers have mx-auto class', () => {
        const { container } = render(
            <ResponsiveContainer centered>
                Test Content
            </ResponsiveContainer>
        );

        const element = container.firstChild as HTMLElement;
        expect(element).toHaveClass('mx-auto');
    });
});
