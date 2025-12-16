'use client';

/**
 * DateNavigation - Componente para navegação temporal
 *
 * Fornece botões de navegação (anterior, próximo, hoje) e exibe
 * o período atual formatado. Usado em visualizações de calendário.
 *
 * @example
 * ```tsx
 * <DateNavigation
 *   onPrevious={() => setCurrentDate(subWeeks(currentDate, 1))}
 *   onNext={() => setCurrentDate(addWeeks(currentDate, 1))}
 *   onToday={() => setCurrentDate(new Date())}
 *   displayText="01/01 - 07/01/2025"
 * />
 * ```
 */

import * as React from 'react';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// =============================================================================
// TIPOS
// =============================================================================

export type NavigationMode = 'semana' | 'mes' | 'ano';

export interface DateNavigationProps {
  /** Callback ao clicar em anterior */
  onPrevious: () => void;
  /** Callback ao clicar em próximo */
  onNext: () => void;
  /** Callback ao clicar em hoje */
  onToday: () => void;
  /** Texto de exibição do período (ex: "01/01 - 07/01/2025") */
  displayText: string;
  /** Modo de navegação atual (para tooltips) */
  mode?: NavigationMode;
  /** Classes CSS adicionais */
  className?: string;
  /** Desabilitar navegação */
  disabled?: boolean;
  /** Variante de tamanho */
  size?: 'sm' | 'default';
}

// =============================================================================
// CONSTANTES
// =============================================================================

const MODE_LABELS: Record<NavigationMode, { previous: string; next: string }> = {
  semana: { previous: 'Semana anterior', next: 'Próxima semana' },
  mes: { previous: 'Mês anterior', next: 'Próximo mês' },
  ano: { previous: 'Ano anterior', next: 'Próximo ano' },
};

// =============================================================================
// COMPONENTE
// =============================================================================

export function DateNavigation({
  onPrevious,
  onNext,
  onToday,
  displayText,
  mode = 'semana',
  className,
  disabled = false,
  size = 'default',
}: DateNavigationProps) {
  const labels = MODE_LABELS[mode];
  const buttonSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const todayButtonSize = size === 'sm' ? 'h-8 px-2.5' : 'h-9 px-3';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Navigation Buttons */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={buttonSize}
              onClick={onPrevious}
              disabled={disabled}
            >
              <ChevronLeft className={iconSize} />
              <span className="sr-only">{labels.previous}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{labels.previous}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(todayButtonSize, 'font-medium')}
              onClick={onToday}
              disabled={disabled}
            >
              <CalendarClock className={cn(iconSize, 'mr-1.5 hidden sm:inline')} />
              Hoje
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Ir para hoje</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={buttonSize}
              onClick={onNext}
              disabled={disabled}
            >
              <ChevronRight className={iconSize} />
              <span className="sr-only">{labels.next}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{labels.next}</TooltipContent>
        </Tooltip>
      </div>

      {/* Date Display */}
      <span className="text-sm font-medium min-w-[120px] text-center select-none">
        {displayText}
      </span>
    </div>
  );
}

// =============================================================================
// COMPONENTE COMPACTO (para mobile ou espaços reduzidos)
// =============================================================================

export interface DateNavigationCompactProps {
  /** Callback ao clicar em anterior */
  onPrevious: () => void;
  /** Callback ao clicar em próximo */
  onNext: () => void;
  /** Callback ao clicar em hoje */
  onToday: () => void;
  /** Texto de exibição do período */
  displayText: string;
  /** Classes CSS adicionais */
  className?: string;
  /** Desabilitar navegação */
  disabled?: boolean;
}

export function DateNavigationCompact({
  onPrevious,
  onNext,
  onToday,
  displayText,
  className,
  disabled = false,
}: DateNavigationCompactProps) {
  return (
    <div className={cn('flex items-center justify-between w-full', className)}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onPrevious}
        disabled={disabled}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-sm font-medium"
        onClick={onToday}
        disabled={disabled}
      >
        {displayText}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onNext}
        disabled={disabled}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
