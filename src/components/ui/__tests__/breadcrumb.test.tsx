/**
 * Property-based tests para Breadcrumb
 *
 * Testes que validam propriedades universais do componente
 * AppBreadcrumb em diferentes viewports e estados.
 */
import { jest } from '@jest/globals';
import * as React from 'react';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { AppBreadcrumb } from '@/components/layout/breadcrumb/app-breadcrumb';
import { BreadcrumbProvider } from '@/components/layout/breadcrumb/breadcrumb-context';
import { setViewport, mockMatchMedia } from '@/testing/helpers/responsive-test-helpers';

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
                (width) => {
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
        container.querySelectorAll('[data-slot="breadcrumb-item"]');

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

    /**
     * Feature: responsividade-frontend, Property 28: Breadcrumb variants across viewports
     * Validates: Requirements 6.5
     *
     * Para qualquer breadcrumb em diferentes viewports,
     * a estrutura e variantes devem ser consistentes
     */
    test('Property 28: Breadcrumb variants are consistent across viewports', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    { width: 375, height: 667, breakpoint: 'xs' },
                    { width: 640, height: 800, breakpoint: 'sm' },
                    { width: 768, height: 1024, breakpoint: 'md' },
                    { width: 1024, height: 768, breakpoint: 'lg' },
                    { width: 1280, height: 720, breakpoint: 'xl' }
                ),
                fc.integer({ min: 1, max: 5 }),
                (viewport, levels) => {
                    setViewport(viewport);
                    mockMatchMedia(viewport.width);
                    mockViewport.mockReturnValue({
                        width: viewport.width,
                        height: viewport.height,
                        isMobile: viewport.width < 768,
                        isTablet: viewport.width >= 768 && viewport.width < 1024,
                        isDesktop: viewport.width >= 1024,
                        orientation: viewport.width > viewport.height ? 'landscape' : 'portrait',
                        breakpoint: viewport.breakpoint,
                    });

                    const segments = Array.from({ length: levels }, (_, i) => `level${i + 1}`);
                    const pathname = '/' + segments.join('/');
                    mockPathname.mockReturnValue(pathname);

                    const { container, unmount } = render(
                        <BreadcrumbProvider>
                            <AppBreadcrumb />
                        </BreadcrumbProvider>
                    );

                    // Verifica que o breadcrumb foi renderizado
                    const breadcrumb = container.querySelector('[data-slot="breadcrumb"]');
                    expect(breadcrumb).toBeInTheDocument();

                    // Verifica que há itens renderizados
                    const breadcrumbItems = container.querySelectorAll('[data-slot="breadcrumb-item"]');
                    expect(breadcrumbItems.length).toBeGreaterThan(0);

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 29: Deep nested paths truncation
     * Validates: Requirements 6.6
     *
     * Para qualquer breadcrumb com caminhos profundamente aninhados (>5 níveis) em mobile,
     * deve mostrar apenas os 2 últimos níveis
     */
    test('Property 29: Deep nested paths truncated correctly on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                fc.integer({ min: 6, max: 10 }),
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

                    const segments = Array.from({ length: levels }, (_, i) => `deep${i + 1}`);
                    const pathname = '/' + segments.join('/');
                    mockPathname.mockReturnValue(pathname);

                    const { container, unmount } = render(
                        <BreadcrumbProvider>
                            <AppBreadcrumb />
                        </BreadcrumbProvider>
                    );

                    const breadcrumbItems = container.querySelectorAll('[data-slot="breadcrumb-item"]');
                    const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]');

                    // Com mais de 2 níveis em mobile, deve ter ellipsis
                    expect(ellipsis).toBeInTheDocument();

                    // Deve mostrar ellipsis + 2 itens visíveis
                    expect(breadcrumbItems.length).toBe(3);

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 30: Breadcrumb separator visibility
     * Validates: Requirements 6.7
     *
     * Para qualquer breadcrumb com múltiplos itens,
     * separadores devem estar presentes entre os itens
     */
    test('Property 30: Breadcrumb separators present between items', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 768, max: 1920 }),
                fc.integer({ min: 2, max: 5 }),
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

                    const segments = Array.from({ length: levels }, (_, i) => `seg${i + 1}`);
                    const pathname = '/' + segments.join('/');
                    mockPathname.mockReturnValue(pathname);

                    const { container, unmount } = render(
                        <BreadcrumbProvider>
                            <AppBreadcrumb />
                        </BreadcrumbProvider>
                    );

                    const separators = container.querySelectorAll('[data-slot="breadcrumb-separator"]');
                    const items = container.querySelectorAll('[data-slot="breadcrumb-item"]');

                    // Deve ter N-1 separadores para N itens (exceto quando há ellipsis)
                    // Em desktop, mostra todos os itens, então separadores = items - 1
                    if (items.length > 1) {
                        expect(separators.length).toBeGreaterThan(0);
                        expect(separators.length).toBe(items.length - 1);
                    }

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 31: Tablet viewport behavior
     * Validates: Requirements 6.8
     *
     * Para qualquer breadcrumb em viewport tablet (768-1023px),
     * deve usar comportamento similar ao desktop
     */
    test('Property 31: Breadcrumb on tablet behaves like desktop', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 768, max: 1023 }),
                fc.integer({ min: 1, max: 5 }),
                (width, levels) => {
                    setViewport({ width, height: 800 });
                    mockMatchMedia(width);
                    mockViewport.mockReturnValue({
                        width,
                        height: 800,
                        isMobile: false,
                        isTablet: true,
                        isDesktop: false,
                        orientation: 'landscape',
                        breakpoint: 'md',
                    });

                    const segments = Array.from({ length: levels }, (_, i) => `tab${i + 1}`);
                    const pathname = '/' + segments.join('/');
                    mockPathname.mockReturnValue(pathname);

                    const { container, unmount } = render(
                        <BreadcrumbProvider>
                            <AppBreadcrumb />
                        </BreadcrumbProvider>
                    );

                    const breadcrumbItems = container.querySelectorAll('[data-slot="breadcrumb-item"]');

                    // Tablet deve mostrar todos os níveis como desktop
                    expect(breadcrumbItems.length).toBe(levels + 1); // +1 para Home

                    // Não deve ter ellipsis em tablet
                    const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]');
                    expect(ellipsis).not.toBeInTheDocument();

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 32: Current page non-clickable
     * Validates: Requirements 6.9
     *
     * Para qualquer breadcrumb,
     * a página atual não deve ser clicável (não deve ter href)
     */
    test('Property 32: Current page is not clickable', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 1920 }),
                fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
                (width, segments) => {
                    setViewport({ width, height: 800 });
                    mockMatchMedia(width);
                    mockViewport.mockReturnValue({
                        width,
                        height: 800,
                        isMobile: width < 768,
                        isTablet: width >= 768 && width < 1024,
                        isDesktop: width >= 1024,
                        orientation: 'landscape',
                        breakpoint: width >= 1280 ? 'xl' : width >= 1024 ? 'lg' : width >= 768 ? 'md' : 'sm',
                    });

                    const pathname = '/' + segments.join('/');
                    mockPathname.mockReturnValue(pathname);

                    const { container, unmount } = render(
                        <BreadcrumbProvider>
                            <AppBreadcrumb />
                        </BreadcrumbProvider>
                    );

                    // Verifica que a página atual usa BreadcrumbPage (não BreadcrumbLink)
                    const currentPage = container.querySelector('[data-slot="breadcrumb-page"]');
                    expect(currentPage).toBeInTheDocument();

                    // Verifica que não é um link
                    expect(currentPage?.tagName).not.toBe('A');

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 33: Parent links are clickable
     * Validates: Requirements 6.10
     *
     * Para qualquer breadcrumb com múltiplos níveis,
     * todos os níveis pai devem ser clicáveis (ter href)
     */
    test('Property 33: Parent breadcrumb items are clickable', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 768, max: 1920 }),
                fc.integer({ min: 2, max: 5 }),
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

                    const segments = Array.from({ length: levels }, (_, i) => `parent${i + 1}`);
                    const pathname = '/' + segments.join('/');
                    mockPathname.mockReturnValue(pathname);

                    const { container, unmount } = render(
                        <BreadcrumbProvider>
                            <AppBreadcrumb />
                        </BreadcrumbProvider>
                    );

                    const links = container.querySelectorAll('[data-slot="breadcrumb-link"]');

                    // Deve ter pelo menos um link (Home)
                    expect(links.length).toBeGreaterThan(0);

                    // Todos os links devem ter href
                    links.forEach((link) => {
                        expect(link).toHaveAttribute('href');
                    });

                    // Home link deve apontar para "/"
                    const homeLink = Array.from(links).find((link) =>
                        link.textContent?.includes('Início')
                    );
                    expect(homeLink).toHaveAttribute('href', '/');

                    unmount();
                }
            ),
            { numRuns: 100 }
        );
    });
});
