'use client';

/**
 * ChromeTabs - Tabs com visual estilo Chrome
 *
 * Implementa tabs com o formato característico do Chrome,
 * onde a tab ativa aparece "na frente" das outras com continuidade visual.
 *
 * Características:
 * - Formato curvo e delicado (similar ao Chrome)
 * - Tab ativa com borda inferior removida para continuidade
 * - Tabs inativas parecem estar "atrás"
 * - Animações com Framer Motion
 * - Acessibilidade: role="tablist", aria-selected, keyboard navigation
 */

import * as React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

// =============================================================================
// TIPOS
// =============================================================================

export interface ChromeTab {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface ChromeTabsProps {
  /** Array de tabs disponíveis */
  tabs: ChromeTab[];
  /** Tab atualmente ativa */
  activeTab: string;
  /** Callback quando uma tab é selecionada */
  onTabChange: (value: string) => void;
  /** Classes CSS adicionais para o container */
  className?: string;
  /** ID único para as tabs (usado para layoutId do Framer Motion) */
  id?: string;
}

// =============================================================================
// COMPONENTE CHROME TAB INDIVIDUAL
// =============================================================================

interface ChromeTabItemProps {
  tab: ChromeTab;
  isActive: boolean;
  onClick: () => void;
  tabsId: string;
}

function ChromeTabItem({
  tab,
  isActive,
  onClick,
  tabsId,
}: ChromeTabItemProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      className={cn(
        // Base - mais fino e delicado
        'relative px-5 py-1.5 text-sm font-medium transition-all cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // Estados
        isActive
          ? 'text-foreground z-10'
          : 'text-muted-foreground hover:text-foreground z-[1] hover:z-[5]'
      )}
    >
      {/* Background da tab inativa */}
      {!isActive && (
        <span
          className="absolute inset-0 rounded-t-xl bg-muted/40 hover:bg-muted/60 transition-colors"
        />
      )}

      {/* Indicador de tab ativa (animado) com forma curva */}
      {isActive && (
        <motion.span
          layoutId={`${tabsId}-active-bg`}
          className="absolute inset-0 bg-card border border-border border-b-0 rounded-t-xl"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      {/* Conteúdo da tab */}
      <span className="relative z-10 flex items-center gap-1.5">
        {tab.icon}
        {tab.label}
      </span>
    </button>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ChromeTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  id,
}: ChromeTabsProps) {
  const tabsId = id ?? React.useId();

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = tabs.findIndex((t) => t.value === activeTab);
      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowLeft':
          newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
          break;
        case 'ArrowRight':
          newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      onTabChange(tabs[newIndex].value);
    },
    [tabs, activeTab, onTabChange]
  );

  return (
    <div
      role="tablist"
      aria-label="Visualizações"
      className={cn(
        'flex items-end gap-0.5 pl-1',
        className
      )}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab, index) => (
        <ChromeTabItem
          key={tab.value}
          tab={tab}
          isActive={tab.value === activeTab}
          onClick={() => onTabChange(tab.value)}
          tabsId={tabsId}
        />
      ))}
    </div>
  );
}

export default ChromeTabs;
