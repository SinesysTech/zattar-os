'use client';

/**
 * ExpedientesTabsCarousel - Tabs estilo "lifted" integradas com carrossel
 *
 * Implementa tabs com visual "lifted" (shadcn tabs-13 pattern) integradas
 * com carrossel de navegação temporal (dia/mês/ano).
 *
 * Baseado no componente tabs-13 do shadcn-studio (lifted tabs pattern).
 */

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// =============================================================================
// TIPOS
// =============================================================================

export interface ExpedientesTab {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface ExpedientesTabsCarouselProps {
  /** Array de tabs disponíveis */
  tabs: ExpedientesTab[];
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
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedientesTabsCarousel({
  tabs,
  activeTab,
  onTabChange,
  carousel,
  children,
  className,
  carouselClassName,
  contentClassName,
}: ExpedientesTabsCarouselProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs value={activeTab} onValueChange={onTabChange} className={cn("flex flex-col inline-none h-full")}>
        {/* Tabs List - estilo lifted (tabs-13 pattern) */}
        <TabsList className={cn("bg-background justify-start rounded-none border-b border-border inset-none h-auto")}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  // Base styles - inactive tabs
                  'bg-background border-b-border',
                  'h-full rounded-none rounded-t',
                  'border border-transparent',
                  'data-[state=active]:shadow-none',
                  // Active tab - bg-card to match carousel
                  'data-[state=active]:bg-card',
                  'data-[state=active]:border-border',
                  'data-[state=active]:border-b-card',
                  'data-[state=active]:-mb-0.5',
                  // Dark mode
                  'dark:data-[state=active]:bg-card',
                  'dark:border-b-0',
                  'dark:data-[state=active]:-mb-0.5',
                  // Custom styles for icon support
                  'flex items-center inline-snug px-4 py-2',
                   'text-body-sm font-medium',
                  'whitespace-nowrap',
                  // Active state removes border-b when carousel exists (visual integration)
                  isActive && carousel && 'border-b-0 -mb-px'
                )}
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Container do carrossel + conteúdo */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Carrossel integrado (se existir) */}
          {carousel && (
            <div
              className={cn(
                'relative bg-card',
                // Borders: left, right, bottom only (top integrates with tab)
                'border-x border-b border-border',
                'rounded-b-lg',
                'inset-card-compact',
                carouselClassName
              )}
            >
              {carousel}
            </div>
          )}

          {/* Conteúdo principal */}
          {children && (
            <div className={cn('flex-1 flex flex-col inline-default mt-4 min-h-0', contentClassName)}>
              {children}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}

export default ExpedientesTabsCarousel;
