/**
 * Property-based tests para ResponsiveGrid
 * 
 * Testes que validam propriedades universais do componente
 * ResponsiveGrid em diferentes viewports.
 */

import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { ResponsiveGrid, ResponsiveGridItem } from '@/components/ui/responsive-grid';
import { setViewport, BREAKPOINTS } from '@/testing/helpers/responsive-test-helpers';
import { Card, CardContent } from '@/components/ui/card';

describe('ResponsiveGrid Property Tests', () => {
    /**
     * Feature: responsividade-frontend, Property 14: Grid single column on mobile
     * Validates: Requirements 4.1
     * 
     * Para qualquer grid layout exibido em viewport width menor que 640px,
     * os itens devem ser exibidos em uma única coluna.
     */
    test('Property 14: Grid displays single column for any viewport < 640px', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 639 }), // mobile viewport widths
                fc.array(fc.string(), { minLength: 1, maxLength: 20 }), // grid items
                (width, items) => {
                    // Configura viewport mobile
                    setViewport({ width, height: 800 });

                    // Renderiza grid com itens
                    const { container } = render(
                        <ResponsiveGrid data-testid="grid">
                            {items.map((item, idx) => (
                                <Card key={idx}>
                                    <CardContent>{item}</CardContent>
                                </Card>
                            ))}
                        </ResponsiveGrid>
                    );

                    const gridElement = container.firstChild as HTMLElement;

                    // Verifica que o grid tem 1 coluna
                    expect(gridElement).toHaveClass('grid-cols-1');

                    // Verifica data attribute
                    expect(gridElement).toHaveAttribute('data-columns', '1');

                    // Verifica que não tem classes de múltiplas colunas sem prefixo
                    const classList = Array.from(gridElement.classList);
                    const hasMultipleColumnsWithoutPrefix = classList.some(
                        (cls) => /^grid-cols-[2-9]$/.test(cls)
                    );
                    expect(hasMultipleColumnsWithoutPrefix).toBe(false);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 15: Grid two columns on small screens
     * Validates: Requirements 4.2
     * 
     * Para qualquer grid layout exibido em viewport width 640px-768px,
     * os itens devem ser exibidos em 2 colunas.
     */
    test('Property 15: Grid displays two columns for any viewport 640px-768px', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 640, max: 767 }), // small screen viewport widths
                fc.array(fc.string(), { minLength: 1, maxLength: 20 }), // grid items
                (width, items) => {
                    // Configura viewport small
                    setViewport({ width, height: 800 });

                    // Renderiza grid com itens
                    const { container } = render(
                        <ResponsiveGrid data-testid="grid">
                            {items.map((item, idx) => (
                                <Card key={idx}>
                                    <CardContent>{item}</CardContent>
                                </Card>
                            ))}
                        </ResponsiveGrid>
                    );

                    const gridElement = container.firstChild as HTMLElement;

                    // Verifica que o grid tem classe sm:grid-cols-2
                    expect(gridElement).toHaveClass('sm:grid-cols-2');

                    // Verifica data attribute
                    expect(gridElement).toHaveAttribute('data-columns', '2');

                    // Verifica breakpoint
                    expect(gridElement).toHaveAttribute('data-breakpoint', 'sm');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 16: Grid three columns on tablet
     * Validates: Requirements 4.3
     * 
     * Para qualquer grid layout exibido em viewport width 768px-1024px,
     * os itens devem ser exibidos em 3 colunas.
     */
    test('Property 16: Grid displays three columns for any viewport 768px-1024px', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 768, max: 1023 }), // tablet viewport widths
                fc.array(fc.string(), { minLength: 1, maxLength: 20 }), // grid items
                (width, items) => {
                    // Configura viewport tablet
                    setViewport({ width, height: 1024 });

                    // Renderiza grid com itens
                    const { container } = render(
                        <ResponsiveGrid data-testid="grid">
                            {items.map((item, idx) => (
                                <Card key={idx}>
                                    <CardContent>{item}</CardContent>
                                </Card>
                            ))}
                        </ResponsiveGrid>
                    );

                    const gridElement = container.firstChild as HTMLElement;

                    // Verifica que o grid tem classe md:grid-cols-3
                    expect(gridElement).toHaveClass('md:grid-cols-3');

                    // Verifica data attribute
                    expect(gridElement).toHaveAttribute('data-columns', '3');

                    // Verifica breakpoint
                    expect(gridElement).toHaveAttribute('data-breakpoint', 'md');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 17: Grid four+ columns on desktop
     * Validates: Requirements 4.4
     * 
     * Para qualquer grid layout exibido em viewport width maior que 1024px,
     * os itens devem ser exibidos em 4 ou mais colunas.
     */
    test('Property 17: Grid displays four or more columns for any viewport > 1024px', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1024, max: 2560 }), // desktop viewport widths
                fc.array(fc.string(), { minLength: 1, maxLength: 20 }), // grid items
                (width, items) => {
                    // Configura viewport desktop
                    setViewport({ width, height: 1080 });

                    // Renderiza grid com itens
                    const { container } = render(
                        <ResponsiveGrid data-testid="grid">
                            {items.map((item, idx) => (
                                <Card key={idx}>
                                    <CardContent>{item}</CardContent>
                                </Card>
                            ))}
                        </ResponsiveGrid>
                    );

                    const gridElement = container.firstChild as HTMLElement;

                    // Verifica que o grid tem classe lg:grid-cols-4 ou xl:grid-cols-*
                    expect(gridElement).toHaveClass('lg:grid-cols-4');

                    // Verifica data attribute - deve ser 4 ou mais
                    const columns = parseInt(gridElement.getAttribute('data-columns') || '0', 10);
                    expect(columns).toBeGreaterThanOrEqual(4);

                    // Verifica breakpoint
                    const breakpoint = gridElement.getAttribute('data-breakpoint');
                    expect(['lg', 'xl', '2xl']).toContain(breakpoint);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 18: Card images scale proportionally
     * Validates: Requirements 4.5
     * 
     * Para qualquer card contendo imagens em mobile,
     * as imagens devem escalar proporcionalmente para caber na largura do container.
     */
    test('Property 18: Card images scale proportionally for any mobile viewport', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }), // mobile viewport widths
                fc.array(fc.string(), { minLength: 1, maxLength: 10 }), // image sources
                (width, imageSrcs) => {
                    // Configura viewport mobile
                    setViewport({ width, height: 800 });

                    // Renderiza grid com cards contendo imagens
                    const { container } = render(
                        <ResponsiveGrid scaleImages data-testid="grid">
                            {imageSrcs.map((src, idx) => (
                                <Card key={idx}>
                                    <CardContent>
                                        { }
                                        <img src={src} alt={`Test ${idx}`} />
                                    </CardContent>
                                </Card>
                            ))}
                        </ResponsiveGrid>
                    );

                    const gridElement = container.firstChild as HTMLElement;

                    // Os itens do grid devem ter classes que fazem imagens escalarem
                    const cards = gridElement.querySelectorAll('.responsive-grid-item');
                    cards.forEach((card) => {
                        const cardClassList = Array.from(card.classList);

                        // Verifica que tem classes de imagem responsiva
                        const hasImageScaling = cardClassList.some(
                            (cls) =>
                                cls.includes('[&_img]:w-full') ||
                                cls.includes('[&_img]:h-auto') ||
                                cls.includes('[&_img]:object-cover')
                        );

                        // Se scaleImages está ativo, deve ter as classes
                        expect(hasImageScaling).toBe(true);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Custom column configuration
     * 
     * Verifica que configurações customizadas de colunas são respeitadas
     */
    test('Custom column configuration is respected across breakpoints', () => {
        fc.assert(
            fc.property(
                fc.record({
                    xs: fc.integer({ min: 1, max: 2 }),
                    sm: fc.integer({ min: 2, max: 3 }),
                    md: fc.integer({ min: 3, max: 4 }),
                    lg: fc.integer({ min: 4, max: 6 }),
                    xl: fc.integer({ min: 4, max: 6 }),
                }),
                fc.constantFrom(320, 640, 768, 1024, 1280),
                (columns, width) => {
                    setViewport({ width, height: 800 });

                    const { container } = render(
                        <ResponsiveGrid columns={columns}>
                            <Card>Item 1</Card>
                            <Card>Item 2</Card>
                            <Card>Item 3</Card>
                        </ResponsiveGrid>
                    );

                    const gridElement = container.firstChild as HTMLElement;

                    // Verifica que as classes corretas foram aplicadas
                    expect(gridElement).toHaveClass(`grid-cols-${columns.xs}`);
                    expect(gridElement).toHaveClass(`sm:grid-cols-${columns.sm}`);
                    expect(gridElement).toHaveClass(`md:grid-cols-${columns.md}`);
                    expect(gridElement).toHaveClass(`lg:grid-cols-${columns.lg}`);
                    expect(gridElement).toHaveClass(`xl:grid-cols-${columns.xl}`);

                    // Verifica data attribute baseado no breakpoint atual
                    let expectedColumns = columns.xs;
                    if (width >= BREAKPOINTS.xl) expectedColumns = columns.xl;
                    else if (width >= BREAKPOINTS.lg) expectedColumns = columns.lg;
                    else if (width >= BREAKPOINTS.md) expectedColumns = columns.md;
                    else if (width >= BREAKPOINTS.sm) expectedColumns = columns.sm;

                    expect(gridElement).toHaveAttribute('data-columns', expectedColumns.toString());
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Responsive gap
     * 
     * Verifica que gap responsivo é aplicado corretamente
     */
    test('Responsive gap is applied correctly', () => {
        fc.assert(
            fc.property(
                fc.record({
                    xs: fc.integer({ min: 2, max: 8 }),
                    md: fc.integer({ min: 4, max: 12 }),
                }),
                (gap) => {
                    const { container } = render(
                        <ResponsiveGrid gap={gap}>
                            <Card>Item 1</Card>
                            <Card>Item 2</Card>
                        </ResponsiveGrid>
                    );

                    const gridElement = container.firstChild as HTMLElement;

                    // Verifica que classes de gap foram aplicadas
                    expect(gridElement).toHaveClass(`gap-${gap.xs}`);
                    expect(gridElement).toHaveClass(`md:gap-${gap.md}`);
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Teste adicional: Image aspect ratio
     * 
     * Verifica que aspect ratio de imagens é aplicado corretamente
     */
    test('Image aspect ratio is applied to grid items', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('square', 'video', '16/9', '4/3'),
                (aspectRatio) => {
                    const { container } = render(
                        <ResponsiveGrid scaleImages imageAspectRatio={aspectRatio as 'auto' | 'square' | 'video' | '4/3' | '16/9'}>
                            <Card>
                                { }
                                <img src="test.jpg" alt="Test" />
                            </Card>
                        </ResponsiveGrid>
                    );

                    const gridElement = container.firstChild as HTMLElement;
                    const items = gridElement.querySelectorAll('.responsive-grid-item');

                    items.forEach((item) => {
                        const classList = Array.from(item.classList);

                        if (aspectRatio === 'square') {
                            expect(classList.some((cls) => cls.includes('aspect-square'))).toBe(true);
                        } else if (aspectRatio === 'video' || aspectRatio === '16/9') {
                            expect(classList.some((cls) => cls.includes('aspect-video'))).toBe(true);
                        } else if (aspectRatio === '4/3') {
                            expect(classList.some((cls) => cls.includes('aspect-[4/3]'))).toBe(true);
                        }
                    });
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Teste adicional: ResponsiveGridItem with colSpan
     * 
     * Verifica que ResponsiveGridItem com colSpan funciona corretamente
     */
    test('ResponsiveGridItem respects colSpan configuration', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 4 }),
                (colSpan) => {
                    const { container } = render(
                        <ResponsiveGrid>
                            <ResponsiveGridItem colSpan={colSpan}>
                                <Card>Spanning Item</Card>
                            </ResponsiveGridItem>
                            <Card>Regular Item</Card>
                        </ResponsiveGrid>
                    );

                    const gridElement = container.firstChild as HTMLElement;
                    const spanningItem = gridElement.querySelector('.responsive-grid-item');

                    expect(spanningItem).toHaveClass(`col-span-${colSpan}`);
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Teste adicional: Grid maintains structure with varying content
     * 
     * Verifica que o grid mantém estrutura consistente independente do conteúdo
     */
    test('Grid maintains consistent structure with varying content lengths', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 1, maxLength: 200 }), { minLength: 3, maxLength: 12 }),
                fc.integer({ min: 320, max: 1920 }),
                (contents, width) => {
                    setViewport({ width, height: 800 });

                    const { container } = render(
                        <ResponsiveGrid>
                            {contents.map((content, idx) => (
                                <Card key={idx}>
                                    <CardContent>{content}</CardContent>
                                </Card>
                            ))}
                        </ResponsiveGrid>
                    );

                    const gridElement = container.firstChild as HTMLElement;

                    // Verifica que é um grid
                    expect(gridElement).toHaveClass('grid');

                    // Verifica que tem o número correto de filhos
                    expect(gridElement.children.length).toBe(contents.length);

                    // Verifica que todos os itens são renderizados
                    contents.forEach((content) => {
                        expect(gridElement.textContent).toContain(content);
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});

