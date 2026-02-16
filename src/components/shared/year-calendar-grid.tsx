'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface YearCalendarGridProps {
  /** Ano a ser exibido */
  year: number;
  /** Verifica se um dia específico tem conteúdo (para destaque visual) */
  hasDayContent: (month: number, day: number) => boolean;
  /** Handler de clique no dia */
  onDayClick: (month: number, day: number) => void;
  /** Classe adicional para o container externo */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Semana começando em segunda-feira (padrão pt-BR) */
const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

/** 6 linhas × 7 colunas = altura consistente para todos os meses */
const CELLS_PER_MONTH = 42;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Gera array de dias do mês com offset para segunda-feira como primeiro dia.
 * Sempre retorna 42 células para manter altura uniforme entre os cards.
 */
function getDiasMes(year: number, month: number): (number | null)[] {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=dom, 6=sab
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const days: (number | null)[] = [];
  for (let i = 0; i < offset; i++) days.push(null);
  for (let i = 1; i <= lastDay; i++) days.push(i);
  while (days.length < CELLS_PER_MONTH) days.push(null);
  return days;
}

function checkIsToday(year: number, month: number, day: number): boolean {
  const today = new Date();
  return (
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day
  );
}

// =============================================================================
// MONTH CARD (memoized)
// =============================================================================

interface MonthCardProps {
  year: number;
  monthIdx: number;
  monthName: string;
  hasDayContent: (month: number, day: number) => boolean;
  onDayClick: (month: number, day: number) => void;
}

const MonthCard = React.memo(function MonthCard({
  year,
  monthIdx,
  monthName,
  hasDayContent,
  onDayClick,
}: MonthCardProps) {
  const days = React.useMemo(() => getDiasMes(year, monthIdx), [year, monthIdx]);

  return (
    <div
      className="rounded-lg border bg-card shadow-sm"
      role="region"
      aria-label={`Calendário de ${monthName} de ${year}`}
    >
      {/* Header do mês */}
      <div className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {monthName}
      </div>

      {/* Grid único: headers dos dias + células dos dias */}
      <div className="grid grid-cols-7 place-items-center px-2 pb-2">
        {/* Headers dos dias da semana */}
        {WEEKDAYS.map((dayName, i) => (
          <div
            key={i}
            className={cn(
              'pb-2 text-[10px] font-medium text-muted-foreground',
              i >= 5 && 'text-muted-foreground/60',
            )}
          >
            {dayName}
          </div>
        ))}

        {/* Células dos dias */}
        {days.map((day, i) => {
          if (!day) {
            return <div key={`e-${i}`} className="h-7 w-7" />;
          }

          const isToday = checkIsToday(year, monthIdx, day);
          const hasContent = hasDayContent(monthIdx, day);
          const isWeekend = i % 7 >= 5;

          return (
            <div
              key={`d-${day}`}
              onClick={() => hasContent && onDayClick(monthIdx, day)}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs tabular-nums transition-colors',
                isToday && 'bg-primary font-bold text-primary-foreground',
                !isToday && hasContent &&
                  'cursor-pointer bg-primary/15 font-medium text-primary hover:bg-primary/25',
                !isToday && !hasContent && isWeekend && 'text-muted-foreground/50',
                !isToday && !hasContent && !isWeekend && 'text-muted-foreground',
              )}
              {...(hasContent && {
                role: 'button',
                tabIndex: 0,
                onKeyDown: (e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDayClick(monthIdx, day);
                  }
                },
                'aria-label': `${day} de ${monthName}`,
              })}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function YearCalendarGrid({
  year,
  hasDayContent,
  onDayClick,
  className,
}: YearCalendarGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {MONTHS.map((monthName, monthIdx) => (
        <MonthCard
          key={monthName}
          year={year}
          monthIdx={monthIdx}
          monthName={monthName}
          hasDayContent={hasDayContent}
          onDayClick={onDayClick}
        />
      ))}
    </div>
  );
}
