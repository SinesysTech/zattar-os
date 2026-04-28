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
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Monitor,
  Building2,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Text } from '@/components/ui/typography';

import type { Audiencia } from '../domain';
import {
  StatusAudiencia,
  STATUS_AUDIENCIA_LABELS,
  ModalidadeAudiencia,
  GRAU_TRIBUNAL_LABELS,
} from '../domain';
import { AudienciaDetailDialog } from './audiencia-detail-dialog';

// =============================================================================
// HELPERS
// =============================================================================

const WEEKDAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function getStatusDotClass(status: StatusAudiencia): string {
  switch (status) {
    case StatusAudiencia.Marcada: return 'bg-success';
    case StatusAudiencia.Finalizada: return 'bg-info';
    case StatusAudiencia.Cancelada: return 'bg-destructive';
    default: return 'bg-muted-foreground';
  }
}

function getStatusBadgeClass(status: StatusAudiencia): string {
  switch (status) {
    case StatusAudiencia.Marcada:
      return 'bg-success/15 text-success border-success/25';
    case StatusAudiencia.Finalizada:
      return 'bg-info/15 text-info border-info/25';
    case StatusAudiencia.Cancelada:
      return 'bg-destructive/15 text-destructive border-destructive/25';
    default:
      return 'bg-muted/30 text-muted-foreground border-border/50';
  }
}

function groupByDay(audiencias: Audiencia[]): Map<string, Audiencia[]> {
  const map = new Map<string, Audiencia[]>();
  for (const aud of audiencias) {
    const key = format(parseISO(aud.dataInicio), 'yyyy-MM-dd');
    const list = map.get(key) || [];
    list.push(aud);
    map.set(key, list);
  }
  return map;
}

function computeSummary(audiencias: Audiencia[]) {
  const total = audiencias.length;
  const marcadas = audiencias.filter(a => a.status === StatusAudiencia.Marcada).length;
  const finalizadas = audiencias.filter(a => a.status === StatusAudiencia.Finalizada).length;
  const canceladas = audiencias.filter(a => a.status === StatusAudiencia.Cancelada).length;
  return { total, marcadas, finalizadas, canceladas };
}

// =============================================================================
// DAY CELL COMPONENT
// =============================================================================

function DayCell({
  day,
  audienciasDia,
  isCurrentMonth,
  onSelect,
}: {
  day: Date;
  audienciasDia: Audiencia[];
  isCurrentMonth: boolean;
  onSelect: (day: Date, audiencias: Audiencia[]) => void;
}) {
  const today = isToday(day);
  const count = audienciasDia.length;
  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

  return (
    <button
      type="button"
      onClick={() => count > 0 && onSelect(day, audienciasDia)}
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
        /* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-semibold → className de <Text>/<Heading> */ 'text-sm font-semibold w-7 h-7 flex items-center justify-center',
        today
          ? /* design-system-escape: font-bold → className de <Text>/<Heading> */ 'bg-primary text-primary-foreground rounded-full font-bold'
          : 'text-foreground/85',
      )}>
        {format(day, 'd')}
      </div>

      {count > 0 && count < 3 && (
        <div className={cn(/* design-system-escape: gap-1 gap sem token DS; pt-1.5 padding direcional sem Inset equiv. */ "flex gap-1 mt-auto pt-1.5 flex-wrap")}>
          {audienciasDia.map((aud) => (
            <div
              key={aud.id}
              className={cn('w-1.75 h-1.75 rounded-full shrink-0', getStatusDotClass(aud.status))}
            />
          ))}
        </div>
      )}

      {count >= 3 && (
        <div className={cn(/* design-system-escape: gap-1 gap sem token DS; pt-1.5 padding direcional sem Inset equiv. */ "flex gap-1 mt-auto pt-1.5")}>
          <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading>; px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "text-micro-caption font-bold text-primary bg-primary/15 rounded-full px-1.5 py-0.5 inline-flex items-center justify-center min-w-4.5")}>
            {count}
          </span>
        </div>
      )}
    </button>
  );
}

// =============================================================================
// POPOVER HEARING ITEM
// =============================================================================

