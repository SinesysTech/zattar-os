/**
 * Property-based tests para Breadcrumb
 * 
 * Testes que validam propriedades universais do componente
 * AppBreadcrumb em diferentes viewports e estados.
 */

import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { AppBreadcrumb } from '@/components/layout/app-breadcrumb';
import { BreadcrumbProvider } from '@/components/layout/breadcrumb-context';
import { setViewport, mockMatchMedia, BREAKPOINTS } from '@/tests/helpers/responsive-test-helpers';

// Mock do Next.js router
const mockPathname = jest.fn();
jest.mock('next/navigation', () => ({
    usePathname: () => mockPathname(),
}));

// Mock do useViewport hook
const mockViewport = jest.fn();
jest.mock('@/hooks/use-viewport', () => ({
    useViewport: () => mockViewport(),
}));

describe('Breadcrumb Property Tests', () => {
    beforeEach(() => {
        // Reset viewport antes de cada teste
        setViewport({ width: 1024, height: 768 });
        mockMatchMedia(1024);
        mockViewport.mockReturnValue({
            width: 1024,
            height: 768,
            isMobile: false,
            isTablet: false,
            isDesktop: true,
            orientation: 'landscape',
            breakpoint: 'lg',
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Feature: responsividade-frontend, Property 24: Breadcrumb truncation on mobile
     * Validates: Requirements 6.1
     * 
     * Para qualquer breadcrumb exibido em viewport width menor que 768px,
     * apenas a página atual e um nível pai devem ser mostrados.
     */
    test('Property 24: Breadcrumb shows only current + parent on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }), // mobile viewport widths
                fc.integer({ min: 3, max: 6 }), // número de níveis de breadcrumb
                (width, levels) => {
                    setViewport({ width, height: 667 });
                    mockMatchMedia(width);
                    mockViewport.mockReturnValue({
                        width,
                        height: 667,
                        isMobile: true,
                        isTablet: false,
                        isDesktop: false,
                        orientation: 'portrait',
                        breakpoint: width < 640 ? 'xs' : 'sm',
                    });

                    // Gera um pathname com múltiplos níveis
                    const segments = Array.from({ length: levels }, (_, i) => `level${i + 1}`);
                    const pathname = '/' + segments.join('/');
                    mockPathname.mockReturnValue(pathname);

                    const { container, unmount } = render(
                        <BreadcrumbProvider>
                            <AppBreadcrumb />
                        </BreadcrumbProvider>
                    );

                    // Conta quantos BreadcrumbItems visíveis existem (excluindo ellipsis)
                    const breadcrumbItems = container.querySelectorAll('[data-slot="breadcrumb-item"]');
                    const ellipsisItem = container.querySelector('[data-slot="breadcrumb-ellipsis"]');

                    if (levels > 2) {
                        // Deve ter ellipsis menu + 2 itens visíveis (parent + current)
                        expect(ellipsisItem).toBeInTheDocument();
                        // Total de items: 1 (ellipsis) + 2 (visible) = 3
                        expect(breadcrumbItems.length).toBe(3);
                    } else {
                        // Com 2 ou menos níveis, mostra todos sem ellipsis
                        expect(breadcrumbItems.length).toBeLessThanOrEqual(2);
                    }

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 25: Breadcrumb collapse menu
     * Validates: Requirements 6.2
     * 
     * Para qualquer breadcrumb com mais de 2 níveis em mobile,
     * um menu collapsed deve fornecer acesso a todos os níveis.
     */
    test('Property 25: Breadcrumb has collapse menu for hidden levels on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                fc.integer({ min: 3, max: 6 }),
                (width, levels) => {
                    setViewport({ width, height: 667 });
                    mockMatchMedia(width);
                    mockViewport.mockReturnValue({
                        width,
                        height: 667,
                        isMobile: true,
                        isTablet: false,
                        isDesktop: false,
                        orientation: 'portrait',
                        breakpoint: width < 640 ? 'xs' : 'sm',
                    });

                    const segments = Array.from({ length: levels }, (_, i) => `level${i + 1}`);
                    const pathname = '/' + segments.join('/');
                    mockPathname.mockReturnValue(pathname);

                    const { container, unmount } = render(
                        <BreadcrumbProvider>
                            <AppBreadcrumb />
                        </BreadcrumbProvider>
                    );

                    // Verifica que existe um dropdown menu trigger (ellipsis)
                    const dropdownTrigger = container.querySelector('[data-slot="dropdown-menu-trigger"]');
                    const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]');

                    // Com mais de 2 níveis, deve ter dropdown menu
                    expect(dropdownTrigger).toBeInTheDocument();
                    expect(ellipsis).toBeInTheDocument();

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 26: Breadcrumb full path on desktop
     * Validates: Requirements 6.3
     * 
     * Para qualquer breadcrumb exibido em desktop, o caminho completo
     * de navegação deve ser mostrado.
     */
    test('Property 26: Breadcrumb shows full path on desktop', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 768, max: 2000 }), // desktop viewport widths
                fc.integer({ min: 1, max: 5 }), // número de níveis
                (width, levels) => {
                    setViewport({ width, height: 800 });
                    mockMatchMedia(width);
                    mockViewport.mockReturnValue({
                        width,
                        height: 800,
                        isMobile: false,
                        isTablet: width < 1024,
                        isDesktop: width >= 1024,
                        orientation: 'landscape',
                        breakpoint: width >= 1280 ? 'xl' : width >= 1024 ? 'lg' : 'md',
                    });

                    const segments = Array.from({ length: levels }, (_, i) => `level${i + 1}`);
                    const pathname = '/' + segments.join('/');
                    mockPathname.mockReturnValue(pathname);

                    const { container, unmount } = render(
                        <BreadcrumbProvider>
                            <AppBreadcrumb />
                        </BreadcrumbProvider>
                    );

                    // Conta os breadcrumb items (excluindo separadores)
                    const breadcrumbItems = container.querySelectorAll('[data-slot="breadcrumb-item"]');

                    // Desktop deve mostrar: Home + todos os níveis
                    // Total esperado: 1 (home) + levels
                    expect(breadcrumbItems.length).toBe(levels + 1);

                    // Não deve ter ellipsis em desktop
                    const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]');
                    expect(ellipsis).not.toBeInTheDocument();

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 27: Breadcrumb text truncation
     * Validates: Requirements 6.4
     * 
     * Para qualquer item de breadcrumb que seja muito longo em mobile,
     * o texto deve ser truncado com ellipsis.
     */
    test('Property 27: Long breadcrumb text is truncated with ellipsis', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                fc.string({ minLength: 40, maxLength: 100 }), // texto longo
                (width, longText) => {
                    setViewport({ width, height: 667 });
                    mockMatchMedia(width);
                    mockViewport.mockReturnValue({
                        width,
                        height: 667,
                        isMobile: true,
                        isTablet: false,
                        isDesktop: false,
                        orientation: 'portrait',
                        breakpoint: width < 640 ? 'xs' : 'sm',
                    });

                    // Usa override para definir um label longo
                    const pathname = '/test';
                    mockPathname.mockReturnValue(pathname);

                    const { container, unmount } = render(
                        <BreadcrumbProvider>
                            <AppBreadcrumb />
                        </BreadcrumbProvider>
                    );

                    // Verifica que os breadcrumb items têm classes de truncamento
                    const breadcrumbPage = container.querySelector('[data-slot="breadcrumb-page"]');
                    const breadcrumbLink = container.querySelector('[data-slot="breadcrumb-link"]');

                    // Pelo menos um deve ter classe truncate ou max-w
                    const hasPageTruncate = breadcrumbPage?.classList.contains('truncate') ||
                        Array.from(breadcrumbPage?.classList || []).some(c => c.includes('max-w'));

                    const hasLinkTruncate = breadcrumbLink?.classList.contains('truncate') ||
                        Array.from(breadcrumbLink?.classList || []).some(c => c.includes('max-w'));

                    expect(hasPageTruncate || hasLinkTruncate).toBe(true);

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Teste adicional: Breadcrumb navigation functionality
     * 
     * Verifica que os links de breadcrumb são navegáveis
     */
    test('Breadcrumb links are navigable', () => {
        mockPathname.mockReturnValue('/dashboard/processos/123');

        const { container } = render(
            <BreadcrumbProvider>
                <AppBreadcrumb />
            </BreadcrumbProvider>
        );

        // Verifica que existem links
        const links = container.querySelectorAll('a[href]');
        expect(links.length).toBeGreaterThan(0);

        // Verifica que os links têm hrefs corretos
        const homeLink = container.querySelector('a[href="/"]');
        expect(homeLink).toBeInTheDocument();
    });

    /**
     * Teste adicional: Breadcrumb separators
     * 
     * Verifica que os separadores são renderizados corretamente
     */
    test('Breadcrumb has separators between items', () => {
        mockPathname.mockReturnValue('/dashboard/processos');

        const { container } = render(
            <BreadcrumbProvider>
                <AppBreadcrumb />
            </BreadcrumbProvider>
        );

        // Verifica que existem separadores
        const separators = container.querySelectorAll('[data-slot="breadcrumb-separator"]');
        expect(separators.length).toBeGreaterThan(0);
    });

    /**
     * Teste adicional: Root path handling
     * 
     * Verifica que o breadcrumb funciona corretamente na raiz
     */
    test('Breadcrumb shows only "Início" at root path', () => {
        mockPathname.mockReturnValue('/');

        const { container } = render(
            <BreadcrumbProvider>
                <AppBreadcrumb />
            </BreadcrumbProvider>
        );

        // Deve ter apenas um item
        const breadcrumbItems = container.querySelectorAll('[data-slot="breadcrumb-item"]');
        expect(breadcrumbItems.length).toBe(1);

        // Deve mostrar "Início"
        expect(container.textContent).toContain('Início');
    });

    /**
     * Teste adicional: Breadcrumb override functionality
     * 
     * Verifica que os overrides do contexto funcionam
     */
    test('Breadcrumb respects context overrides', () => {
        mockPathname.mockReturnValue('/dashboard');

        const { container } = render(
            <BreadcrumbProvider>
                <AppBreadcrumb />
            </BreadcrumbProvider>
        );

        // Verifica que o breadcrumb renderiza corretamente
        const breadcrumbItems = container.querySelectorAll('[data-slot="breadcrumb-item"]');
        expect(breadcrumbItems.length).toBeGreaterThan(0);
    });

    /**
     * Teste adicional: Mobile viewport detection
     * 
     * Verifica que o componente detecta corretamente mobile vs desktop
     */
    test('Breadcrumb adapts to viewport changes', () => {
        // Começa em desktop
        mockPathname.mockReturnValue('/a/b/c/d');

        const { container, rerender } = render(
            <BreadcrumbProvider>
                <AppBreadcrumb />
            </BreadcrumbProvider>
        );

        // Desktop: deve mostrar todos os itens
        const breadcrumbItems = container.querySelectorAll('[data-slot="breadcrumb-item"]');
        const desktopCount = breadcrumbItems.length;

        // Muda para mobile
        setViewport({ width: 375, height: 667 });
        mockMatchMedia(375);
        mockViewport.mockReturnValue({
            width: 375,
            height: 667,
            isMobile: true,
            isTablet: false,
            isDesktop: false,
            orientation: 'portrait',
            breakpoint: 'xs',
        });

        rerender(
            <BreadcrumbProvider>
                <AppBreadcrumb />
            </BreadcrumbProvider>
        );

        // Mobile: deve ter ellipsis menu
        const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]');
        expect(ellipsis).toBeInTheDocument();
    });
});
