/**
 * ObrigacoesSemanaView — Week view com cards de parcelas agrupadas por dia
 * ============================================================================
 * Mesmo padrão visual de ExpedientesSemanaView, AudienciasSemanaView e
 * PericiasSemanaView: grid 5 colunas (seg-sex), GlassPanel por dia, cards
 * por item (aqui: parcela de acordo, não acordo diretamente — o vencimento
 * é por parcela).
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
  differenceInCalendarDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { SemanticBadge } from '@/components/ui/semantic-badge';

import type { AcordoComParcelas, Parcela } from '../../domain';
import { TIPO_LABELS } from '../../domain';
import { Text } from '@/components/ui/typography';

// =============================================================================
// TYPES
// =============================================================================

type Urgency = 'critico' | 'alto' | 'medio' | 'baixo' | 'ok';

interface ParcelaDisplay {
  parcela: Parcela;
  acordo: AcordoComParcelas;
}

export interface ObrigacoesSemanaViewProps {
  acordos: AcordoComParcelas[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewDetail: (acordo: AcordoComParcelas) => void;
}

// =============================================================================
// URGENCY MAPPINGS
// =============================================================================

const URGENCY_BORDER: Record<Urgency, string> = {
  critico: 'border-l-destructive/70',
  alto: 'border-l-warning/60',
  medio: 'border-l-primary/50',
  baixo: 'border-l-success/40',
  ok: 'border-l-border/30',
};

const URGENCY_DOT: Record<Urgency, string> = {
  critico: 'bg-destructive',
  alto: 'bg-warning',
  medio: 'bg-info',
  baixo: 'bg-success',
  ok: 'bg-muted-foreground/30',
};

const URGENCY_BADGE: Record<Urgency, string> = {
  critico: 'bg-destructive/15 text-destructive',
  alto: 'bg-warning/15 text-warning',
  medio: 'bg-info/15 text-info',
  baixo: 'bg-success/15 text-success',
  ok: 'bg-muted/30 text-muted-foreground/50',
};

// =============================================================================
// HELPERS
// =============================================================================

const CURRENCY = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

function isFinalizada(p: Parcela): boolean {
  return p.status === 'paga' || p.status === 'recebida' || p.status === 'cancelada';
}

function getUrgency(p: Parcela): Urgency {
  if (isFinalizada(p)) return 'ok';
  try {
    const dias = differenceInCalendarDays(parseISO(p.dataVencimento), new Date());
    if (dias < 0) return 'critico';
    if (dias === 0) return 'alto';
    if (dias <= 3) return 'medio';
    return 'baixo';
  } catch {
    return 'baixo';
  }
}

function getCountdownLabel(p: Parcela): string | null {
  if (isFinalizada(p)) return null;
  try {
    const dias = differenceInCalendarDays(parseISO(p.dataVencimento), new Date());
    return `${dias}d`;
  } catch {
    return null;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ObrigacoesSemanaView({
  acordos,
  currentDate,
  onDateChange,
  onViewDetail,
}: ObrigacoesSemanaViewProps) {
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 }),
    [currentDate],
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 }),
    [currentDate],
  );

  // Apenas dias úteis (seg-sex) — vencimentos de parcelas não ocorrem no fim de semana
  const weekDays = useMemo(
    () =>
      eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(
        (d) => d.getDay() !== 0 && d.getDay() !== 6,
      ),
    [weekStart, weekEnd],
  );

  // Expande acordos → parcelas e agrupa por dia
  const parcelasByDay = useMemo(() => {
    const urgencyOrder: Record<Urgency, number> = {
      critico: 0,
      alto: 1,
      medio: 2,
      baixo: 3,
      ok: 4,
    };

    const map = new Map<string, ParcelaDisplay[]>();

    weekDays.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const items: ParcelaDisplay[] = [];

      acordos.forEach((acordo) => {
        acordo.parcelas?.forEach((parcela) => {
          if (!parcela.dataVencimento) return;
          try {
            if (isSameDay(parseISO(parcela.dataVencimento), day)) {
              items.push({ parcela, acordo });
            }
          } catch {
            /* noop */
          }
        });
      });

      items.sort((a, b) => {
        const ua = getUrgency(a.parcela);
        const ub = getUrgency(b.parcela);
        return (
          urgencyOrder[ua] - urgencyOrder[ub] ||
          a.parcela.numeroParcela - b.parcela.numeroParcela
        );
      });

      map.set(key, items);
    });
    return map;
  }, [acordos, weekDays]);

  // Navigation
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
  const friday = weekDays[weekDays.length - 1];
  const weekLabel = `${format(weekStart, "d 'de' MMM", { locale: ptBR })} — ${format(friday, "d 'de' MMM", { locale: ptBR })}`;

  return (
    <div className={cn("stack-default")}>
      {/* Week Navigator */}
      <div className={cn("flex items-center inline-tight")}>
        <button
          onClick={handlePrevWeek}
          className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "p-1.5 rounded-lg hover:bg-foreground/4 transition-colors text-muted-foreground/55 cursor-pointer")}
          aria-label="Semana anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={handleToday}
          className={cn(
            /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
            isCurrentWeek
              ? 'bg-primary/12 text-primary'
              : 'bg-border/8 text-muted-foreground/50 hover:bg-border/15',
          )}
        >
          Hoje
        </button>
        <button
          onClick={handleNextWeek}
          className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "p-1.5 rounded-lg hover:bg-foreground/4 transition-colors text-muted-foreground/55 cursor-pointer")}
          aria-label="Próxima semana"
        >
          <ChevronRight className="size-4" />
        </button>
        <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium capitalize ml-1")}>{weekLabel}</span>
      </div>

      {/* Week Grid — 5 colunas (seg-sex) */}
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start")}>
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayItems = parcelasByDay.get(key) ?? [];
          const today = isToday(day);

          return (
            <GlassPanel
              key={key}
              depth={today ? 2 : 1}
              className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "p-4 min-h-40")}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-3">
                <div className={cn("flex items-center inline-tight")}>
                  <span
                    className={cn(
                      /* design-system-escape: font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ 'text-[10px] font-semibold uppercase tracking-wider',
                      today ? 'text-primary' : 'text-muted-foreground/55',
                    )}
                  >
                    {format(day, 'EEE', { locale: ptBR })}
                  </span>
                  <span
                    className={cn(
                      /* design-system-escape: font-bold → className de <Text>/<Heading> */ 'text-body-sm font-bold tabular-nums',
                      today
                        ? 'bg-primary text-primary-foreground size-6 rounded-full flex items-center justify-center text-[11px]'
                        : 'text-foreground/80',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                {dayItems.length > 0 && (
                  <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[10px] tabular-nums text-muted-foreground/45 font-medium")}>
                    {dayItems.length}
                  </span>
                )}
              </div>

              {/* Parcelas */}
              {dayItems.length === 0 ? (
                <div className={cn(/* design-system-escape: py-6 padding direcional sem Inset equiv. */ "flex items-center justify-center py-6")}>
                  <Text variant="caption" className="text-muted-foreground/30">—</Text>
                </div>
              ) : (
                <div className={cn("stack-tight")}>
                  {dayItems.map((item) => (
                    <WeekDayCard
                      key={item.parcela.id}
                      item={item}
                      onClick={() => onViewDetail(item.acordo)}
                    />
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

// =============================================================================
// WEEK DAY CARD
// =============================================================================

function WeekDayCard({
  item,
  onClick,
}: {
  item: ParcelaDisplay;
  onClick: () => void;
}) {
  const { parcela, acordo } = item;
  const urgency = getUrgency(parcela);
  const finalizada = isFinalizada(parcela);
  const countdownLabel = getCountdownLabel(parcela);
  const isRecebimento = acordo.direcao === 'recebimento';
  const tipoLabel = TIPO_LABELS[acordo.tipo] ?? acordo.tipo;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        /* design-system-escape: p-3 → usar <Inset> */ 'w-full text-left p-3 rounded-xl border border-l-[3px] transition-all duration-200 cursor-pointer',
        'bg-card border-border/40 hover:border-border/60 hover:shadow-sm hover:scale-[1.01]',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        URGENCY_BORDER[urgency],
        finalizada && 'opacity-60',
      )}
    >
      {/* Row 1: Valor + urgency */}
      <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center justify-between gap-1")}>
        <Text variant="caption" className="tabular-nums font-semibold text-foreground/90">
          {CURRENCY.format(parcela.valorBrutoCreditoPrincipal)}
        </Text>
        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
          {!finalizada && urgency !== 'ok' && (
            <span className={cn('size-2 rounded-full', URGENCY_DOT[urgency])} />
          )}
          {countdownLabel && (
            <span
              className={cn(
                /* design-system-escape: font-bold → className de <Text>/<Heading>; px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ 'text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-full',
                URGENCY_BADGE[urgency],
              )}
            >
              {countdownLabel}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Tipo + Direção */}
      <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 mt-1.5 flex-wrap")}>
        <SemanticBadge
          category="obrigacao_tipo"
          value={acordo.tipo}
          className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[9px] font-semibold")}
        >
          {tipoLabel}
        </SemanticBadge>
        <span
          className={cn(
            /* design-system-escape: gap-0.5 gap sem token DS; px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ 'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-semibold border',
            isRecebimento
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-destructive/10 text-destructive border-destructive/20',
          )}
        >
          {isRecebimento ? (
            <ArrowDown className="size-2.5" />
          ) : (
            <ArrowUp className="size-2.5" />
          )}
          {isRecebimento ? 'Receber' : 'Pagar'}
        </span>
      </div>

      {/* Row 3: Parcela N/Total */}
      <p className="text-[10px] text-muted-foreground/55 mt-1 truncate">
        Parcela {parcela.numeroParcela} de {acordo.numeroParcelas}
      </p>

      {/* Row 4: Processo */}
      {acordo.processo?.numero_processo && (
        <p className="text-[10px] text-muted-foreground/55 mt-0.5 tabular-nums truncate">
          {acordo.processo.numero_processo}
        </p>
      )}

      {/* Row 5: Partes */}
      {acordo.processo?.nome_parte_autora && acordo.processo?.nome_parte_re && (
        <p className="text-[9px] text-muted-foreground/45 mt-0.5 truncate">
          {acordo.processo.nome_parte_autora}{' '}
          <span className="text-muted-foreground/30">vs</span>{' '}
          {acordo.processo.nome_parte_re}
        </p>
      )}
    </div>
  );
}
