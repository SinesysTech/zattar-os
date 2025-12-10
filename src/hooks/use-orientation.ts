/**
 * Hook para detecção de orientação do dispositivo
 * 
 * Detecta se o dispositivo está em modo retrato ou paisagem
 * e fornece callbacks para mudanças de orientação.
 */

import { useState, useEffect } from 'react';
import type { Orientation } from '@/types/responsive';

/**
 * Determina a orientação baseada nas dimensões do viewport
 */
function getOrientation(): Orientation {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

/**
 * Hook que retorna a orientação atual do dispositivo
 * 
 * @returns Orientação atual ('portrait' ou 'landscape')
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const orientation = useOrientation();
 *   
 *   return (
 *     <div>
 *       <p>Orientação: {orientation}</p>
 *       {orientation === 'landscape' && <LandscapeView />}
 *       {orientation === 'portrait' && <PortraitView />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOrientation(): Orientation {
    const [orientation, setOrientation] = useState<Orientation>(getOrientation);

    useEffect(() => {
        const updateOrientation = () => {
            setOrientation(getOrientation());
        };

        // Atualiza imediatamente
        updateOrientation();

        // Escuta mudanças de tamanho e orientação
        window.addEventListener('resize', updateOrientation);
        window.addEventListener('orientationchange', updateOrientation);

        return () => {
            window.removeEventListener('resize', updateOrientation);
            window.removeEventListener('orientationchange', updateOrientation);
        };
    }, []);

    return orientation;
}

/**
 * Hook que verifica se o dispositivo está em modo retrato
 * 
 * @returns true se está em modo retrato
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isPortrait = useIsPortrait();
 *   
 *   return (
 *     <div className={isPortrait ? 'portrait-layout' : 'landscape-layout'}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsPortrait(): boolean {
    const orientation = useOrientation();
    return orientation === 'portrait';
}

/**
 * Hook que verifica se o dispositivo está em modo paisagem
 * 
 * @returns true se está em modo paisagem
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isLandscape = useIsLandscape();
 *   
 *   return (
 *     <div>
 *       {isLandscape && <p>Aproveite a visualização em tela larga!</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsLandscape(): boolean {
    const orientation = useOrientation();
    return orientation === 'landscape';
}

/**
 * Hook que executa um callback quando a orientação muda
 * 
 * @param callback - Função a ser executada quando a orientação muda
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   useOrientationChange((newOrientation) => {
 *     console.log('Orientação mudou para:', newOrientation);
 *     // Executar lógica específica
 *   });
 *   
 *   return <div>Content</div>;
 * }
 * ```
 */
export function useOrientationChange(callback: (orientation: Orientation) => void): void {
    const orientation = useOrientation();

    useEffect(() => {
        callback(orientation);
    }, [orientation, callback]);
}

/**
 * Hook que retorna informações detalhadas sobre a orientação
 * 
 * @returns Objeto com informações sobre orientação
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { orientation, isPortrait, isLandscape, aspectRatio } = useOrientationInfo();
 *   
 *   return (
 *     <div>
 *       <p>Orientação: {orientation}</p>
 *       <p>Aspect Ratio: {aspectRatio.toFixed(2)}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useOrientationInfo() {
    const orientation = useOrientation();
    const [aspectRatio, setAspectRatio] = useState<number>(() => {
        if (typeof window === 'undefined') return 16 / 9;
        return window.innerWidth / window.innerHeight;
    });

    useEffect(() => {
        const updateAspectRatio = () => {
            setAspectRatio(window.innerWidth / window.innerHeight);
        };

        updateAspectRatio();

        window.addEventListener('resize', updateAspectRatio);
        window.addEventListener('orientationchange', updateAspectRatio);

        return () => {
            window.removeEventListener('resize', updateAspectRatio);
            window.removeEventListener('orientationchange', updateAspectRatio);
        };
    }, []);

    return {
        orientation,
        isPortrait: orientation === 'portrait',
        isLandscape: orientation === 'landscape',
        aspectRatio,
    };
}
