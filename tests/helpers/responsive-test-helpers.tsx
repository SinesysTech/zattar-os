/**
 * Helpers para testes de responsividade
 * 
 * Utilitários para testar componentes em diferentes viewports
 * e validar comportamentos responsivos.
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Configuração de viewport para testes
 */
export interface ViewportConfig {
    width: number;
    height: number;
}

/**
 * Breakpoints padrão do Tailwind CSS
 */
export const BREAKPOINTS = {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

/**
 * Viewports comuns para testes
 */
export const COMMON_VIEWPORTS = {
    mobile: { width: 375, height: 667 },
    mobileLarge: { width: 414, height: 896 },
    tablet: { width: 768, height: 1024 },
    tabletLandscape: { width: 1024, height: 768 },
    desktop: { width: 1280, height: 720 },
    desktopLarge: { width: 1920, height: 1080 },
} as const;

/**
 * Configura o viewport do window para testes
 */
export function setViewport(config: ViewportConfig): void {
    Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: config.width,
    });

    Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: config.height,
    });

    // Dispara evento de resize
    window.dispatchEvent(new Event('resize'));
}

/**
 * Renderiza um componente com viewport específico
 */
export function renderWithViewport(
    ui: ReactElement,
    viewport: ViewportConfig,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    setViewport(viewport);
    return render(ui, options);
}

/**
 * Obtém o número de colunas de um grid computado
 */
export function getComputedColumns(container: HTMLElement): number {
    const gridElement = container.querySelector('[style*="grid-template-columns"]')
        || container.querySelector('.grid');

    if (!gridElement) {
        return 0;
    }

    const computedStyle = window.getComputedStyle(gridElement);
    const gridTemplateColumns = computedStyle.gridTemplateColumns;

    if (!gridTemplateColumns || gridTemplateColumns === 'none') {
        return 0;
    }

    // Conta o número de valores no grid-template-columns
    return gridTemplateColumns.split(' ').filter(Boolean).length;
}

/**
 * Verifica se um elemento tem touch target adequado (min 44x44px)
 */
export function hasSufficientTouchTarget(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
}

/**
 * Obtém o tamanho do touch target de um elemento
 */
export function getTouchTargetSize(element: HTMLElement): { width: number; height: number } {
    const rect = element.getBoundingClientRect();
    return {
        width: rect.width,
        height: rect.height,
    };
}

/**
 * Verifica se um elemento está visível no viewport
 */
export function isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
    );
}

/**
 * Verifica se um elemento tem scroll horizontal
 */
export function hasHorizontalScroll(element: HTMLElement): boolean {
    return element.scrollWidth > element.clientWidth;
}

/**
 * Verifica se um elemento tem scroll vertical
 */
export function hasVerticalScroll(element: HTMLElement): boolean {
    return element.scrollHeight > element.clientHeight;
}

/**
 * Simula mudança de orientação do dispositivo
 */
export function simulateOrientationChange(orientation: 'portrait' | 'landscape'): void {
    const isPortrait = orientation === 'portrait';

    Object.defineProperty(window.screen.orientation, 'type', {
        writable: true,
        configurable: true,
        value: isPortrait ? 'portrait-primary' : 'landscape-primary',
    });

    window.dispatchEvent(new Event('orientationchange'));
}

/**
 * Verifica se um elemento tem classes responsivas aplicadas
 */
export function hasResponsiveClasses(element: HTMLElement, breakpoint: keyof typeof BREAKPOINTS): boolean {
    const classList = Array.from(element.classList);
    const prefix = breakpoint === 'xs' ? '' : `${breakpoint}:`;

    return classList.some(className =>
        breakpoint === 'xs'
            ? !className.includes(':')
            : className.startsWith(prefix)
    );
}

/**
 * Obtém o valor computado de uma propriedade CSS
 */
export function getComputedStyleValue(element: HTMLElement, property: string): string {
    return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Verifica se um elemento está usando unidades responsivas
 */
export function usesResponsiveUnits(element: HTMLElement): boolean {
    const computedStyle = window.getComputedStyle(element);
    const width = computedStyle.width;
    const maxWidth = computedStyle.maxWidth;

    // Verifica se usa %, vw, rem, em, ou max-width
    return (
        width.includes('%') ||
        width.includes('vw') ||
        width.includes('rem') ||
        width.includes('em') ||
        maxWidth !== 'none'
    );
}

/**
 * Mock de matchMedia para testes
 */
export function mockMatchMedia(width: number): void {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => {
            // Extrai o valor do max-width ou min-width da query
            const maxWidthMatch = query.match(/max-width:\s*(\d+)px/);
            const minWidthMatch = query.match(/min-width:\s*(\d+)px/);

            let matches = false;

            if (maxWidthMatch) {
                const maxWidth = parseInt(maxWidthMatch[1], 10);
                matches = width <= maxWidth;
            } else if (minWidthMatch) {
                const minWidth = parseInt(minWidthMatch[1], 10);
                matches = width >= minWidth;
            }

            return {
                matches,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            };
        }),
    });
}
