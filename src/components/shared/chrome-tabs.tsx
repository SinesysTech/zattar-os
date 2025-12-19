'use client';

/**
 * ChromeTabs - Tabs com visual estilo Chrome
 *
 * Implementa tabs com o formato característico do Chrome,
 * com curvas côncavas (barriguinha para dentro) nas bases.
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
// SVG PATH PARA A FORMA DA TAB (estilo Chrome)
// =============================================================================

// A forma do Chrome tem:
// - Base na linha inferior
// - Curva côncava (barriguinha para DENTRO) começando direto da base
// - Sobe curvando para dentro como um ")" na esquerda
// - Topo com cantos arredondados
// - Desce curvando para dentro como um "(" na direita
//
// viewBox="0 0 100 32" - largura 100, altura 32
const TAB_PATH = `
  M 0 32
  Q 8 32, 12 24
  Q 14 18, 14 8
  Q 14 0, 22 0
  L 78 0
  Q 86 0, 86 8
  Q 86 18, 88 24
  Q 92 32, 100 32
  Z
`;

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
        // Base
        'relative h-9 min-w-[110px] text-sm font-medium transition-all cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // Margem negativa para sobreposição das curvas
        '-mr-3 first:ml-0 last:mr-0',
        // Estados
        isActive
          ? 'text-foreground z-10'
          : 'text-muted-foreground/70 hover:text-muted-foreground z-[1] hover:z-[5]'
      )}
    >
      {/* SVG para a forma da tab - TODAS as tabs têm a forma */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        fill="none"
      >
        {isActive ? (
          // Tab ativa - fundo branco, borda normal
          <path
            d={TAB_PATH}
            className="fill-card stroke-border"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          // Tab inativa - fundo mais escuro, borda mais clara, aparência desativada
          <path
            d={TAB_PATH}
            className="fill-muted/50 stroke-border/50 hover:fill-muted/70 hover:stroke-border/70 transition-colors"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Indicador animado para tab ativa */}
      {isActive && (
        <motion.div
          layoutId={`${tabsId}-active-indicator`}
          className="absolute inset-0 pointer-events-none"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      {/* Conteúdo da tab */}
      <span className="relative z-10 flex items-center justify-center gap-1.5 h-full px-4 pt-0.5">
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
  const generatedId = React.useId();
  const tabsId = id ?? generatedId;

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
        'flex items-end',
        className
      )}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => (
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
