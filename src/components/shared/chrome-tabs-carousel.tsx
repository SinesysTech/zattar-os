'use client';

/**
 * ChromeTabsCarousel - Wrapper integrado de tabs Chrome + carrossel
 *
 * Combina o componente ChromeTabs com um container de carrossel,
 * criando a integração visual onde a tab ativa "conecta" com o
 * conteúdo do carrossel (sem borda no ponto de encontro).
 */

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { ChromeTabs, type ChromeTab } from './chrome-tabs';

// =============================================================================
// TIPOS
// =============================================================================

export interface ChromeTabsCarouselProps {
  /** Array de tabs disponíveis */
  tabs: ChromeTab[];
  /** Tab atualmente ativa */
  activeTab: string;
  /** Callback quando uma tab é selecionada */
  onTabChange: (value: string) => void;
  /** Conteúdo do carrossel (opcional, não renderiza se activeTab não tiver carrossel) */
  carousel?: React.ReactNode;
  /** Conteúdo principal abaixo do carrossel */
  children?: React.ReactNode;
  /** Classes CSS adicionais para o container externo */
  className?: string;
  /** Classes CSS adicionais para o container do carrossel */
  carouselClassName?: string;
  /** Classes CSS adicionais para o container do conteúdo */
  contentClassName?: string;
  /** ID único para as tabs */
  id?: string;
  /** Se true, anima a transição do conteúdo do carrossel */
  animateCarousel?: boolean;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ChromeTabsCarousel({
  tabs,
  activeTab,
  onTabChange,
  carousel,
  children,
  className,
  carouselClassName,
  contentClassName,
  id,
  animateCarousel = true,
}: ChromeTabsCarouselProps) {
  const generatedId = React.useId();
  const carouselId = id ?? generatedId;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Container das tabs + carrossel integrados */}
      <div className="relative">
        {/* Tabs Chrome - posicionadas acima da borda do carrossel */}
        <div className="relative z-10 flex items-end">
          <ChromeTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
            id={carouselId}
          />
        </div>

        {/* Carrossel integrado (se existir) */}
        {carousel && (
          <div
            className={cn(
              // Container com borda - sem borda superior (a tab ativa faz a conexão)
              'relative bg-card border border-border rounded-b-lg rounded-tr-lg',
              // A borda superior é feita pela linha abaixo das tabs
              '-mt-px',
              // Padding interno
              'p-4',
              carouselClassName
            )}
          >
            {/* Conteúdo do carrossel com animação */}
            {animateCarousel ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  {carousel}
                </motion.div>
              </AnimatePresence>
            ) : (
              carousel
            )}
          </div>
        )}
      </div>

      {/* Conteúdo principal */}
      {children && (
        <div className={cn('flex-1 flex flex-col gap-4 mt-4', contentClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ChromeTabs, type ChromeTab } from './chrome-tabs';
export default ChromeTabsCarousel;
