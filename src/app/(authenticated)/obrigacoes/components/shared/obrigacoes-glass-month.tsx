'use client';

/**
 * ObrigacoesGlassMonth — Grid mensal completo (padrão expedientes/audiências)
 * ============================================================================
 * Calendário mensal com 7 colunas, dots de urgência por dia e popover ao
 * clicar em dia com parcelas. Agrupa por data de vencimento de parcela.
 * ============================================================================
 */

import * as React from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  differenceInCalendarDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X, ArrowDown, ArrowUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SemanticBadge } from '@/components/ui/semantic-badge';

import type { AcordoComParcelas, Parcela } from '../../domain';
import { TIPO_LABELS } from '../../domain';
import { Text } from '@/components/ui/typography';

// =============================================================================
// TYPES & URGENCY
// =============================================================================

type Urgency = 'critico' | 'alto' | 'medio' | 'baixo' | 'ok';

interface ParcelaDisplay {
  parcela: Parcela;
  acordo: AcordoComParcelas;
}

export interface ObrigacoesGlassMonthProps {
  acordos: AcordoComParcelas[];
  onViewDetail?: (acordo: AcordoComParcelas) => void;
}

const URGENCY_DOT: Record<Urgency, string> = {
  critico: 'bg-destructive',
  alto: 'bg-warning',
  medio: 'bg-info',
  baixo: 'bg-success',
  ok: 'bg-muted-foreground/30',
};

const URGENCY_BORDER: Record<Urgency, string> = {
  critico: 'border-l-destructive/70',
  alto: 'border-l-warning/60',
  medio: 'border-l-primary/50',
  baixo: 'border-l-success/40',
  ok: 'border-l-border/30',
};

const WEEKDAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const CURRENCY = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

// =============================================================================
// HELPERS
// =============================================================================

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

function getUrgencyLabel(level: Urgency): string {
  switch (level) {
    case 'critico':
      return 'Vencido';
    case 'alto':
      return 'Hoje';
    case 'medio':
      return 'Próximos';
    case 'baixo':
      return 'No prazo';
    case 'ok':
      return 'Outros';
  }
}

function groupByDay(acordos: AcordoComParcelas[]): Map<string, ParcelaDisplay[]> {
  const map = new Map<string, ParcelaDisplay[]>();
  acordos.forEach((acordo) => {
    acordo.parcelas?.forEach((parcela) => {
      if (!parcela.dataVencimento) return;
      try {
        const key = format(parseISO(parcela.dataVencimento), 'yyyy-MM-dd');
        const list = map.get(key) || [];
        list.push({ parcela, acordo });
        map.set(key, list);
      } catch {
        // ignore invalid dates
      }
    });
  });
  return map;
}

function computeSummary(acordos: AcordoComParcelas[]) {
  let total = 0;
  let vencidos = 0;
  let hoje = 0;
  let proximos = 0;
  acordos.forEach((acordo) => {
    acordo.parcelas?.forEach((parcela) => {
      if (!parcela.dataVencimento || isFinalizada(parcela)) return;
      total++;
      const level = getUrgency(parcela);
      if (level === 'critico') vencidos++;
      else if (level === 'alto') hoje++;
      else if (level === 'medio') proximos++;
    });
  });
  return { total, vencidos, hoje, proximos };
}

// =============================================================================
// DAY CELL
// =============================================================================

