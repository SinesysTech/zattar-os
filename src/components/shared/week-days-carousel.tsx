'use client';

/**
 * WeekDaysCarousel - Carrossel de dias da semana
 *
 * Componente reutilizável para exibir os 7 dias da semana de forma
 * interativa. Destaca o dia selecionado e o dia atual.
 * Extraído e generalizado do módulo de expedientes.
 *
 * @example
 * ```tsx
 * <WeekDaysCarousel
 *   currentDate={currentDate}
 *   selectedDate={selectedDate}
 *   onDateSelect={setSelectedDate}
 *   weekStartsOn={1} // Segunda-feira
 * />
 * ```
 */

import * as React from 'react';
import type { Locale } from 'date-fns';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// =============================================================================
// TIPOS
// =============================================================================

export interface DayInfo {
  date: Date;
  dayOfWeek: string;
  dayNumber: string;
  isSelected: boolean;
  isToday: boolean;
}

export interface WeekDaysCarouselProps {
  /** Data de referência para calcular a semana */
  currentDate: Date;
  /** Data atualmente selecionada */
  selectedDate: Date;
  /** Callback quando um dia é selecionado */
  onDateSelect: (date: Date) => void;
  /** Dia de início da semana (0 = Domingo, 1 = Segunda) */
  weekStartsOn?: 0 | 1;
  /** Classes CSS adicionais */
  className?: string;
  /** Variante de estilo */
  variant?: 'default' | 'compact' | 'minimal';
  /** Renderizar badge com contagem para cada dia */
  renderBadge?: (date: Date) => React.ReactNode;
  /** Locale para formatação */
  locale?: Locale;
  /** Mostrar nome do dia completo em telas grandes */
  showFullDayName?: boolean;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function WeekDaysCarousel({
  currentDate,
  selectedDate,
  onDateSelect,
  weekStartsOn = 1,
  className,
  variant = 'default',
  renderBadge,
  locale = ptBR,
  showFullDayName = false,
}: WeekDaysCarouselProps) {
  // Calcular dias da semana
  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Memoizar informações dos dias
  const daysInfo = React.useMemo<DayInfo[]>(() => {
    return weekDays.map((day) => ({
      date: day,
      dayOfWeek: format(day, showFullDayName ? 'EEEE' : 'EEE', { locale }),
      dayNumber: format(day, 'd'),
      isSelected: isSameDay(day, selectedDate),
      isToday: isToday(day),
    }));
  }, [weekDays, selectedDate, showFullDayName, locale]);

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1 overflow-x-auto py-1',
        variant === 'compact' && 'gap-0.5',
        className
      )}
      role="listbox"
      aria-label="Selecionar dia da semana"
    >
      {daysInfo.map((day) => (
        <DayButton
          key={day.date.toISOString()}
          day={day}
          variant={variant}
          onClick={() => onDateSelect(day.date)}
          badge={renderBadge?.(day.date)}
        />
      ))}
    </div>
  );
}

// =============================================================================
// SUBCOMPONENTE: DayButton
// =============================================================================

interface DayButtonProps {
  day: DayInfo;
  variant: 'default' | 'compact' | 'minimal';
  onClick: () => void;
  badge?: React.ReactNode;
}

function DayButton({ day, variant, onClick, badge }: DayButtonProps) {
  const baseClasses = cn(
    'flex flex-col items-center justify-center rounded-md transition-all cursor-pointer',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
  );

  const variantClasses = {
    default: cn(
      'min-w-16 py-2 px-1',
      day.isSelected && 'bg-primary text-primary-foreground shadow-sm',
      !day.isSelected && day.isToday && 'bg-accent text-accent-foreground font-semibold',
      !day.isSelected && !day.isToday && 'hover:bg-muted text-muted-foreground'
    ),
    compact: cn(
      'min-w-12 py-1.5 px-0.5',
      day.isSelected && 'bg-primary text-primary-foreground shadow-sm',
      !day.isSelected && day.isToday && 'bg-accent text-accent-foreground font-semibold',
      !day.isSelected && !day.isToday && 'hover:bg-muted text-muted-foreground'
    ),
    minimal: cn(
      'min-w-10 py-1 px-0.5',
      day.isSelected && 'bg-primary text-primary-foreground',
      !day.isSelected && day.isToday && 'text-primary font-bold',
      !day.isSelected && !day.isToday && 'hover:bg-muted/50 text-muted-foreground'
    ),
  };

  const dayNameClasses = {
    default: 'text-[10px] uppercase tracking-wide',
    compact: 'text-[9px] uppercase',
    minimal: 'text-[8px] uppercase',
  };

  const dayNumberClasses = {
    default: 'text-lg font-bold',
    compact: 'text-base font-semibold',
    minimal: 'text-sm font-medium',
  };

  return (
    <button
      type="button"
      role="option"
      aria-selected={day.isSelected}
      onClick={onClick}
      className={cn(baseClasses, variantClasses[variant])}
    >
      <span className={dayNameClasses[variant]}>{day.dayOfWeek}</span>
      <span className={dayNumberClasses[variant]}>{day.dayNumber}</span>
      {badge && (
        <div className="mt-0.5">
          {badge}
        </div>
      )}
    </button>
  );
}

// =============================================================================
// COMPONENTE ALTERNATIVO: WeekDaysStrip (versão horizontal inline)
// =============================================================================

export interface WeekDaysStripProps {
  /** Data de referência para calcular a semana */
  currentDate: Date;
  /** Data atualmente selecionada */
  selectedDate: Date;
  /** Callback quando um dia é selecionado */
  onDateSelect: (date: Date) => void;
  /** Dia de início da semana (0 = Domingo, 1 = Segunda) */
  weekStartsOn?: 0 | 1;
  /** Classes CSS adicionais */
  className?: string;
}

export function WeekDaysStrip({
  currentDate,
  selectedDate,
  onDateSelect,
  weekStartsOn = 1,
  className,
}: WeekDaysStripProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className={cn('flex items-center gap-1 bg-muted/30 rounded-lg p-1', className)}>
      {weekDays.map((day) => {
        const selected = isSameDay(day, selectedDate);
        const today = isToday(day);
        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onDateSelect(day)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors',
              selected && 'bg-primary text-primary-foreground font-medium',
              !selected && today && 'bg-accent text-accent-foreground',
              !selected && !today && 'hover:bg-muted text-muted-foreground'
            )}
          >
            <span className="text-xs uppercase">
              {format(day, 'EEE', { locale: ptBR })}
            </span>
            <span className="font-medium">{format(day, 'd')}</span>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// HOOKS AUXILIARES
// =============================================================================

/**
 * Hook para gerenciar estado de data com navegação semanal
 */
export function useWeekNavigation(initialDate: Date = new Date(), weekStartsOn: 0 | 1 = 1) {
  const [currentDate, setCurrentDate] = React.useState(initialDate);
  const [selectedDate, setSelectedDate] = React.useState(initialDate);

  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });

  const handleDateSelect = React.useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const goToToday = React.useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  return {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate: handleDateSelect,
    weekStart,
    weekEnd,
    goToToday,
  };
}
