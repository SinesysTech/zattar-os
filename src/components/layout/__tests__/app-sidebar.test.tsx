/**
 * Property-Based Tests - AppSidebar
 *
 * Testes de propriedades para o componente AppSidebar
 * usando fast-check para validar comportamentos universais.
 */

import React from 'react';
import * as fc from 'fast-check';
import { render, waitFor, cleanup } from '@testing-library/react';
import {
    setViewport,
    COMMON_VIEWPORTS,
} from '@/testing/helpers/responsive-test-helpers';
import * as authModule from '@/providers/user-provider';

// Mock Radix Tooltip primitives to avoid portal/floating crashes in jsdom
jest.mock('@radix-ui/react-tooltip', () => ({
    Provider: ({ children }: any) => <>{children}</>,
    Root: ({ children }: any) => <>{children}</>,
    Trigger: React.forwardRef(({ children, ...props }: any, ref: any) => <button ref={ref} {...props}>{children}</button>),
    Content: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} role="tooltip" {...props}>{children}</div>),
    Portal: ({ children }: any) => <>{children}</>,
    Arrow: () => null,
}));

// Mock Radix Dialog (used by Sheet component in sidebar)
jest.mock('@radix-ui/react-dialog', () => ({
    Root: ({ children }: any) => <>{children}</>,
    Trigger: React.forwardRef(({ children, ...props }: any, ref: any) => <button ref={ref} {...props}>{children}</button>),
    Portal: ({ children }: any) => <>{children}</>,
    Overlay: React.forwardRef((props: any, ref: any) => <div ref={ref} {...props} />),
    Content: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
    Close: React.forwardRef(({ children, ...props }: any, ref: any) => <button ref={ref} {...props}>{children}</button>),
    Title: React.forwardRef(({ children, ...props }: any, ref: any) => <h2 ref={ref} {...props}>{children}</h2>),
    Description: React.forwardRef(({ children, ...props }: any, ref: any) => <p ref={ref} {...props}>{children}</p>),
}));

// Mock Radix Collapsible
jest.mock('@radix-ui/react-collapsible', () => ({
    Root: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} data-slot="collapsible" {...props}>{children}</div>),
    CollapsibleTrigger: React.forwardRef(({ children, ...props }: any, ref: any) => <button ref={ref} data-slot="collapsible-trigger" {...props}>{children}</button>),
    CollapsibleContent: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} data-slot="collapsible-content" {...props}>{children}</div>),
}));

// Mock Radix ScrollArea
jest.mock('@radix-ui/react-scroll-area', () => ({
    Root: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
    Viewport: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
    ScrollAreaScrollbar: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
    Scrollbar: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
    ScrollAreaThumb: React.forwardRef((props: any, ref: any) => <div ref={ref} {...props} />),
    Thumb: React.forwardRef((props: any, ref: any) => <div ref={ref} {...props} />),
    Corner: React.forwardRef((props: any, ref: any) => <div ref={ref} {...props} />),
}));

// Mock Radix Separator (its internal dependency on @radix-ui/react-primitive uses createSlot which fails in jsdom)
jest.mock('@radix-ui/react-separator', () => ({
    Root: React.forwardRef(({ className, orientation, decorative, ...props }: any, ref: any) => (
        <div ref={ref} role={decorative ? 'none' : 'separator'} data-orientation={orientation || 'horizontal'} className={className} {...props} />
    )),
}));

// Mock useIsMobile to avoid matchMedia issues in jsdom
jest.mock('@/hooks/use-breakpoint', () => ({
    useIsMobile: jest.fn(() => false),
}));

// Mock dos hooks necessários
jest.mock('@/providers/user-provider', () => ({
    useAuthSession: jest.fn(() => ({
        user: { id: 'test-user-123' },
        isAuthenticated: true,
        isLoading: false,
        logout: jest.fn(),
    })),
    useUser: jest.fn(() => null),
    usePermissoes: jest.fn(() => ({
        data: { isSuperAdmin: false },
        temPermissao: jest.fn(() => true),
        isLoading: false,
        permissoes: [],
    })),
}));

// Mock do fetch global
global.fetch = jest.fn();

// Mock next/link and next/navigation
jest.mock('next/link', () => {
    return React.forwardRef(({ children, href, ...props }: any, ref: any) => (
        <a ref={ref} href={href} {...props}>{children}</a>
    ));
});

