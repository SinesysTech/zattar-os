'use client';

import * as React from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import {
  type Expediente,
  type UrgencyLevel,
  getExpedientePartyNames,
  getExpedienteUrgencyLevel,
} from '../domain';
import { URGENCY_BORDER, URGENCY_DOT, getExpedienteDiasRestantes } from './urgency-helpers';
import { ExpedienteVisualizarDialog } from './expediente-visualizar-dialog';
import { Text } from '@/components/ui/typography';

// =============================================================================
// HELPERS
// =============================================================================

const WEEKDAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function groupByDay(expedientes: Expediente[]): Map<string, Expediente[]> {
  const map = new Map<string, Expediente[]>();
  for (const exp of expedientes) {
    if (!exp.dataPrazoLegalParte) continue;
    try {
      const key = format(parseISO(exp.dataPrazoLegalParte), 'yyyy-MM-dd');
      const list = map.get(key) || [];
      list.push(exp);
      map.set(key, list);
    } catch {
      // ignore invalid dates
    }
  }
  return map;
}

function computeSummary(expedientes: Expediente[]) {
  let total = 0;
  let vencidos = 0;
  let hoje = 0;
  let proximos = 0;
  for (const exp of expedientes) {
    if (!exp.dataPrazoLegalParte) continue;
    if (exp.baixadoEm) continue;
    total++;
    const dias = getExpedienteDiasRestantes(exp);
    if (dias === null) continue;
    if (dias < 0 || exp.prazoVencido) vencidos++;
    else if (dias === 0) hoje++;
    else if (dias <= 3) proximos++;
  }
  return { total, vencidos, hoje, proximos };
}

function getUrgencyLabel(level: UrgencyLevel): string {
  switch (level) {
    case 'critico': return 'Vencido';
    case 'alto': return 'Hoje';
    case 'medio': return 'Próximos';
    case 'baixo': return 'No prazo';
    case 'ok': return 'Outros';
  }
}

// =============================================================================
// DAY CELL COMPONENT
// =============================================================================

