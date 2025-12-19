'use client';

/**
 * ChromeTabs - Tabs com visual estilo Chrome
 *
 * Implementa tabs com o formato trapezioidal característico do Chrome,
 * onde a tab ativa aparece "na frente" das outras.
 *
 * Características:
 * - Formato curvo usando pseudo-elementos CSS
 * - Tab ativa destacada (branca, z-index alto)
 * - Tabs inativas parecem estar "atrás"
 * - Animações com Framer Motion
 * - Acessibilidade: role="tablist", aria-selected, keyboard navigation
 *
 * @example
 * ```tsx
 * <ChromeTabs
 *   tabs={[
 *     { value: 'semana', label: 'Dia' },
 *     { value: 'mes', label: 'Mês' },
 *     { value: 'ano', label: 'Ano' },
 *     { value: 'lista', label: 'Lista' },
 *   ]}
 *   activeTab="semana"
 *   onTabChange={setActiveTab}
 * />
 * ```
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
  isFirst: boolean;
  isLast: boolean;
}

function ChromeTabItem({
  tab,
  isActive,
  onClick,
  tabsId,
  isFirst,
  isLast,
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
        'relative px-6 py-2.5 text-sm font-medium transition-all cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // Posicionamento para sobreposição
        '-mr-3 first:ml-0',
        // Estados
        isActive
          ? 'text-foreground z-10'
          : 'text-muted-foreground hover:text-foreground z-[1] hover:z-[5]'
      )}
    >
      {/* Background da tab com forma curva */}
      <span
        className={cn(
          'absolute inset-0 rounded-t-lg transition-colors',
          isActive
            ? 'bg-card'
            : 'bg-muted/50 hover:bg-muted/80'
        )}
        style={{
          clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 100%, 0 100%)',
        }}
      />

      {/* Indicador de tab ativa (animado) */}
      {isActive && (
        <motion.span
          layoutId={`${tabsId}-active-indicator`}
          className="absolute inset-0 rounded-t-lg bg-card"
          style={{
            clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 100%, 0 100%)',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}

      {/* Curva inferior esquerda (apenas tab ativa) */}
      {isActive && !isFirst && (
        <span
          className="absolute -left-2 bottom-0 w-2 h-2 bg-card"
          style={{
            boxShadow: '2px 0 0 0 hsl(var(--card))',
            borderBottomRightRadius: '8px',
          }}
        >
          <span className="absolute inset-0 bg-muted" style={{ borderBottomRightRadius: '8px' }} />
        </span>
      )}

      {/* Curva inferior direita (apenas tab ativa) */}
      {isActive && !isLast && (
        <span
          className="absolute -right-2 bottom-0 w-2 h-2 bg-card"
          style={{
            boxShadow: '-2px 0 0 0 hsl(var(--card))',
            borderBottomLeftRadius: '8px',
          }}
        >
          <span className="absolute inset-0 bg-muted" style={{ borderBottomLeftRadius: '8px' }} />
        </span>
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
        'flex items-end pl-2',
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
          isFirst={index === 0}
          isLast={index === tabs.length - 1}
        />
      ))}
    </div>
  );
}

export default ChromeTabs;
