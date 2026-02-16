'use client';

/**
 * WeekNavigator - Navegador de semana elegante e integrado
 *
 * Componente para navegação por semana completa (segunda a sexta).
 * Design visual polido com container, hierarquia clara e feedback visual.
 *
 * Features:
 * - Mostra apenas dias úteis (seg-sex)
 * - Navega por semana inteira
 * - Botão "Hoje" para retornar à semana atual
 * - Destaque visual para dia selecionado e dia atual
 * - Container visual integrado com o sistema de design
 *
 * @example
 * ```tsx
 * const weekNav = useWeekNavigator();
 *
 * <WeekNavigator
 *   weekDays={weekNav.weekDays}
 *   selectedDate={weekNav.selectedDate}
 *   onDateSelect={weekNav.setSelectedDate}
 *   onPreviousWeek={weekNav.goToPreviousWeek}
 *   onNextWeek={weekNav.goToNextWeek}
 *   onToday={weekNav.goToToday}
 *   isCurrentWeek={weekNav.isCurrentWeek}
 * />
 * ```
 */

import * as React from 'react';
import {
  startOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  isSameWeek,
  getDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';

// =============================================================================
// TIPOS
// =============================================================================

export interface WeekDay {
  date: Date;
  dayOfWeek: string;
  dayNumber: number;
  isSelected: boolean;
  isToday: boolean;
}

export interface WeekNavigatorProps {
  /** Array de dias da semana (seg-sex) */
  weekDays: WeekDay[];
  /** Data selecionada */
  selectedDate: Date;
  /** Callback quando um dia é selecionado */
  onDateSelect: (date: Date) => void;
  /** Callback para ir para semana anterior */
  onPreviousWeek: () => void;
  /** Callback para ir para próxima semana */
  onNextWeek: () => void;
  /** Callback para ir para hoje */
  onToday: () => void;
  /** Se a semana atual contém hoje */
  isCurrentWeek?: boolean;
  /** Classes CSS adicionais */
  className?: string;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function WeekNavigator({
  weekDays,
  selectedDate: _selectedDate,
  onDateSelect,
  onPreviousWeek,
  onNextWeek,
  onToday,
  isCurrentWeek = false,
  className,
}: WeekNavigatorProps) {
  // Helper para capitalizar primeira letra
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // Calcular texto do período
  const periodText = React.useMemo(() => {
    if (weekDays.length === 0) return '';

    const firstDay = weekDays[0].date;
    const lastDay = weekDays[weekDays.length - 1].date;

    const startDay = format(firstDay, 'd', { locale: ptBR });
    const endDay = format(lastDay, 'd', { locale: ptBR });

    // Se mesmos mês e ano
    if (firstDay.getMonth() === lastDay.getMonth()) {
      const month = capitalize(format(lastDay, 'MMMM', { locale: ptBR }));
      const year = format(lastDay, 'yyyy', { locale: ptBR });
      return `${startDay} a ${endDay} de ${month} de ${year}`;
    }

    // Se meses diferentes
    const startMonth = capitalize(format(firstDay, 'MMMM', { locale: ptBR }));
    const endMonth = capitalize(format(lastDay, 'MMMM', { locale: ptBR }));
    const year = format(lastDay, 'yyyy', { locale: ptBR });
    return `${startDay} de ${startMonth} a ${endDay} de ${endMonth} de ${year}`;
  }, [weekDays]);

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {/* Lado esquerdo: Navegação e período */}
      <div className="flex items-center gap-2">
        {/* Botão anterior - container próprio */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center h-8 w-8 shrink-0 rounded-md bg-card border hover:bg-accent transition-colors"
              onClick={onPreviousWeek}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Semana anterior</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Semana anterior</TooltipContent>
        </Tooltip>

        {/* Período */}
        <span className="text-sm font-medium text-foreground select-none whitespace-nowrap">
          {periodText}
        </span>

        {/* Botão próximo - container próprio */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center h-8 w-8 shrink-0 rounded-md bg-card border hover:bg-accent transition-colors"
              onClick={onNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Próxima semana</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Próxima semana</TooltipContent>
        </Tooltip>

        {/* Botão Hoje - só mostra se não estiver na semana atual */}
        {!isCurrentWeek && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs ml-1 bg-white hover:bg-white/90 border shadow-sm"
            onClick={onToday}
          >
            Hoje
          </Button>
        )}
      </div>

      {/* Container direito: Dias da semana */}
      <div
        className="flex items-center gap-1 rounded-md bg-card px-2 py-1.5 border"
        role="tablist"
        aria-label="Selecionar dia da semana"
      >
        {weekDays.map((day) => (
          <button
            key={day.date.toISOString()}
            type="button"
            role="tab"
            aria-selected={day.isSelected}
            tabIndex={day.isSelected ? 0 : -1}
            onClick={() => onDateSelect(day.date)}
            className={cn(
              'flex flex-col items-center justify-center rounded-md transition-all cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              'min-w-12 py-1.5 px-2 gap-0',
              // Estados
              day.isSelected && 'bg-primary text-primary-foreground shadow-sm',
              !day.isSelected && day.isToday && 'bg-primary/10 text-primary ring-1 ring-primary/20',
              !day.isSelected && !day.isToday && 'hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <span
              className={cn(
                'text-[10px] uppercase tracking-wide leading-none',
                day.isSelected ? 'text-primary-foreground/80' : day.isToday ? 'text-primary/80' : 'text-muted-foreground'
              )}
            >
              {day.dayOfWeek}
            </span>
            <span className="text-base font-semibold leading-tight">
              {day.dayNumber}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// HOOK - useWeekNavigator
// =============================================================================

export interface UseWeekNavigatorOptions {
  /** Data inicial (padrão: hoje) */
  initialDate?: Date;
}

export interface UseWeekNavigatorReturn {
  /** Dias da semana atual (seg-sex) */
  weekDays: WeekDay[];
  /** Data selecionada */
  selectedDate: Date;
  /** Atualizar data selecionada */
  setSelectedDate: (date: Date) => void;
  /** Data de referência da semana */
  weekReference: Date;
  /** Ir para semana anterior */
  goToPreviousWeek: () => void;
  /** Ir para próxima semana */
  goToNextWeek: () => void;
  /** Ir para hoje */
  goToToday: () => void;
  /** Se a semana atual contém hoje */
  isCurrentWeek: boolean;
  /** Primeira segunda-feira da semana */
  weekStart: Date;
  /** Última sexta-feira da semana */
  weekEnd: Date;
}

export function useWeekNavigator(options: UseWeekNavigatorOptions = {}): UseWeekNavigatorReturn {
  const { initialDate = new Date() } = options;

  // Data de referência para a semana (sempre uma segunda-feira)
  const [weekReference, setWeekReference] = React.useState(() => {
    return startOfWeek(initialDate, { weekStartsOn: 1 }); // 1 = Monday
  });

  // Data selecionada
  const [selectedDate, setSelectedDate] = React.useState(() => {
    // Se for sábado ou domingo, seleciona a sexta
    const dayOfWeek = getDay(initialDate);
    if (dayOfWeek === 0) {
      // Domingo -> sexta anterior
      return new Date(initialDate.getTime() - 2 * 24 * 60 * 60 * 1000);
    }
    if (dayOfWeek === 6) {
      // Sábado -> sexta
      return new Date(initialDate.getTime() - 1 * 24 * 60 * 60 * 1000);
    }
    return initialDate;
  });

  // Calcular dias úteis da semana (seg-sex)
  const weekDays = React.useMemo<WeekDay[]>(() => {
    const weekStart = weekReference;
    const weekEnd = new Date(weekReference);
    weekEnd.setDate(weekReference.getDate() + 4); // +4 dias = sexta

    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map((date) => ({
      date,
      dayOfWeek: format(date, 'EEE', { locale: ptBR }),
      dayNumber: date.getDate(),
      isSelected: isSameDay(date, selectedDate),
      isToday: isToday(date),
    }));
  }, [weekReference, selectedDate]);

  // Verificar se é a semana atual
  const isCurrentWeek = React.useMemo(() => {
    return isSameWeek(weekReference, new Date(), { weekStartsOn: 1 });
  }, [weekReference]);

  // Callbacks de navegação
  const goToPreviousWeek = React.useCallback(() => {
    setWeekReference((prev) => subWeeks(prev, 1));
  }, []);

  const goToNextWeek = React.useCallback(() => {
    setWeekReference((prev) => addWeeks(prev, 1));
  }, []);

  const goToToday = React.useCallback(() => {
    const today = new Date();
    const dayOfWeek = getDay(today);

    // Atualizar referência da semana
    setWeekReference(startOfWeek(today, { weekStartsOn: 1 }));

    // Se for fim de semana, seleciona sexta
    if (dayOfWeek === 0) {
      setSelectedDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000));
    } else if (dayOfWeek === 6) {
      setSelectedDate(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000));
    } else {
      setSelectedDate(today);
    }
  }, []);

  // Handler para seleção de data (também atualiza a semana se necessário)
  const handleSetSelectedDate = React.useCallback((date: Date) => {
    setSelectedDate(date);
    // Verificar se a data está na semana atual
    if (!isSameWeek(date, weekReference, { weekStartsOn: 1 })) {
      setWeekReference(startOfWeek(date, { weekStartsOn: 1 }));
    }
  }, [weekReference]);

  // Calcular weekStart e weekEnd
  const weekStart = weekReference;
  const weekEnd = new Date(weekReference);
  weekEnd.setDate(weekReference.getDate() + 4);

  return {
    weekDays,
    selectedDate,
    setSelectedDate: handleSetSelectedDate,
    weekReference,
    goToPreviousWeek,
    goToNextWeek,
    goToToday,
    isCurrentWeek,
    weekStart,
    weekEnd,
  };
}
