/**
 * Property-Based Tests - DataShell
 *
 * Testes de propriedades para o componente DataShell
 * usando fast-check para validar comportamentos universais.
 */

import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { DataShell } from '@/components/shared/data-shell/data-shell';
import {
    setViewport,
    COMMON_VIEWPORTS,
} from '@/testing/helpers/responsive-test-helpers';

describe('DataShell - Property-Based Tests', () => {
    beforeEach(() => {
        setViewport(COMMON_VIEWPORTS.desktop);
    });

    /**
     * Feature: data-shell-toolbar, Property 39: Toolbar in header slot
     * Validates: Requirements 9.1
     *
     * Para qualquer DataShell com toolbar,
     * deve renderizar DataTableToolbar no topo
     */
    test('Property 39: DataShell renders toolbar in correct order', () => {
        fc.assert(
            fc.property(
                fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{4,49}$/),
                (toolbarText) => {
                    const { container } = render(
                        <DataShell
                            header={<div data-testid="toolbar">{toolbarText}</div>}
                            footer={<div data-testid="pagination">Pagination</div>}
                        >
                            <div data-testid="content">Table Content</div>
                        </DataShell>
                    );

                    // Verifica data-shell com role="region"
                    const shell = container.querySelector('[data-slot="data-shell"]');
                    expect(shell).toBeInTheDocument();
                    expect(shell?.getAttribute('role')).toBe('region');

                    // Verifica header
                    const header = container.querySelector('[data-slot="data-shell-header"]');
                    expect(header).toBeInTheDocument();
                    const toolbar = header?.querySelector('[data-testid="toolbar"]');
                    expect(toolbar).toHaveTextContent(toolbarText);

                    // Verifica ordem de renderização (header → content → footer)
                    const shellChildren = shell?.children;
                    if (shellChildren) {
                        expect(shellChildren[0].getAttribute('data-slot')).toBe('data-shell-header');
                        expect(shellChildren[1].getAttribute('data-slot')).toBe('data-shell-content');
                        expect(shellChildren[2].getAttribute('data-slot')).toBe('data-shell-footer');
                    }
                }
            ),
            { numRuns: 20 }
        );
    });

    /**
     * Feature: data-shell-pagination, Property 40: Pagination in footer slot
     * Validates: Requirements 9.2
     *
     * Para qualquer DataShell com paginação,
     * deve renderizar DataPagination no rodapé
     */
    test('Property 40: DataShell renders pagination in footer', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 100 }),
                (totalItems) => {
                    const { container } = render(
                        <DataShell
                            footer={
                                <div data-testid="pagination">
                                    Total: {totalItems} items
                                </div>
                            }
                        >
                            <div>Content</div>
                        </DataShell>
                    );

                    // Verifica footer
                    const footer = container.querySelector('[data-slot="data-shell-footer"]');
                    expect(footer).toBeInTheDocument();
                    expect(footer?.classList.contains('mt-3')).toBe(true);

                    // Verifica conteúdo da paginação
                    const pagination = footer?.querySelector('[data-testid="pagination"]');
                    expect(pagination).toHaveTextContent(`Total: ${totalItems} items`);
                }
            ),
            { numRuns: 20 }
        );
    });

    /**
     * Feature: data-shell-mobile, Property 41: Toolbar adapts to mobile
     * Validates: Requirements 9.3
     *
     * Para qualquer DataShell em mobile,
     * toolbar deve adaptar layout
     */
    test('Property 41: DataShell toolbar adapts to viewport', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                (width) => {
                    setViewport({ width, height: 667 });

                    const { container } = render(
                        <DataShell
                            header={<div data-testid="toolbar">Toolbar</div>}
                        >
                            <div>Content</div>
                        </DataShell>
                    );

                    // Verifica que data-shell mantém estrutura em mobile
                    const shell = container.querySelector('[data-slot="data-shell"]');
                    expect(shell).toBeInTheDocument();

                    // Verifica que data-shell tem classe w-full
                    expect(shell?.classList.contains('w-full')).toBe(true);

                    // Verifica header está presente
                    const header = container.querySelector('[data-slot="data-shell-header"]');
                    expect(header).toBeInTheDocument();
                }
            ),
            { numRuns: 20 }
        );
    });
});
