'use client';

/**
 * ObrigacoesCalendarCompact - Calendário compacto (Glass Briefing)
 *
 * Mostra um calendário mensal compacto à esquerda com indicadores
 * de dias que possuem parcelas. Usado no layout master-detail da view mensal.
 */

import * as React from 'react';
import {
  format,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getCalendarCells } from '@/components/calendar/helpers';

import type { AcordoComParcelas } from '../../domain';

// =============================================================================
// TYPES
// =============================================================================

interface ObrigacoesCalendarCompactProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  obrigacoes: AcordoComParcelas[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  className?: string;
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// =============================================================================
// COMPONENT
// =============================================================================

export function ObrigacoesCalendarCompact({
  selectedDate,
  onDateSelect,
  obrigacoes,
  currentMonth,
  onMonthChange,
  className,
}: ObrigacoesCalendarCompactProps) {
  const cells = React.useMemo(() => getCalendarCells(currentMonth), [currentMonth]);

  const parcelasByDay = React.useMemo(() => {
    const map = new Map<
      string,
      { total: number; hasVencido: boolean; hasPago: boolean; hasPendente: boolean }
    >();
    obrigacoes.forEach((acordo) => {
      acordo.parcelas?.forEach((parcela) => {
        if (!parcela.dataVencimento) return;
        const dateKey = format(parseISO(parcela.dataVencimento), 'yyyy-MM-dd');
        const existing = map.get(dateKey) || {
          total: 0,
          hasVencido: false,
          hasPago: false,
          hasPendente: false,
        };
        existing.total++;
        if (parcela.status === 'atrasada') existing.hasVencido = true;
        else if (parcela.status === 'paga' || parcela.status === 'recebida')
          existing.hasPago = true;
        else existing.hasPendente = true;
        map.set(dateKey, existing);
      });
    });
    return map;
  }, [obrigacoes]);

  const handlePreviousMonth = React.useCallback(
    () => onMonthChange(subMonths(currentMonth, 1)),
    [currentMonth, onMonthChange],
  );

  const handleNextMonth = React.useCallback(
    () => onMonthChange(addMonths(currentMonth, 1)),
    [currentMonth, onMonthChange],
  );

  const handleGoToToday = React.useCallback(() => {
    const today = new Date();
    onMonthChange(today);
    onDateSelect(today);
  }, [onMonthChange, onDateSelect]);

  const monthYearText = React.useMemo(() => {
    const monthName = format(currentMonth, 'MMMM', { locale: ptBR });
    const year = format(currentMonth, 'yyyy');
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
  }, [currentMonth]);

  const isCurrentMonth = React.useMemo(() => {
    const today = new Date();
    return (
      currentMonth.getFullYear() === today.getFullYear() &&
      currentMonth.getMonth() === today.getMonth()
    );
  }, [currentMonth]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header: Navegação de mês */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-lg hover:bg-white/5"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Mês anterior</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mês anterior</TooltipContent>
          </Tooltip>

          <span className="text-xs font-medium text-foreground/85 select-none min-w-32 text-center tabular-nums">
            {monthYearText}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-lg hover:bg-white/5"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Próximo mês</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Próximo mês</TooltipContent>
          </Tooltip>
        </div>

        {!isCurrentMonth && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-[11px] rounded-lg bg-white/4 hover:bg-white/8"
            onClick={handleGoToToday}
          >
            Hoje
          </Button>
        )}
      </div>

      {/* Grid do calendário */}
      <div className="rounded-xl border border-border/10 overflow-hidden bg-white/2">
        {/* Header: dias da semana */}
        <div className="grid grid-cols-7 bg-white/3 border-b border-border/10">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="flex items-center justify-center py-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Corpo: dias do mês */}
        <div className="grid grid-cols-7">
          {cells.map((cell, index) => {
            const dateKey = format(cell.date, 'yyyy-MM-dd');
            const dayInfo = parcelasByDay.get(dateKey);
            const hasParcelas = !!dayInfo && dayInfo.total > 0;
            const isSelected = isSameDay(cell.date, selectedDate);
            const isTodayDate = isToday(cell.date);

            let indicatorColor = 'bg-primary';
            if (hasParcelas && dayInfo) {
              if (dayInfo.hasVencido) indicatorColor = 'bg-destructive';
              else if (dayInfo.hasPendente) indicatorColor = 'bg-primary';
              else if (dayInfo.hasPago) indicatorColor = 'bg-success';
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => onDateSelect(cell.date)}
                className={cn(
                  'relative flex flex-col items-center justify-center py-2 transition-colors cursor-pointer outline-none',
                  'hover:bg-white/5 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-inset',
                  index % 7 !== 6 && 'border-r border-border/8',
                  index < cells.length - 7 && 'border-b border-border/8',
                  !cell.currentMonth && 'text-muted-foreground/30 bg-white/1.5',
                  cell.currentMonth && !isSelected && !isTodayDate && 'text-foreground/80',
                  isTodayDate && !isSelected && 'font-semibold text-primary',
                  isSelected && 'bg-primary/12 text-primary font-semibold',
                )}
              >
                <span
                  className={cn(
                    'text-xs leading-none tabular-nums',
                    isTodayDate &&
                      !isSelected &&
                      'h-6 w-6 flex items-center justify-center rounded-full ring-1 ring-primary/40',
                  )}
                >
                  {cell.day}
                </span>

                {hasParcelas && dayInfo && (
                  <div className="flex items-center gap-0.5 mt-1">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isSelected ? 'bg-primary' : indicatorColor,
                      )}
                    />
                    {dayInfo.total > 1 && (
                      <span
                        className={cn(
                          'text-[9px] leading-none tabular-nums',
                          isSelected ? 'text-primary' : 'text-muted-foreground/55',
                        )}
                      >
                        {dayInfo.total}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Pendente</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
          <span>Vencido</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span>Pago</span>
        </div>
      </div>
    </div>
  );
}