function DayCell({
  day,
  itens,
  isCurrentMonth,
  onSelect,
}: {
  day: Date;
  itens: ParcelaDisplay[];
  isCurrentMonth: boolean;
  onSelect: (day: Date, itens: ParcelaDisplay[]) => void;
}) {
  const today = isToday(day);
  const count = itens.length;
  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

  return (
    <button
      type="button"
      onClick={() => count > 0 && onSelect(day, itens)}
      className={cn(
        /* design-system-escape: p-2.5 → usar <Inset> */ 'relative w-full min-h-25 sm:min-h-30 p-2.5 rounded-xl transition-all duration-150 text-left flex flex-col h-full',
        'border border-border/40',
        'hover:bg-accent/40 hover:border-border/60',
        'active:bg-accent/20 active:scale-[0.98]',
        isWeekend && 'bg-muted/25',
        !isCurrentMonth && 'opacity-45',
        count > 0 && 'cursor-pointer',
        count === 0 && 'cursor-default',
      )}
    >
      <div
        className={cn(
          /* design-system-escape: font-semibold → className de <Text>/<Heading> */ 'text-body-sm font-semibold w-7 h-7 flex items-center justify-center',
          today
            ? /* design-system-escape: font-bold → className de <Text>/<Heading> */ 'bg-primary text-primary-foreground rounded-full font-bold'
            : 'text-foreground/85',
        )}
      >
        {format(day, 'd')}
      </div>

      {count > 0 && count < 3 && (
        <div className={cn(/* design-system-escape: gap-1 gap sem token DS; pt-1.5 padding direcional sem Inset equiv. */ "flex gap-1 mt-auto pt-1.5 flex-wrap")}>
          {itens.map((item) => (
            <div
              key={item.parcela.id}
              className={cn(
                'w-1.75 h-1.75 rounded-full shrink-0',
                URGENCY_DOT[getUrgency(item.parcela)],
              )}
            />
          ))}
        </div>
      )}

      {count >= 3 && (
        <div className={cn(/* design-system-escape: gap-1 gap sem token DS; pt-1.5 padding direcional sem Inset equiv. */ "flex gap-1 mt-auto pt-1.5")}>
          <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading>; px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "text-[10px] font-bold text-primary bg-primary/15 rounded-full px-1.5 py-0.5 inline-flex items-center justify-center min-w-4.5")}>
            {count}
          </span>
        </div>
      )}
    </button>
  );
}

// =============================================================================
// POPOVER ITEM
// =============================================================================

