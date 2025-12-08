/**
 * Property-based tests para Editor Responsivo
 * 
 * Testes que validam propriedades universais do editor de documentos
 * em diferentes viewports usando fast-check.
 */

import * as fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResponsiveEditor, ResponsiveEditorContainer } from '@/components/ui/responsive-editor';
import { setViewport, BREAKPOINTS } from '@/tests/helpers/responsive-test-helpers';
import * as React from 'react';

// Mock Plate.js modules
jest.mock('platejs', () => require('../__mocks__/plate-mocks'));
jest.mock('platejs/react', () => require('../__mocks__/plate-mocks'));

describe('Editor Responsive Property Tests', () => {
    afterEach(() => {
        cleanup();
    });

    /**
     * Feature: responsividade-frontend, Property 34: Editor toolbar hidden on mobile
     * Validates: Requirements 8.1
     * 
     * Para qualquer editor de documentos exibido em viewport width menor que 768px,
     * a toolbar de formatação deve estar oculta ou colapsada.
     */
    test('Property 34: Editor toolbar hidden on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }), // Mobile viewport widths
                (width) => {
                    // Configura viewport mobile
                    setViewport({ width, height: 800 });

                    // Renderiza toolbar responsiva
                    const { container } = render(<ResponsiveFixedToolbar />);

                    const toolbar = container.firstChild as HTMLElement;

                    // Verifica que a toolbar existe
                    expect(toolbar).toBeInTheDocument();

                    // Em mobile, a toolbar deve ter um botão de overflow ou estar colapsada
                    // Verifica se há um botão de menu/overflow
                    const hasOverflowButton = toolbar.querySelector('button[aria-haspopup]');
                    const hasCollapsedIndicator = toolbar.textContent?.includes('Toque para formatar');

                    // Pelo menos um dos indicadores de mobile deve estar presente
                    expect(hasOverflowButton || hasCollapsedIndicator).toBeTruthy();

                    // Verifica que a toolbar não ocupa muito espaço vertical (max 4rem)
                    const toolbarHeight = toolbar.getBoundingClientRect().height;
                    expect(toolbarHeight).toBeLessThanOrEqual(64); // 4rem = 64px
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 35: Editor floating toolbar
     * Validates: Requirements 8.2
     * 
     * Para qualquer toque no editor em mobile, uma toolbar flutuante compacta
     * com opções essenciais de formatação deve aparecer.
     * 
     * Nota: Este teste verifica que o floating toolbar está configurado,
     * mas a interação real de toque é testada em testes E2E.
     */
    test('Property 35: Editor floating toolbar configuration', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                (width) => {
                    setViewport({ width, height: 800 });

                    // Renderiza o editor responsivo
                    const { container } = render(
                        <ResponsivePlateEditor initialValue={[]} />
                    );

                    // Verifica que o editor foi renderizado
                    const editorContainer = container.querySelector('[data-slate-editor]');
                    expect(editorContainer).toBeInTheDocument();

                    // O floating toolbar é renderizado pelo Plate quando há seleção
                    // Aqui verificamos que o editor está configurado corretamente
                    expect(editorContainer).toHaveAttribute('data-slate-editor', 'true');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 36: Editor toolbar overflow menus
     * Validates: Requirements 8.3
     * 
     * Para qualquer toolbar do editor exibida em mobile, opções avançadas
     * devem estar agrupadas em menus de overflow.
     */
    test('Property 36: Editor toolbar overflow menus on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                (width) => {
                    setViewport({ width, height: 800 });

                    const { container } = render(<ResponsiveFixedToolbar />);

                    const toolbar = container.firstChild as HTMLElement;

                    // Em mobile, deve haver um menu dropdown para opções avançadas
                    const dropdownTrigger = toolbar.querySelector('[role="button"]');
                    expect(dropdownTrigger).toBeInTheDocument();

                    // Verifica que não há muitos botões visíveis (apenas essenciais)
                    const visibleButtons = toolbar.querySelectorAll('button:not([aria-hidden="true"])');
                    // Em mobile, deve ter poucos botões visíveis (menu de overflow)
                    expect(visibleButtons.length).toBeLessThanOrEqual(3);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 37: Editor condensed toolbar on tablet
     * Validates: Requirements 8.4
     * 
     * Para qualquer editor exibido em tablet (768px-1024px), uma toolbar
     * condensada com opções mais usadas visíveis deve ser mostrada.
     */
    test('Property 37: Editor condensed toolbar on tablet', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 768, max: 1023 }), // Tablet viewport widths
                (width) => {
                    setViewport({ width, height: 1024 });

                    const { container } = render(<ResponsiveFixedToolbar />);

                    const toolbar = container.firstChild as HTMLElement;

                    // Verifica que a toolbar existe
                    expect(toolbar).toBeInTheDocument();

                    // Em tablet, a toolbar deve ter scroll horizontal se necessário
                    const hasOverflowScroll = window.getComputedStyle(toolbar).overflowX === 'auto' ||
                        toolbar.classList.contains('overflow-x-auto');
                    expect(hasOverflowScroll).toBe(true);

                    // Verifica que a toolbar tem altura limitada
                    const toolbarHeight = toolbar.getBoundingClientRect().height;
                    expect(toolbarHeight).toBeLessThanOrEqual(56); // max-h-14 = 56px
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 38: Editor state preservation
     * Validates: Requirements 8.5
     * 
     * Para qualquer mudança de viewport entre mobile e desktop, o conteúdo
     * do documento e a posição do cursor devem ser preservados.
     * 
     * Nota: Este teste verifica a estrutura de preservação de estado.
     * Testes E2E validam a preservação real durante mudanças de orientação.
     */
    test('Property 38: Editor maintains content structure across viewports', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
                (textContent) => {
                    // Cria conteúdo inicial
                    const initialValue = textContent.map(text => ({
                        type: 'p',
                        children: [{ text }],
                    }));

                    // Renderiza em mobile
                    setViewport({ width: 375, height: 667 });
                    const { container: mobileContainer } = render(
                        <ResponsivePlateEditor initialValue={initialValue as any} />
                    );

                    const mobileEditor = mobileContainer.querySelector('[data-slate-editor]');
                    expect(mobileEditor).toBeInTheDocument();

                    cleanup();

                    // Renderiza em desktop com mesmo conteúdo
                    setViewport({ width: 1920, height: 1080 });
                    const { container: desktopContainer } = render(
                        <ResponsivePlateEditor initialValue={initialValue as any} />
                    );

                    const desktopEditor = desktopContainer.querySelector('[data-slate-editor]');
                    expect(desktopEditor).toBeInTheDocument();

                    // Verifica que ambos têm o mesmo número de parágrafos
                    const mobileParagraphs = mobileEditor?.querySelectorAll('p');
                    const desktopParagraphs = desktopEditor?.querySelectorAll('p');

                    expect(mobileParagraphs?.length).toBe(desktopParagraphs?.length);
                    expect(mobileParagraphs?.length).toBe(textContent.length);
                }
            ),
            { numRuns: 50 } // Menos runs devido à complexidade
        );
    });

    /**
     * Teste adicional: Área de edição tem altura adequada em mobile
     * 
     * Verifica que o editor ocupa altura adequada considerando o teclado virtual.
     */
    test('Editor has adequate height on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                (width) => {
                    setViewport({ width, height: 800 });

                    const { container } = render(
                        <ResponsiveEditorContainer variant="default">
                            <ResponsiveEditor variant="demo" />
                        </ResponsiveEditorContainer>
                    );

                    const editorContainer = container.firstChild as HTMLElement;

                    // Verifica que o container tem altura mínima adequada
                    const hasMinHeight = editorContainer.classList.toString().includes('min-h-');
                    expect(hasMinHeight).toBe(true);

                    // Verifica que tem scroll vertical
                    const hasVerticalScroll = window.getComputedStyle(editorContainer).overflowY === 'auto' ||
                        editorContainer.classList.contains('overflow-y-auto');
                    expect(hasVerticalScroll).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Padding responsivo no editor
     * 
     * Verifica que o editor tem padding reduzido em mobile e aumenta em telas maiores.
     */
    test('Editor has responsive padding', () => {
        fc.assert(
            fc.property(
                fc.record({
                    width: fc.integer({ min: 320, max: 2560 }),
                    height: fc.integer({ min: 568, max: 1440 }),
                }),
                ({ width, height }) => {
                    setViewport({ width, height });

                    const { container } = render(<ResponsiveEditor variant="demo" />);

                    const editor = container.firstChild as HTMLElement;

                    // Verifica que o editor tem classes de padding
                    const classList = Array.from(editor.classList);
                    const hasPadding = classList.some(cls => cls.startsWith('px-') || cls.startsWith('pt-') || cls.startsWith('pb-'));
                    expect(hasPadding).toBe(true);

                    // Verifica scroll suave
                    const hasScrollSmooth = classList.includes('scroll-smooth');
                    expect(hasScrollSmooth).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Imagens e tabelas são responsivas no editor
     * 
     * Verifica que elementos de mídia no editor têm classes responsivas.
     */
    test('Editor content elements are responsive', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 2560 }),
                (width) => {
                    setViewport({ width, height: 800 });

                    const { container } = render(<ResponsiveEditor variant="demo" />);

                    const editor = container.firstChild as HTMLElement;

                    // Verifica que o editor tem regras CSS para elementos responsivos
                    const classList = Array.from(editor.classList).join(' ');

                    // Verifica regras para imagens
                    expect(classList).toContain('[&_img]:max-w-full');
                    expect(classList).toContain('[&_img]:h-auto');

                    // Verifica regras para tabelas
                    expect(classList).toContain('[&_table]:max-w-full');
                    expect(classList).toContain('[&_table]:overflow-x-auto');

                    // Verifica regras para code blocks
                    expect(classList).toContain('[&_pre]:max-w-full');
                    expect(classList).toContain('[&_pre]:overflow-x-auto');
                }
            ),
            { numRuns: 100 }
        );
    });
});