function DayCell({
  day,
  expedientesDia,
  isCurrentMonth,
  onSelect,
}: {
  day: Date;
  expedientesDia: Expediente[];
  isCurrentMonth: boolean;
  onSelect: (day: Date, expedientes: Expediente[]) => void;
}) {
  const today = isToday(day);
  const count = expedientesDia.length;
  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

  return (
    <button
      type="button"
      onClick={() => count > 0 && onSelect(day, expedientesDia)}
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
      <div className={cn(
        /* design-system-escape: font-semibold → className de <Text>/<Heading> */ 'text-body-sm font-semibold w-7 h-7 flex items-center justify-center',
        today
          ? /* design-system-escape: font-bold → className de <Text>/<Heading> */ 'bg-primary text-primary-foreground rounded-full font-bold'
          : 'text-foreground/85',
      )}>
        {format(day, 'd')}
      </div>

      {count > 0 && count < 3 && (
        <div className={cn(/* design-system-escape: gap-1 gap sem token DS; pt-1.5 padding direcional sem Inset equiv. */ "flex gap-1 mt-auto pt-1.5 flex-wrap")}>
          {expedientesDia.map((exp) => (
            <div
              key={exp.id}
              className={cn(
                'w-1.75 h-1.75 rounded-full shrink-0',
                URGENCY_DOT[getExpedienteUrgencyLevel(exp)],
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
// POPOVER EXPEDIENTE ITEM
// =============================================================================

function ExpedienteItem({ expediente }: { expediente: Expediente }) {
  const urgency = getExpedienteUrgencyLevel(expediente);
  const dias = getExpedienteDiasRestantes(expediente);
  const partes = getExpedientePartyNames(expediente);
  const tipoExpediente =
    (expediente as Expediente & { tipoExpediente?: { tipoExpediente?: string } })
      .tipoExpediente?.tipoExpediente ?? 'Expediente';

  let diasLabel = '—';
  if (dias !== null) {
    if (dias < 0) diasLabel = `${Math.abs(dias)}d atraso`;
    else if (dias === 0) diasLabel = 'Hoje';
    else diasLabel = `${dias}d restantes`;
  }

  return (
    <div
      className={cn(
        /* design-system-escape: p-2.5 → usar <Inset> */ 'rounded-lg p-2.5 border border-border/50 bg-muted/15',
        'hover:bg-accent/40 transition-colors cursor-pointer',
        URGENCY_BORDER[urgency],
      )}
    >
      {/* Linha principal: tempo + tipo */}
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center justify-between gap-2")}>
        <Text variant="caption" className="font-semibold text-foreground/85 truncate">
          {tipoExpediente}
        </Text>
        <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; px-1.75 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "text-[10px] font-semibold tracking-[0.03em] px-1.75 py-0.5 rounded-full border border-border/50 bg-muted/20 text-foreground/60 shrink-0")}>
          {diasLabel}
        </span>
      </div>

      {/* Processo */}
      <Text variant="caption" className="mt-1.5 text-foreground/65 tabular-nums truncate">
        {expediente.numeroProcesso}
      </Text>

      {/* Partes */}
      <div className="mt-1 text-[11px] text-foreground/65 truncate">
        {(partes.autora || '—')}
        <span className="text-foreground/55"> vs </span>
        {(partes.re || '—')}
      </div>

      {/* Órgão Julgador */}
      {expediente.orgaoJulgadorOrigem && (
        <div className="mt-1 text-[11px] text-foreground/55 truncate">
          {expediente.orgaoJulgadorOrigem}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export interface ExpedientesMonthWrapperProps {
  expedientes: Expediente[];
  onViewDetail?: (expediente: Expediente) => void;
}

export function ExpedientesMonthWrapper({
  expedientes,
  onViewDetail,
}: ExpedientesMonthWrapperProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => startOfMonth(new Date()));
  const [popoverDay, setPopoverDay] = React.useState<Date | null>(null);
  const [detailExpediente, setDetailExpediente] = React.useState<Expediente | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const dayMap = React.useMemo(() => groupByDay(expedientes), [expedientes]);
  const summary = React.useMemo(() => computeSummary(expedientes), [expedientes]);

  // Build calendar grid (Monday-start)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const handleDaySelect = React.useCallback((day: Date) => {
    setPopoverDay(day);
  }, []);

  const handleViewDetail = React.useCallback((exp: Expediente) => {
    setPopoverDay(null);
    if (onViewDetail) {
      onViewDetail(exp);
    } else {
      setDetailExpediente(exp);
      setDetailOpen(true);
    }
  }, [onViewDetail]);

  return (
    <>
      <GlassPanel depth={1} className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; sm:p-6 sem equivalente DS */ "p-4 sm:p-6 flex flex-col")}>
        {/* Month Navigator */}
        <div className="flex items-center justify-between mb-6">
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-1")}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 border border-border/50 bg-accent/30 backdrop-blur-sm hover:bg-accent/50"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="w-4 h-4 text-foreground/60" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 border border-border/50 bg-accent/30 backdrop-blur-sm hover:bg-accent/50"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
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
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
          </span>

          <div className="flex-1" />
        </div>

        {/* Legend */}
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default">; px-1 padding direcional sem Inset equiv. */ "flex items-center gap-4 mb-4 px-1 flex-wrap")}>
          {(['critico', 'alto', 'medio', 'baixo'] as UrgencyLevel[]).map((level) => (
            <div key={level} className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
              <div className={cn('w-1.75 h-1.75 rounded-full', URGENCY_DOT[level])} />
              <span className="text-[11px] text-foreground/65">{getUrgencyLabel(level)}</span>
            </div>
          ))}
        </div>

        {/* Weekday Headers */}
        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "grid grid-cols-7 gap-1.5 mb-1")}>
          {WEEKDAY_HEADERS.map((label, idx) => (
            <div
              key={label}
              className={cn(
                /* design-system-escape: py-2 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading>; tracking-widest sem token DS */ 'text-center py-2 text-caption font-semibold uppercase tracking-widest',
                idx >= 5 ? 'text-foreground/55' : 'text-foreground/70',
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "grid grid-cols-7 gap-1.5 flex-1")} style={{ gridAutoRows: '1fr' }}>
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const exps = dayMap.get(key) || [];
            const isPopoverOpen = popoverDay && isSameDay(day, popoverDay);

            return (
              <div key={key} className="relative h-full">
                {exps.length > 0 ? (
                  <Popover
                    open={!!isPopoverOpen}
                    onOpenChange={(open) => {
                      if (!open) setPopoverDay(null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <div className="h-full">
                        <DayCell
                          day={day}
                          expedientesDia={exps}
                          isCurrentMonth={isSameMonth(day, currentMonth)}
                          onSelect={handleDaySelect}
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "w-80 p-4 bg-background/95 backdrop-blur-3xl border-border/50 rounded-2xl shadow-lg")}
                      side="bottom"
                      align="start"
                      sideOffset={6}
                    >
                      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center justify-between gap-3 mb-3")}>
                        <div>
                          <p className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-body-sm font-bold capitalize")}>
                            {format(day, "d 'de' MMMM", { locale: ptBR })}
                          </p>
                          <Text variant="caption" className="text-foreground/60 mt-0.5 capitalize">
                            {format(day, 'EEEE', { locale: ptBR })} · {exps.length} expediente{exps.length > 1 ? 's' : ''}
                          </Text>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPopoverDay(null)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent/50 border border-border/50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-foreground/70" />
                        </button>
                      </div>
                      <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight">; pr-0.5 padding direcional sem Inset equiv. */ "space-y-2 max-h-72 overflow-y-auto pr-0.5")}>
                        {exps.map((exp) => (
                          <button
                            key={exp.id}
                            type="button"
                            onClick={() => handleViewDetail(exp)}
                            className="w-full text-left"
                          >
                            <ExpedienteItem expediente={exp} />
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <DayCell
                    day={day}
                    expedientesDia={[]}
                    isCurrentMonth={isSameMonth(day, currentMonth)}
                    onSelect={() => {}}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Strip */}
        <div className={cn(/* design-system-escape: pt-4 padding direcional sem Inset equiv.; gap-3 gap sem token DS */ "mt-5 pt-4 border-t border-border/50 flex items-center justify-between flex-wrap gap-3")}>
          <div className={cn(/* design-system-escape: gap-5 gap sem token DS */ "flex items-center gap-5")}>
            <div className="text-center">
              <p className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-body-lg font-bold")}>{summary.total}</p>
              <Text variant="caption" className="text-foreground/60 mt-0.5">Pendentes</Text>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="text-center">
              <p className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-body-lg font-bold text-destructive")}>{summary.vencidos}</p>
              <Text variant="caption" className="text-foreground/60 mt-0.5">Vencidos</Text>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="text-center">
              <p className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-body-lg font-bold text-warning")}>{summary.hoje}</p>
              <Text variant="caption" className="text-foreground/60 mt-0.5">Hoje</Text>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="text-center">
              <p className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-body-lg font-bold text-info")}>{summary.proximos}</p>
              <Text variant="caption" className="text-foreground/60 mt-0.5">Próximos 3d</Text>
            </div>
          </div>
        </div>
      </GlassPanel>

      {detailExpediente && (
        <ExpedienteVisualizarDialog
          expediente={detailExpediente}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      )}
    </>
  );
}
