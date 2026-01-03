/**
 * Property-Based Tests - PageShell
 *
 * Testes de propriedades para o componente PageShell
 * usando fast-check para validar comportamentos universais.
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { PageShell } from '@/components/shared/page-shell';
import {
    setViewport,
    COMMON_VIEWPORTS,
} from '@/testing/helpers/responsive-test-helpers';

describe('PageShell - Property-Based Tests', () => {
    beforeEach(() => {
        setViewport(COMMON_VIEWPORTS.desktop);
    });

    /**
     * Feature: page-header, Property 35: Title and description with Typography
     * Validates: Requirements 8.1
     *
     * Para qualquer PageShell com título e descrição,
     * deve renderizar Typography.H1 e Typography.Muted
     */
    test('Property 35: PageShell renders title and description with Typography', () => {
        fc.assert(
            fc.property(
                fc.record({
                    title: fc.string({ minLength: 3, maxLength: 50 }),
                    description: fc.string({ minLength: 10, maxLength: 200 }),
                }),
                ({ title, description }) => {
                    const { container } = render(
                        <PageShell title={title} description={description}>
                            <div>Page content</div>
                        </PageShell>
                    );

                    // Verifica main element
                    const main = container.querySelector('main');
                    expect(main).toBeInTheDocument();
                    expect(main?.classList.contains('flex-1')).toBe(true);
                    expect(main?.classList.contains('space-y-6')).toBe(true);

                    // Verifica título (procura por h1)
                    const h1 = container.querySelector('h1');
                    expect(h1).toBeInTheDocument();
                    expect(h1).toHaveTextContent(title);

                    // Verifica descrição (procura por elemento com text-muted-foreground)
                    const descriptionElement = container.querySelector('.text-muted-foreground');
                    expect(descriptionElement).toBeInTheDocument();
                    expect(descriptionElement).toHaveTextContent(description);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: page-actions, Property 36: Actions positioned on the right in desktop
     * Validates: Requirements 8.2
     *
     * Para qualquer PageShell com actions,
     * deve posicionar ações à direita em desktop
     */
    test('Property 36: PageShell positions actions on the right in desktop', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 5 }),
                (numButtons) => {
                    const buttons = Array.from({ length: numButtons }, (_, i) => (
                        <button key={i}>Action {i + 1}</button>
                    ));

                    const { container } = render(
                        <PageShell
                            title="Page Title"
                            actions={<>{buttons}</>}
                        >
                            <div>Content</div>
                        </PageShell>
                    );

                    // Verifica container de header
                    const header = container.querySelector('.flex.flex-col.gap-4');
                    expect(header).toBeInTheDocument();

                    // Verifica classes de desktop (md:flex-row md:items-start md:justify-between)
                    const className = header?.className || '';
                    expect(className).toMatch(/md:flex-row/);
                    expect(className).toMatch(/md:items-start/);
                    expect(className).toMatch(/md:justify-between/);

                    // Verifica container de actions
                    const actionsContainer = container.querySelector('.flex.items-center.gap-2');
                    expect(actionsContainer).toBeInTheDocument();

                    // Verifica que tem os botões
                    const actionButtons = actionsContainer?.querySelectorAll('button');
                    expect(actionButtons).toHaveLength(numButtons);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: page-mobile, Property 37: Mobile stacks title and actions vertically
     * Validates: Requirements 8.3
     *
     * Para qualquer PageShell em mobile,
     * deve empilhar título e ações verticalmente
     */
    test('Property 37: PageShell stacks title and actions vertically on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                (width) => {
                    setViewport({ width, height: 667 });

                    const { container } = render(
                        <PageShell
                            title="Mobile Title"
                            actions={<button>Action</button>}
                        >
                            <div>Content</div>
                        </PageShell>
                    );

                    // Verifica classes de mobile (flex-col gap-4)
                    const header = container.querySelector('.flex.flex-col.gap-4');
                    expect(header).toBeInTheDocument();

                    // Verifica que flex-col está presente
                    expect(header?.classList.contains('flex-col')).toBe(true);
                    expect(header?.classList.contains('gap-4')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: page-spacing, Property 38: Consistent space-y-6
     * Validates: Requirements 8.4
     *
     * Para qualquer PageShell,
     * deve ter espaçamento consistente space-y-6
     */
    test('Property 38: PageShell has consistent space-y-6', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 5, maxLength: 30 }),
                (title) => {
                    const { container } = render(
                        <PageShell title={title}>
                            <div>Section 1</div>
                            <div>Section 2</div>
                            <div>Section 3</div>
                        </PageShell>
                    );

                    // Verifica main element com space-y-6
                    const main = container.querySelector('main');
                    expect(main).toBeInTheDocument();
                    expect(main?.classList.contains('space-y-6')).toBe(true);

                    // Verifica container de conteúdo com space-y-4
                    const contentContainer = main?.querySelector('.space-y-4');
                    expect(contentContainer).toBeInTheDocument();
                }
            ),
            { numRuns: 100 }
        );
    });
});
