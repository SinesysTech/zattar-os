import { render, RenderResult } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Helpers para testes de responsividade
 * 
 * Fornece utilitários para mockar viewport, matchMedia e outras
 * funcionalidades relacionadas a testes responsivos.
 */

// Breakpoints do sistema (Tailwind CSS)
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Viewports comuns para testes
export const COMMON_VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  largeDesktop: { width: 1920, height: 1080 },
} as const;

/**
 * Cria uma função mock genérica compatível com jest.fn()
 * Retorna uma função vazia que pode ser usada como mock
 */
function createMockFn(): () => void {
  const fn = function () {
    // Função mock vazia
  };
  
  // Adiciona propriedades de mock para compatibilidade
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fn as any).mockReturnValue = () => fn;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fn as any).mockImplementation = () => fn;
  
  return fn;
}

/**
 * Obtém uma função mock para uso em testes
 * Retorna uma função mock genérica compatível com jest.fn()
 * Em runtime de Jest, o jest.fn() será usado automaticamente se disponível
 */
function getMockFn(): () => void {
  // Sempre retorna função mock genérica
  // Em runtime de Jest, os testes podem substituir isso se necessário
  return createMockFn();
}

/**
 * Define o viewport do window para testes
 */
export function setViewport(viewport: { width: number; height: number }): void {
  // Atualiza window.innerWidth e window.innerHeight
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: viewport.width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: viewport.height,
  });

  // Dispara evento resize para componentes que escutam
  window.dispatchEvent(new Event('resize'));
}

/**
 * Mocka window.matchMedia para testes de media queries
 */
export function mockMatchMedia(width: number): void {
  // Sempre substitui matchMedia para garantir comportamento consistente nos testes
  // Usa typeof para verificação de tipo adequada quando necessário
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => {
      // Extrai o valor do breakpoint da query
      const matches = (() => {
        if (query.includes('min-width')) {
          const minWidth = parseInt(query.match(/min-width:\s*(\d+)px/)?.[1] || '0');
          return width >= minWidth;
        }
        if (query.includes('max-width')) {
          const maxWidth = parseInt(query.match(/max-width:\s*(\d+)px/)?.[1] || '9999');
          return width <= maxWidth;
        }
        return false;
      })();

      return {
        matches,
        media: query,
        onchange: null,
        addListener: getMockFn(),
        removeListener: getMockFn(),
        addEventListener: getMockFn(),
        removeEventListener: getMockFn(),
        dispatchEvent: getMockFn(),
      };
    },
  });
}

/**
 * Verifica se um elemento tem tamanho suficiente para touch targets (mínimo 44x44px)
 */
export function hasSufficientTouchTarget(element: HTMLElement | null): boolean {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  const minSize = 44; // Tamanho mínimo recomendado para touch targets (WCAG)

  return rect.width >= minSize && rect.height >= minSize;
}

/**
 * Obtém o tamanho de um touch target
 */
export function getTouchTargetSize(element: HTMLElement | null): { width: number; height: number } | null {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Verifica se um elemento tem scroll horizontal
 */
export function hasHorizontalScroll(element: HTMLElement | null): boolean {
  if (!element) return false;

  return element.scrollWidth > element.clientWidth;
}

/**
 * Calcula número de colunas baseado no viewport e breakpoints
 */
export function getComputedColumns(
  width: number,
  breakpoints: { mobile: number; tablet: number; desktop: number } = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  }
): number {
  if (width < BREAKPOINTS.md) {
    return breakpoints.mobile;
  }
  if (width < BREAKPOINTS.lg) {
    return breakpoints.tablet;
  }
  return breakpoints.desktop;
}

/**
 * Renderiza um componente com viewport específico para testes responsivos
 * Combina render do @testing-library/react com setViewport
 */
export function renderWithViewport(
  component: ReactElement,
  width: number,
  height?: number
): RenderResult {
  setViewport({ width, height: height ?? 800 });
  mockMatchMedia(width);
  return render(component);
}