function getStatusBorderClass(status: StatusAudiencia): string {
  switch (status) {
    case StatusAudiencia.Marcada: return 'border-l-success';
    case StatusAudiencia.Finalizada: return 'border-l-info';
    case StatusAudiencia.Cancelada: return 'border-l-destructive';
    default: return 'border-l-muted-foreground';
  }
}

function HearingItem({ audiencia }: { audiencia: Audiencia }) {
  const modalidadeLabel =
    audiencia.modalidade === ModalidadeAudiencia.Virtual
      ? 'Virtual'
      : audiencia.modalidade === ModalidadeAudiencia.Hibrida
        ? 'Híbrida'
        : 'Presencial';

  const ModalidadeIcon =
    audiencia.modalidade === ModalidadeAudiencia.Virtual ? Monitor : Building2;

  return (
    <div
      className={cn(
        /* design-system-escape: p-2.5 → usar <Inset> */ 'rounded-lg p-2.5 border border-border/50 border-l-2 bg-muted/15',
        'hover:bg-accent/40 transition-colors cursor-pointer',
        getStatusBorderClass(audiencia.status),
      )}
    >
      {/* Linha principal: hora + tipo + badge */}
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center justify-between gap-2")}>
        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 min-w-0")}>
          <Clock className="w-3 h-3 text-foreground/60 shrink-0" />
          <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; font-semibold → className de <Text>/<Heading> */ "text-xs font-semibold text-foreground/85 truncate")}>
            {audiencia.horaInicio || '—'} · {audiencia.tipoDescricao || 'Audiência'}
          </span>
        </div>
        <span className={cn(
          /* design-system-escape: font-semibold → className de <Text>/<Heading>; px-1.75 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ 'text-micro-caption font-semibold tracking-[0.03em] px-1.75 py-0.5 rounded-full border shrink-0',
          getStatusBadgeClass(audiencia.status),
        )}>
          {STATUS_AUDIENCIA_LABELS[audiencia.status]}
        </span>
      </div>

      {/* Processo + grau */}
      <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 mt-1.5 ml-4.5 min-w-0")}>
        {audiencia.grau && (
          <span className="text-micro-caption text-foreground/60 shrink-0">
            {GRAU_TRIBUNAL_LABELS[audiencia.grau]}
          </span>
        )}
        <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-foreground/65 tabular-nums truncate")}>
          {audiencia.numeroProcesso}
        </span>
      </div>

      {/* Meta: modalidade + órgão */}
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3 mt-1.5 ml-4.5 text-foreground/55")}>
        <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1")}>
          <ModalidadeIcon className="w-3 h-3" />
          <span className="text-caption">{modalidadeLabel}</span>
        </div>
        {audiencia.orgaoJulgadorOrigem && (
          <>
            <span className="text-foreground/55">·</span>
            <span className="text-caption truncate">{audiencia.orgaoJulgadorOrigem}</span>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasGlassMonth({
  audiencias,
  currentMonth,
  onMonthChange,
  refetch: _refetch,
}: {
  audiencias: Audiencia[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  refetch: () => void;
}) {
  const [popoverDay, setPopoverDay] = React.useState<Date | null>(null);
  const [_popoverAuds, setPopoverAuds] = React.useState<Audiencia[]>([]);
  const [detailAudiencia, setDetailAudiencia] = React.useState<Audiencia | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const dayMap = React.useMemo(() => groupByDay(audiencias), [audiencias]);
  const summary = React.useMemo(() => computeSummary(audiencias), [audiencias]);

  // Build calendar grid (Monday-start)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const handleDaySelect = React.useCallback((day: Date, auds: Audiencia[]) => {
    setPopoverDay(day);
    setPopoverAuds(auds);
  }, []);

  const handleViewDetail = React.useCallback((aud: Audiencia) => {
    setDetailAudiencia(aud);
    setDetailOpen(true);
    setPopoverDay(null);
  }, []);

  return (
    <>
      <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; sm:p-6 sem equivalente DS */ "flex h-full flex-col overflow-y-auto p-4 sm:p-6")}>
        <GlassPanel depth={1} className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "p-6 flex-1 min-w-0 flex flex-col")}>
          {/* Month Navigator */}
          <div className="flex items-center justify-between mb-6">
            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-1")}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 border border-border/50 bg-accent/30 backdrop-blur-sm hover:bg-accent/50"
                onClick={() => onMonthChange(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4 text-foreground/60" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 border border-border/50 bg-accent/30 backdrop-blur-sm hover:bg-accent/50"
                onClick={() => onMonthChange(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4 text-foreground/60" />
              </Button>
              <Button
                size="sm"
                className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption">; font-semibold → className de <Text>/<Heading> */ "ml-1 rounded-full px-4 text-xs font-semibold")}
                onClick={() => onMonthChange(new Date())}
              >
                Hoje
              </Button>
            </div>

            <span className={cn(/* design-system-escape: text-base → migrar para <Text variant="body">; font-bold → className de <Text>/<Heading>; tracking-tight sem token DS */ "text-base font-bold tracking-tight text-center")}>
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
            </span>

            <div className="flex-1" />
          </div>

          {/* Legend */}
          <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default">; px-1 padding direcional sem Inset equiv. */ "flex items-center gap-4 mb-4 px-1")}>
            {[
              { color: 'bg-success', label: 'Marcada' },
              { color: 'bg-info', label: 'Finalizada' },
              { color: 'bg-destructive', label: 'Cancelada' },
            ].map(({ color, label }) => (
              <div key={label} className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
                <div className={cn('w-1.75 h-1.75 rounded-full', color)} />
                <Text variant="caption" as="span" className="text-foreground/55">{label}</Text>
              </div>
            ))}
          </div>

          {/* Weekday Headers */}
          <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "grid grid-cols-7 gap-1.5 mb-1")}>
            {WEEKDAY_HEADERS.map((label, idx) => (
              <div
                key={label}
                className={cn(
                  /* design-system-escape: py-2 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption">; font-semibold → className de <Text>/<Heading>; tracking-widest sem token DS */ 'text-center py-2 text-xs font-semibold uppercase tracking-widest',
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
              const auds = dayMap.get(key) || [];
              const isPopoverOpen = popoverDay && isSameDay(day, popoverDay);

              return (
                <div key={key} className="relative h-full">
                  {auds.length > 0 ? (
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
                            audienciasDia={auds}
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
                            <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-bold → className de <Text>/<Heading> */ "text-sm font-bold capitalize")}>
                              {format(day, "d 'de' MMMM", { locale: ptBR })}
                            </p>
                            <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-foreground/60 mt-0.5 capitalize")}>
                              {format(day, 'EEEE', { locale: ptBR })} · {auds.length} audiência{auds.length > 1 ? 's' : ''}
                            </p>
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
                          {auds.map(aud => (
                            <button
                              key={aud.id}
                              type="button"
                              onClick={() => handleViewDetail(aud)}
                              className="w-full text-left"
                            >
                              <HearingItem audiencia={aud} />
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <DayCell
                      day={day}
                      audienciasDia={[]}
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
                <p className={cn(/* design-system-escape: text-lg → migrar para <Text variant="body-lg">; font-bold → className de <Text>/<Heading> */ "text-lg font-bold")}>{summary.total}</p>
                <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-foreground/60 mt-0.5")}>Total no mês</p>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="text-center">
                <p className={cn(/* design-system-escape: text-lg → migrar para <Text variant="body-lg">; font-bold → className de <Text>/<Heading> */ "text-lg font-bold text-success")}>{summary.marcadas}</p>
                <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-foreground/60 mt-0.5")}>Marcadas</p>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="text-center">
                <p className={cn(/* design-system-escape: text-lg → migrar para <Text variant="body-lg">; font-bold → className de <Text>/<Heading> */ "text-lg font-bold text-info")}>{summary.finalizadas}</p>
                <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-foreground/60 mt-0.5")}>Finalizadas</p>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="text-center">
                <p className={cn(/* design-system-escape: text-lg → migrar para <Text variant="body-lg">; font-bold → className de <Text>/<Heading> */ "text-lg font-bold text-destructive")}>{summary.canceladas}</p>
                <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-foreground/60 mt-0.5")}>Canceladas</p>
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Detail Dialog */}
      {detailAudiencia && (
        <AudienciaDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          audiencia={detailAudiencia}
        />
      )}
    </>
  );
}
