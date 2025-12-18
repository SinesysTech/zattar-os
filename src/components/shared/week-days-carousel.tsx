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
 *   // Com navegação integrada:
 *   onPrevious={handlePreviousWeek}
 *   onNext={handleNextWeek}
 *   onToday={handleToday}
 * />
 * ```
 *
 * DaysCarousel - Carrossel de dias com navegação por dia
 *
 * Componente que exibe dias em um carrossel responsivo, navegando
 * dia a dia (não semana a semana). Preenche toda a largura disponível.
 *
 * @example
 * ```tsx
 * <DaysCarousel
 *   selectedDate={selectedDate}
 *   onDateSelect={setSelectedDate}
 *   onPrevious={handlePreviousDay}
 *   onNext={handleNextDay}
 *   visibleDays={7} // Quantos dias mostrar
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
  addDays,
  subDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  /** Callback para navegar para semana anterior (habilita navegação integrada) */
  onPrevious?: () => void;
  /** Callback para navegar para próxima semana */
  onNext?: () => void;
  /** Callback para ir para hoje */
  onToday?: () => void;
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
  onPrevious,
  onNext,
  onToday,
}: WeekDaysCarouselProps) {
  // Calcular dias da semana
  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Verificar se navegação está habilitada
  const hasNavigation = Boolean(onPrevious && onNext && onToday);

  // Formatar texto do período: "14 a 20 de dezembro de 2025"
  const periodText = React.useMemo(() => {
    const startDay = format(weekStart, 'd', { locale });
    const endDay = format(weekEnd, 'd', { locale });
    const monthYear = format(weekEnd, "MMMM 'de' yyyy", { locale });

    // Se os dois dias estão no mesmo mês
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${startDay} a ${endDay} de ${monthYear}`;
    }

    // Se os dias estão em meses diferentes
    const startMonth = format(weekStart, 'MMMM', { locale });
    return `${startDay} de ${startMonth} a ${endDay} de ${monthYear}`;
  }, [weekStart, weekEnd, locale]);

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

  // Renderizar botão de navegação
  const renderNavButton = (
    direction: 'previous' | 'next',
    onClick?: () => void
  ) => {
    if (!onClick) return null;

    const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;
    const label = direction === 'previous' ? 'Semana anterior' : 'Próxima semana';

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onClick}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    );
  };

  const daysContent = (
    <div
      className={cn(
        'flex items-center justify-center gap-1 overflow-x-auto py-1',
        variant === 'compact' && 'gap-0.5',
        !hasNavigation && className // Apply className here if no wrapper
      )}
      role="tablist"
      aria-label="Selecionar dia da semana"
    >
      {/* Seta anterior (na linha dos dias) */}
      {hasNavigation && renderNavButton('previous', onPrevious)}

      {daysInfo.map((day) => {
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
            key={day.date.toISOString()}
            type="button"
            role="tab"
            aria-selected={day.isSelected ? "true" : "false"}
            tabIndex={day.isSelected ? 0 : -1}
            onClick={() => onDateSelect(day.date)}
            className={cn(baseClasses, variantClasses[variant])}
          >
            <span className={dayNameClasses[variant]}>{day.dayOfWeek}</span>
            <span className={dayNumberClasses[variant]}>{day.dayNumber}</span>
            {renderBadge && (
              <div className="mt-0.5">
                {renderBadge(day.date)}
              </div>
            )}
          </button>
        );
      })}

      {/* Seta próxima (na linha dos dias) */}
      {hasNavigation && renderNavButton('next', onNext)}
    </div>
  );

  if (hasNavigation) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {/* Linha do período (se navegação habilitada) */}
        <div className="flex items-center justify-center">
          <span className="text-base font-medium text-muted-foreground select-none">
            {periodText}
          </span>
        </div>

        {daysContent}
      </div>
    );
  }

  return daysContent;
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

// =============================================================================
// DAYS CAROUSEL - Navegação por dia (não por semana)
// =============================================================================

export interface DaysCarouselProps {
  /** Data atualmente selecionada */
  selectedDate: Date;
  /** Callback quando um dia é selecionado */
  onDateSelect: (date: Date) => void;
  /** Data de início do range visível */
  startDate: Date;
  /** Callback para navegar para o dia anterior */
  onPrevious: () => void;
  /** Callback para navegar para o próximo dia */
  onNext: () => void;
  /** Quantidade de dias visíveis no carrossel */
  visibleDays?: number;
  /** Classes CSS adicionais */
  className?: string;
  /** Locale para formatação */
  locale?: Locale;
}

export function DaysCarousel({
  selectedDate,
  onDateSelect,
  startDate,
  onPrevious,
  onNext,
  visibleDays = 7,
  className,
  locale = ptBR,
}: DaysCarouselProps) {
  // Calcular dias visíveis a partir da data inicial
  const endDate = addDays(startDate, visibleDays - 1);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Texto do mês/ano baseado na data selecionada
  const monthYearText = React.useMemo(() => {
    const monthName = format(selectedDate, 'MMMM', { locale });
    const year = format(selectedDate, 'yyyy');
    // Capitaliza primeira letra
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `${capitalizedMonth} de ${year}`;
  }, [selectedDate, locale]);

  // Informações dos dias
  const daysInfo = React.useMemo(() => {
    return days.map((day) => ({
      date: day,
      dayOfWeek: format(day, 'EEE', { locale }),
      dayNumber: format(day, 'd'),
      isSelected: isSameDay(day, selectedDate),
      isToday: isToday(day),
    }));
  }, [days, selectedDate, locale]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Linha do mês/ano */}
      <div className="flex items-center justify-center">
        <span className="text-base font-medium text-muted-foreground select-none">
          {monthYearText}
        </span>
      </div>

      {/* Dias com setas de navegação */}
      <div
        className="flex items-center justify-center gap-1 w-full"
        role="tablist"
        aria-label="Selecionar dia"
      >
        {/* Seta anterior */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={onPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Dia anterior</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Dia anterior</TooltipContent>
        </Tooltip>

        {/* Dias */}
        <div className="flex items-center justify-center gap-1 flex-1">
          {daysInfo.map((day) => (
            <button
              key={day.date.toISOString()}
              type="button"
              role="tab"
              aria-selected={day.isSelected ? "true" : "false"}
              tabIndex={day.isSelected ? 0 : -1}
              onClick={() => onDateSelect(day.date)}
              className={cn(
                'min-w-16 flex flex-col items-center justify-center rounded-md transition-all cursor-pointer py-2 px-1',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                day.isSelected && 'bg-primary text-primary-foreground shadow-sm',
                !day.isSelected && day.isToday && 'bg-accent text-accent-foreground font-semibold',
                !day.isSelected && !day.isToday && 'hover:bg-muted text-muted-foreground'
              )}
            >
              <span className="text-[10px] uppercase tracking-wide">{day.dayOfWeek}</span>
              <span className="text-lg font-bold">{day.dayNumber}</span>
            </button>
          ))}
        </div>

        {/* Seta próxima */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={onNext}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Próximo dia</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Próximo dia</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// =============================================================================
// HOOK PARA NAVEGAÇÃO POR DIA
// =============================================================================

export function useDayNavigation(initialDate: Date = new Date(), visibleDays: number = 7) {
  const [selectedDate, setSelectedDate] = React.useState(initialDate);
  // startDate é calculado para centralizar o dia selecionado
  const [startDate, setStartDate] = React.useState(() => {
    const offset = Math.floor(visibleDays / 2);
    return subDays(initialDate, offset);
  });

  const handleDateSelect = React.useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handlePrevious = React.useCallback(() => {
    setStartDate(prev => subDays(prev, 1));
  }, []);

  const handleNext = React.useCallback(() => {
    setStartDate(prev => addDays(prev, 1));
  }, []);

  const goToToday = React.useCallback(() => {
    const today = new Date();
    const offset = Math.floor(visibleDays / 2);
    setSelectedDate(today);
    setStartDate(subDays(today, offset));
  }, [visibleDays]);

  return {
    selectedDate,
    setSelectedDate: handleDateSelect,
    startDate,
    setStartDate,
    handlePrevious,
    handleNext,
    goToToday,
  };
}