function ParcelaItem({
  item,
  onClick,
}: {
  item: ParcelaDisplay;
  onClick: () => void;
}) {
  const { parcela, acordo } = item;
  const urgency = getUrgency(parcela);
  const isRecebimento = acordo.direcao === 'recebimento';
  const tipoLabel = TIPO_LABELS[acordo.tipo] ?? acordo.tipo;

  let diasLabel = '—';
  try {
    const dias = differenceInCalendarDays(parseISO(parcela.dataVencimento), new Date());
    if (dias < 0) diasLabel = `${Math.abs(dias)}d atraso`;
    else if (dias === 0) diasLabel = 'Hoje';
    else diasLabel = `${dias}d restantes`;
  } catch {
    /* noop */
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        /* design-system-escape: p-2.5 → usar <Inset> */ 'w-full text-left rounded-lg p-2.5 border border-l-[3px] border-border/30 bg-muted/15',
        'hover:bg-accent/40 transition-colors cursor-pointer',
        URGENCY_BORDER[urgency],
      )}
    >
      {/* Valor + prazo */}
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center justify-between gap-2")}>
        <Text variant="caption" className="font-semibold text-foreground/85 tabular-nums">
          {CURRENCY.format(parcela.valorBrutoCreditoPrincipal)}
        </Text>
        <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; px-1.75 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "text-[10px] font-semibold tracking-[0.03em] px-1.75 py-0.5 rounded-full border border-border/30 bg-muted/20 text-foreground/60 shrink-0")}>
          {diasLabel}
        </span>
      </div>

      {/* Tipo + Direção */}
      <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "mt-1.5 flex items-center gap-1.5 flex-wrap")}>
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

      {/* Parcela + processo */}
      <div className="mt-1 text-[11px] text-foreground/45 tabular-nums truncate">
        Parcela {parcela.numeroParcela}/{acordo.numeroParcelas}
        {acordo.processo?.numero_processo && ` · ${acordo.processo.numero_processo}`}
      </div>

      {/* Partes */}
      {(acordo.processo?.nome_parte_autora || acordo.processo?.nome_parte_re) && (
        <div className="mt-1 text-[11px] text-foreground/45 truncate">
          {acordo.processo?.nome_parte_autora || '—'}
          <span className="text-foreground/25"> vs </span>
          {acordo.processo?.nome_parte_re || '—'}
        </div>
      )}
    </button>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ObrigacoesGlassMonth({
  acordos,
  onViewDetail,
}: ObrigacoesGlassMonthProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() =>
    startOfMonth(new Date()),
  );
  const [popoverDay, setPopoverDay] = React.useState<Date | null>(null);

  const dayMap = React.useMemo(() => groupByDay(acordos), [acordos]);
  const summary = React.useMemo(() => computeSummary(acordos), [acordos]);

  // Build calendar grid (Monday-start)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const handleDaySelect = React.useCallback((day: Date) => {
    setPopoverDay(day);
  }, []);

  const popoverItems = React.useMemo(() => {
    if (!popoverDay) return [];
    const key = format(popoverDay, 'yyyy-MM-dd');
    return dayMap.get(key) || [];
  }, [popoverDay, dayMap]);

  return (
    <GlassPanel depth={1} className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; sm:p-6 sem equivalente DS */ "p-4 sm:p-6 flex flex-col")}>
      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-6">
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-1")}>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-border/50 bg-accent/30 backdrop-blur-sm hover:bg-accent/50"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4 text-foreground/60" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-border/50 bg-accent/30 backdrop-blur-sm hover:bg-accent/50"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4 text-foreground/60" />
          </Button>
          <Button
            size="sm"
            className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "ml-1 rounded-full px-4 text-caption font-semibold")}
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
          >
            Hoje
          </Button>
        </div>

        <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading>; tracking-tight sem token DS */ "text-body font-bold tracking-tight text-center")}>
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR }).replace(
            /^\w/,
            (c) => c.toUpperCase(),
          )}
        </span>

        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex-1 flex justify-end gap-2 text-[11px] text-muted-foreground/60")}>
          <span>{summary.total} pendentes</span>
          {summary.vencidos > 0 && (
            <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-destructive/80 font-semibold")}>
              · {summary.vencidos} vencidas
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default">; px-1 padding direcional sem Inset equiv. */ "flex items-center gap-4 mb-4 px-1 flex-wrap")}>
        {(['critico', 'alto', 'medio', 'baixo'] as Urgency[]).map((level) => (
          <div key={level} className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
            <div className={cn('w-1.75 h-1.75 rounded-full', URGENCY_DOT[level])} />
            <span className="text-[11px] text-foreground/45">
              {getUrgencyLabel(level)}
            </span>
          </div>
        ))}
      </div>

      {/* Weekday Headers */}
      <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "grid grid-cols-7 gap-1.5 mb-1")}>
        {WEEKDAY_HEADERS.map((label, idx) => (
          <div
            key={label}
            className={cn(
              /* design-system-escape: font-semibold → className de <Text>/<Heading>; py-2 padding direcional sem Inset equiv. */ 'text-center text-[11px] font-semibold text-foreground/45 py-2',
              idx >= 5 && 'text-foreground/30',
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "grid grid-cols-7 gap-1.5 flex-1")}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const itens = dayMap.get(key) ?? [];
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isSelected = popoverDay && isSameDay(day, popoverDay);

          return (
            <Popover
              key={day.toISOString()}
              open={!!isSelected}
              onOpenChange={(open) => !open && setPopoverDay(null)}
            >
              <PopoverTrigger asChild>
                <div>
                  <DayCell
                    day={day}
                    itens={itens}
                    isCurrentMonth={isCurrentMonth}
                    onSelect={handleDaySelect}
                  />
                </div>
              </PopoverTrigger>
              {isSelected && popoverItems.length > 0 && (
                <PopoverContent
                  className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-96 p-0 ")}
                  align="center"
                  sideOffset={8}
                >
                  <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "flex items-center justify-between p-3 border-b border-border/30")}>
                    <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-body-sm font-semibold capitalize")}>
                      {format(day, "d 'de' MMMM", { locale: ptBR })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPopoverDay(null)}
                      className={cn(/* design-system-escape: p-1 → usar <Inset> */ "p-1 rounded-md hover:bg-muted/50 transition-colors")}
                      aria-label="Fechar"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <div className={cn(/* design-system-escape: p-2 → usar <Inset>; space-y-2 → migrar para <Stack gap="tight"> */ "max-h-96 overflow-y-auto p-2 space-y-2")}>
                    {popoverItems.map((item) => (
                      <ParcelaItem
                        key={item.parcela.id}
                        item={item}
                        onClick={() => {
                          setPopoverDay(null);
                          onViewDetail?.(item.acordo);
                        }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              )}
            </Popover>
          );
        })}
      </div>
    </GlassPanel>
  );
}