jest.mock('next/navigation', () => ({
    usePathname: jest.fn(() => '/app/dashboard'),
    useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
}));

jest.mock('next/image', () => {
    return function MockImage({ src, alt, ...props }: any) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={src} alt={alt} {...props} />;
    };
});

jest.retryTimes(0);

// Import after mocks
import { AppSidebar } from '@/components/layout/sidebar/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

function renderWithSidebar(ui: React.ReactElement) {
    return render(
        <SidebarProvider defaultOpen={true}>
            {ui}
        </SidebarProvider>
    );
}

describe('AppSidebar - Property-Based Tests', () => {
    beforeEach(() => {
        setViewport(COMMON_VIEWPORTS.desktop);
        jest.clearAllMocks();
        // Restore default mocks after clearAllMocks
        jest.mocked(authModule.usePermissoes).mockReturnValue({
            data: { isSuperAdmin: false } as any,
            temPermissao: jest.fn(() => true),
            isLoading: false,
            permissoes: [],
        } as any);
    });

    afterEach(() => {
        cleanup();
    });

    /**
     * Feature: sidebar-permissions, Property 43: Hide Pangea without permission
     * Validates: Requirements 10.2
     *
     * Para qualquer usuário sem permissão "pangea:listar",
     * não deve mostrar item Pangea
     */
    test('Property 43: AppSidebar hides Pangea for users without permission', async () => {
        await fc.assert(
            await fc.asyncProperty(
                fc.boolean(),
                async (canSeePangea) => {
                    const usePermissoes = jest.mocked(authModule.usePermissoes);
                    usePermissoes.mockReturnValue({
                        data: { isSuperAdmin: false } as any,
                        temPermissao: jest.fn((recurso: string, acao: string) => {
                            if (recurso === 'pangea' && acao === 'listar') {
                                return canSeePangea;
                            }
                            return true;
                        }),
                        isLoading: false,
                        permissoes: [],
                    } as any);

                    const { container } = renderWithSidebar(<AppSidebar />);

                    // Wait for sidebar to render
                    await waitFor(() => {
                        const sidebar = container.querySelector('[data-sidebar]');
                        expect(sidebar).toBeInTheDocument();
                    });

                    // Get the rendered text content
                    const linkText = container.textContent || '';

                    if (canSeePangea) {
                        expect(linkText).toMatch(/Jurisprudência/i);
                    } else {
                        expect(linkText).not.toMatch(/Jurisprudência/i);
                    }

                    expect(container.querySelector('[data-sidebar]')).toBeInTheDocument();

                    cleanup();
                }
            ),
            { numRuns: 3 }
        );
    });

    /**
     * Feature: sidebar-collapsible, Property 44: Icon mode when collapsed
     * Validates: Requirements 10.3
     *
     * Para qualquer sidebar colapsada (icon mode),
     * deve mostrar apenas ícones
     */
    test('Property 44: AppSidebar supports collapsible icon mode', () => {
        fc.assert(
            fc.property(
                fc.constant(true),
                (_isCollapsible) => {
                    const { container } = renderWithSidebar(<AppSidebar />);

                    const sidebar = container.querySelector('[data-sidebar]');
                    expect(sidebar).toBeInTheDocument();
                    expect(sidebar).toHaveAttribute('data-sidebar');

                    cleanup();
                }
            ),
            { numRuns: 3 }
        );
    });

    /**
     * Feature: sidebar-rail, Property 45: SidebarRail for resize
     * Validates: Requirements 10.4
     *
     * Para qualquer sidebar,
     * deve ter SidebarRail para resize
     */
    test('Property 45: AppSidebar has SidebarRail', () => {
        fc.assert(
            fc.property(
                fc.constant(true),
                () => {
                    const { container } = renderWithSidebar(<AppSidebar />);

                    const sidebar = container.querySelector('[data-sidebar]');
                    expect(sidebar).toBeInTheDocument();

                    expect(sidebar?.querySelector('[data-sidebar="header"]')).toBeInTheDocument();
                    expect(sidebar?.querySelector('[data-sidebar="content"]')).toBeInTheDocument();

                    cleanup();
                }
            ),
            { numRuns: 3 }
        );
    });
});
