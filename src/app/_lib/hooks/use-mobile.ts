"use client"

import { useState, useEffect } from "react"

/**
 * Hook para detectar se o dispositivo é mobile
 * 
 * Retorna true se a largura da tela for menor que 768px (breakpoint md do Tailwind)
 * 
 * @returns boolean - true se for mobile, false caso contrário
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *   
 *   return (
 *     <div>
 *       {isMobile ? <MobileView /> : <DesktopView />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // SSR-safe: retorna false no servidor
    if (typeof window === "undefined") {
      return false;
    }
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Atualiza imediatamente
    updateIsMobile();

    // Escuta mudanças de tamanho
    window.addEventListener("resize", updateIsMobile);

    // Escuta mudanças de orientação
    window.addEventListener("orientationchange", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
      window.removeEventListener("orientationchange", updateIsMobile);
    };
  }, []);

  return isMobile;
}

