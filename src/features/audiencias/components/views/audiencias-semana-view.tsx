/**
 * AudienciasSemanaView — Week view com cards agrupados por dia
 * ============================================================================
 * Apresentação visual: cards em colunas por dia da semana, com GlassPanel.
 * Componente puramente presentacional — recebe dados e callbacks.
 * ============================================================================
 */

'use client';

import { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  format,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Gavel,
  Video,
  Building2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/app/app/dashboard/mock/widgets/primitives';
import type { Audiencia } from '../../domain';
import { StatusAudiencia } from '../../domain';
import { calcPrepItems, calcPrepScore } from '../prep-score';
import { HearingCountdown } from '../hearing-countdown';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AudienciasSemanaViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewDetail: (audiencia: Audiencia) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  try {
    return format(parseISO(iso), 'HH:mm');
  } catch {
    return '—';
  }
}

// ─── Component ────────────────────────────────────────────────────────────

export function AudienciasSemanaView({
  audiencias,
  currentDate,
  onDateChange,
  onViewDetail,
}: AudienciasSemanaViewProps) {
  const weekStart = startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const audienciasByDay = useMemo(() => {
    const map = new Map<string, Audiencia[]>();
    weekDays.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const dayAudiencias = audiencias
        .filter((a) => {
          try {
            return isSameDay(parseISO(a.dataInicio), day);
          } catch {
            return false;
          }
        })
        .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));
      map.set(key, dayAudiencias);
    });
    return map;
  }, [audiencias, weekDays]);

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    onDateChange(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    onDateChange(d);
  };

  const handleToday = () => onDateChange(new Date());

  const isCurrentWeek = weekDays.some((d) => isToday(d));
  const weekLabel = `${format(weekStart, "d 'de' MMM", { locale: ptBR })} — ${format(weekEnd, "d 'de' MMM", { locale: ptBR })}`;

  return (
    <div className="space-y-4">
      {/* Week Navigator */}
      <div className="flex items-center gap-2">
        <button onClick={handlePrevWeek} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 cursor-pointer">
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={handleToday}
          className={cn(
            'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
            isCurrentWeek ? 'bg-primary/12 text-primary' : 'bg-border/8 text-muted-foreground/50 hover:bg-border/15',
          )}
        >
          Hoje
        </button>
        <button onClick={handleNextWeek} className="p-1.5 rounded-lg hover:bg-white/4 transition-colors text-muted-foreground/55 cursor-pointer">
          <ChevronRight className="size-4" />
        </button>
        <span className="text-sm font-medium capitalize ml-1">{weekLabel}</span>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayAudiencias = audienciasByDay.get(key) ?? [];
          const today = isToday(day);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <GlassPanel
              key={key}
              depth={today ? 2 : 1}
              className={cn('p-3 min-h-32', isWeekend && 'opacity-60')}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    'text-[10px] font-semibold uppercase tracking-wider',
                    today ? 'text-primary' : 'text-muted-foreground/50',
                  )}>
                    {format(day, 'EEE', { locale: ptBR })}
                  </span>
                  <span className={cn(
                    'text-sm font-bold tabular-nums',
                    today
                      ? 'bg-primary text-primary-foreground size-6 rounded-full flex items-center justify-center text-[11px]'
                      : 'text-foreground/70',
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                {dayAudiencias.length > 0 && (
                  <span className="text-[9px] tabular-nums text-muted-foreground/40">
                    {dayAudiencias.length}
                  </span>
                )}
              </div>

              {/* Audiencias */}
              {dayAudiencias.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-4">
                  <span className="text-[9px] text-muted-foreground/30">—</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {dayAudiencias.map((a) => (
                    <WeekDayCard key={a.id} audiencia={a} onClick={() => onViewDetail(a)} />
                  ))}
                </div>
              )}
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}

// ─── Internal: Week Day Card ──────────────────────────────────────────────

function WeekDayCard({ audiencia, onClick }: { audiencia: Audiencia; onClick: () => void }) {
  const now = new Date();
  let isPast = false;
  let isOngoing = false;
  let isFinalizada = audiencia.status === StatusAudiencia.Finalizada;
  try {
    isPast = parseISO(audiencia.dataFim) < now;
    isOngoing = parseISO(audiencia.dataInicio) <= now && parseISO(audiencia.dataFim) >= now;
  } catch { /* skip */ }

  const prepScore = calcPrepScore(calcPrepItems(audiencia));
  const prepStatus = prepScore >= 80 ? 'good' : prepScore >= 50 ? 'warning' : 'danger';
  const isVirtual = audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida';

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-2 rounded-lg border transition-all duration-200 cursor-pointer',
        'border-border/10 hover:border-border/20 hover:shadow-sm hover:scale-[1.01]',
        (isPast || isFinalizada) && 'opacity-50',
        isOngoing && 'ring-1 ring-success/20 border-success/15',
      )}
    >
      {/* Time + Status */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] tabular-nums font-medium text-foreground/60">
          {fmtTime(audiencia.dataInicio)}
        </span>
        <div className="flex items-center gap-1">
          {isOngoing && <span className="size-1.5 rounded-full bg-success animate-pulse" />}
          {isVirtual && <Video className="size-2 text-info/40" />}
          {!isVirtual && audiencia.modalidade === 'presencial' && <Building2 className="size-2 text-warning/40" />}
        </div>
      </div>

      {/* Type */}
      <p className="text-[10px] font-medium text-foreground truncate mt-0.5">
        {audiencia.tipoDescricao || 'Audiência'}
      </p>

      {/* Parties */}
      {audiencia.poloAtivoNome && (
        <p className="text-[8px] text-muted-foreground/40 truncate mt-0.5">
          {audiencia.poloAtivoNome}
        </p>
      )}

      {/* Bottom: TRT + Prep */}
      <div className="flex items-center justify-between mt-1">
        {audiencia.trt && (
          <span className="text-[7px] font-semibold px-1 py-px rounded bg-primary/5 text-primary/40">{audiencia.trt}</span>
        )}
        <span className={cn(
          'text-[7px] font-bold tabular-nums',
          prepStatus === 'good' ? 'text-success' : prepStatus === 'warning' ? 'text-warning' : 'text-destructive',
        )}>
          {prepScore}%
        </span>
      </div>
    </button>
  );
}
