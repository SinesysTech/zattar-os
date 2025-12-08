/**
 * Tipos para sistema de responsividade
 */

/**
 * Breakpoints do Tailwind CSS
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Orientação do dispositivo
 */
export type Orientation = 'portrait' | 'landscape';

/**
 * Estado do viewport
 */
export interface ViewportState {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    orientation: Orientation;
    breakpoint: Breakpoint;
}

/**
 * Configuração de responsividade
 */
export interface ResponsiveConfig {
    breakpoints: Record<Breakpoint, number>;
    touchTargetSize: number;
    mobileMenuThreshold: number;
    tableScrollThreshold: number;
}

/**
 * Estado responsivo de componente
 */
export interface ComponentResponsiveState {
    layout: 'mobile' | 'tablet' | 'desktop';
    columns: number;
    showFullContent: boolean;
    useCompactMode: boolean;
}
