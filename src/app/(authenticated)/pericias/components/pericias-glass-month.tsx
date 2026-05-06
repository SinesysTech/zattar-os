'use client';

/**
 * PericiasGlassMonth — View mês padrão Glass Briefing (espelha AudienciasGlassMonth).
 * ============================================================================
 * Calendário full-size 7 colunas, DayCell com dots/badge, Popover ao clicar
 * em dia com lista compacta, Navigator de mês no topo + Summary strip no
 * rodapé com totais por situação.
 *
 * Substitui o master-detail (CalendarCompact + DayList) que divergia do
 * padrão das outras views temporais.
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
  AlertTriangle,
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

import {
  SituacaoPericiaCodigo,
  SITUACAO_PERICIA_LABELS,
  type Pericia,
} from '../domain';
import { PericiaDetalhesDialog } from './pericia-detalhes-dialog';
import { Text } from '@/components/ui/typography';

// =============================================================================
// HELPERS
// =============================================================================

const WEEKDAY_HEADERS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function getSituacaoDotClass(situacao: SituacaoPericiaCodigo): string {
  switch (situacao) {
    case SituacaoPericiaCodigo.AGUARDANDO_LAUDO:
      return 'bg-primary';
    case SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS:
      return 'bg-warning';
    case SituacaoPericiaCodigo.LAUDO_JUNTADO:
      return 'bg-info';
    case SituacaoPericiaCodigo.FINALIZADA:
      return 'bg-success';
    case SituacaoPericiaCodigo.CANCELADA:
      return 'bg-destructive';
    default:
      return 'bg-muted-foreground';
  }
}

function getSituacaoBadgeClass(situacao: SituacaoPericiaCodigo): string {
  switch (situacao) {
    case SituacaoPericiaCodigo.AGUARDANDO_LAUDO:
      return 'bg-primary/15 text-primary border-primary/25';
    case SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS:
      return 'bg-warning/15 text-warning border-warning/25';
    case SituacaoPericiaCodigo.LAUDO_JUNTADO:
      return 'bg-info/15 text-info border-info/25';
    case SituacaoPericiaCodigo.FINALIZADA:
      return 'bg-success/15 text-success border-success/25';
    case SituacaoPericiaCodigo.CANCELADA:
      return 'bg-destructive/15 text-destructive border-destructive/25';
    default:
      return 'bg-muted/30 text-muted-foreground border-border/30';
  }
}

function getSituacaoBorderClass(situacao: SituacaoPericiaCodigo): string {
  switch (situacao) {
    case SituacaoPericiaCodigo.AGUARDANDO_LAUDO:
      return 'border-l-primary';
    case SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS:
      return 'border-l-warning';
    case SituacaoPericiaCodigo.LAUDO_JUNTADO:
      return 'border-l-info';
    case SituacaoPericiaCodigo.FINALIZADA:
      return 'border-l-success';
    case SituacaoPericiaCodigo.CANCELADA:
      return 'border-l-destructive';
    default:
      return 'border-l-muted-foreground';
  }
}

function isOverdue(p: Pericia): boolean {
  if (!p.prazoEntrega) return false;
  const pending =
    p.situacaoCodigo === SituacaoPericiaCodigo.AGUARDANDO_LAUDO ||
    p.situacaoCodigo === SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS;
  if (!pending) return false;
  try {
    return parseISO(p.prazoEntrega) < new Date();
  } catch {
    return false;
  }
}

function groupByDay(pericias: Pericia[]): Map<string, Pericia[]> {
  const map = new Map<string, Pericia[]>();
  for (const p of pericias) {
    if (!p.prazoEntrega) continue;
    try {
      const key = format(parseISO(p.prazoEntrega), 'yyyy-MM-dd');
      const list = map.get(key) || [];
      list.push(p);
      map.set(key, list);
    } catch {
      // prazo inválido — ignora
    }
  }
  return map;
}

interface MonthSummary {
  total: number;
  aguardandoLaudo: number;
  laudoJuntado: number;
  finalizadas: number;
  vencidas: number;
}

function computeSummary(pericias: Pericia[]): MonthSummary {
  return {
    total: pericias.length,
    aguardandoLaudo: pericias.filter(
      (p) => p.situacaoCodigo === SituacaoPericiaCodigo.AGUARDANDO_LAUDO,
    ).length,
    laudoJuntado: pericias.filter(
      (p) => p.situacaoCodigo === SituacaoPericiaCodigo.LAUDO_JUNTADO,
    ).length,
    finalizadas: pericias.filter(
      (p) => p.situacaoCodigo === SituacaoPericiaCodigo.FINALIZADA,
    ).length,
    vencidas: pericias.filter(isOverdue).length,
  };
}

// =============================================================================
// DAY CELL
// =============================================================================

interface DayCellProps {
  day: Date;
  periciasDia: Pericia[];
  isCurrentMonth: boolean;
  onSelect: (day: Date, pericias: Pericia[]) => void;
}

function DayCell({ day, periciasDia, isCurrentMonth, onSelect }: DayCellProps) {
  const today = isToday(day);
  const count = periciasDia.length;
  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
  const hasVencida = periciasDia.some(isOverdue);

  return (
    <button
      type="button"
      onClick={() => count > 0 && onSelect(day, periciasDia)}
      className={cn(
        /* design-system-escape: p-2.5 → usar <Inset> */ 'relative w-full min-h-25 sm:min-h-30 p-2.5 rounded-xl transition-all duration-150 text-left flex flex-col h-full',
        'border border-border/40',
        'hover:bg-accent/40 hover:border-border/60',
        'active:bg-accent/20 active:scale-[0.98]',
        isWeekend && 'bg-muted/25',
        !isCurrentMonth && 'opacity-45',
        hasVencida && 'ring-1 ring-destructive/30',
        count > 0 && 'cursor-pointer',
        count === 0 && 'cursor-default',
      )}
    >
      <div
        className={cn(
           'text-body-sm font-semibold w-7 h-7 flex items-center justify-center',
          today
            ?  'bg-primary text-primary-foreground rounded-full font-bold'
            : 'text-foreground/85',
        )}
      >
        {format(day, 'd')}
      </div>

      {count > 0 && count < 3 && (
        <div className={cn("flex inline-micro mt-auto pt-1.5 flex-wrap")}>
          {periciasDia.map((p) => (
            <div
              key={p.id}
              className={cn(
                'w-1.75 h-1.75 rounded-full shrink-0',
                getSituacaoDotClass(p.situacaoCodigo),
              )}
            />
          ))}
        </div>
      )}

      {count >= 3 && (
        <div className={cn("flex inline-micro mt-auto pt-1.5")}>
          <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "text-[10px] font-bold text-primary bg-primary/15 rounded-full px-1.5 py-0.5 inline-flex items-center justify-center min-w-4.5")}>
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

function PericiaItem({ pericia }: { pericia: Pericia }) {
  const overdue = isOverdue(pericia);

  return (
    <div
      className={cn(
        /* design-system-escape: p-2.5 → usar <Inset> */ 'rounded-lg p-2.5 border border-border/30 border-l-2 bg-muted/15',
        'hover:bg-accent/40 transition-colors cursor-pointer',
        getSituacaoBorderClass(pericia.situacaoCodigo),
      )}
    >
      {/* Linha principal: prazo + processo + badge */}
      <div className={cn("flex items-center justify-between inline-tight")}>
        <div className={cn("flex items-center inline-snug min-w-0")}>
          {overdue ? (
            <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
          ) : (
            <Clock className="w-3 h-3 text-foreground/40 shrink-0" />
          )}
          <Text variant="caption" className="font-semibold text-foreground/85 truncate">
            {pericia.especialidade?.descricao || 'Perícia técnica'}
          </Text>
        </div>
        <span
          className={cn(
            /* design-system-escape: px-1.75 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ 'text-[10px] font-semibold tracking-[0.03em] px-1.75 py-0.5 rounded-full border shrink-0',
            getSituacaoBadgeClass(pericia.situacaoCodigo),
          )}
        >
          {SITUACAO_PERICIA_LABELS[pericia.situacaoCodigo]}
        </span>
      </div>

      {/* Processo + grau */}
      <div className={cn("flex items-center inline-snug mt-1.5 ml-4.5 min-w-0")}>
        {pericia.grau && (
          <span className="text-[9px] text-foreground/30 shrink-0">
            {pericia.grau === 'primeiro_grau' ? '1º grau' : '2º grau'}
          </span>
        )}
        <Text variant="caption" className="text-foreground/45 tabular-nums truncate">
          {pericia.numeroProcesso}
        </Text>
      </div>

      {/* Partes */}
      {(pericia.processo?.nomeParteAutora ||
        pericia.processo?.nomeParteRe) && (
        <div className="mt-1.5 ml-4.5 text-[11px] text-foreground/40 truncate">
          {pericia.processo?.nomeParteAutora || '—'}{' '}
          <span className="text-foreground/20">vs</span>{' '}
          {pericia.processo?.nomeParteRe || '—'}
        </div>
      )}

      {/* Perito + TRT */}
      <div className={cn("flex items-center inline-medium mt-1.5 ml-4.5 text-foreground/35")}>
        {pericia.perito?.nome && (
          <span className="text-[11px] truncate">
            Perito: {pericia.perito.nome}
          </span>
        )}
        {pericia.trt && (
          <>
            {pericia.perito?.nome && (
              <span className="text-foreground/15">·</span>
            )}
            <span className="text-[11px]">{pericia.trt}</span>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export interface PericiasGlassMonthProps {
  pericias: Pericia[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function PericiasGlassMonth({
  pericias,
  currentMonth,
  onMonthChange,
}: PericiasGlassMonthProps) {
  const [popoverDay, setPopoverDay] = React.useState<Date | null>(null);
  const [popoverPericias, setPopoverPericias] = React.useState<Pericia[]>([]);
  const [detailPericia, setDetailPericia] = React.useState<Pericia | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = React.useState(false);

  const dayMap = React.useMemo(() => groupByDay(pericias), [pericias]);
  const summary = React.useMemo(() => computeSummary(pericias), [pericias]);

  // Calendar grid (Monday-start)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const handleDaySelect = React.useCallback(
    (day: Date, dayPericias: Pericia[]) => {
      setPopoverDay(day);
      setPopoverPericias(dayPericias);
    },
    [],
  );

  const handleViewDetail = React.useCallback((p: Pericia) => {
    setDetailPericia(p);
    setDetailOpen(true);
    setPopoverDay(null);
  }, []);

  return (
    <>
      <GlassPanel depth={1} className={cn("inset-dialog flex flex-col")}>
        {/* ── Month Navigator ───────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className={cn("flex items-center inline-tight flex-1")}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 border border-border/50 bg-accent/30 backdrop-blur-sm hover:bg-accent/50"
              onClick={() => onMonthChange(subMonths(currentMonth, 1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4 text-foreground/60" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 border border-border/50 bg-accent/30 backdrop-blur-sm hover:bg-accent/50"
              onClick={() => onMonthChange(addMonths(currentMonth, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4 text-foreground/60" />
            </Button>
            <Button
              size="sm"
              className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; */ "ml-1 rounded-full px-4 text-caption font-semibold")}
              onClick={() => onMonthChange(new Date())}
            >
              Hoje
            </Button>
          </div>

          <span className={cn(/* design-system-escape: tracking-tight sem token DS */ "text-body font-bold tracking-tight text-center capitalize")}>
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>

          <div className="flex-1" />
        </div>

        {/* ── Legend ────────────────────────────────────────── */}
        <div className={cn("flex items-center inline-default mb-4 px-1 flex-wrap")}>
          {[
            { color: 'bg-primary', label: 'Aguardando Laudo' },
            { color: 'bg-warning', label: 'Esclarecimentos' },
            { color: 'bg-info', label: 'Laudo Juntado' },
            { color: 'bg-success', label: 'Finalizada' },
          ].map(({ color, label }) => (
            <div key={label} className={cn("flex items-center inline-snug")}>
              <div className={cn('w-1.75 h-1.75 rounded-full', color)} />
              <span className="text-[11px] text-foreground/45">{label}</span>
            </div>
          ))}
          <div className={cn("flex items-center inline-snug")}>
            <div className="w-1.75 h-1.75 rounded-full bg-destructive" />
            <span className="text-[11px] text-foreground/45">Vencida</span>
          </div>
        </div>

        {/* ── Weekday Headers ───────────────────────────────── */}
        <div className={cn("grid grid-cols-7 inline-snug mb-1")}>
          {WEEKDAY_HEADERS.map((label, idx) => (
            <div
              key={label}
              className={cn(
                /* design-system-escape: py-2 padding direcional sem Inset equiv.; tracking-widest sem token DS */ 'text-center py-2 text-caption font-semibold uppercase tracking-widest',
                idx >= 5 ? 'text-foreground/35' : 'text-foreground/50',
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* ── Calendar Grid ─────────────────────────────────── */}
        <div
          className={cn("grid grid-cols-7 inline-snug flex-1")}
          style={{ gridAutoRows: '1fr' }}
        >
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayPericias = dayMap.get(key) || [];
            const isPopoverOpen = popoverDay && isSameDay(day, popoverDay);

            return (
              <div key={key} className="relative h-full">
                {dayPericias.length > 0 ? (
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
                          periciasDia={dayPericias}
                          isCurrentMonth={isSameMonth(day, currentMonth)}
                          onSelect={handleDaySelect}
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className={cn("w-80 inset-card-compact bg-background/95 backdrop-blur-3xl border-border/50 rounded-2xl shadow-lg")}
                      side="bottom"
                      align="start"
                      sideOffset={6}
                    >
                      <div className={cn("flex items-center justify-between inline-medium mb-3")}>
                        <div>
                          <p className={cn( "text-body-sm font-bold capitalize")}>
                            {format(day, "d 'de' MMMM", { locale: ptBR })}
                          </p>
                          <Text variant="caption" className="text-foreground/40 mt-0.5 capitalize">
                            {format(day, 'EEEE', { locale: ptBR })} ·{' '}
                            {dayPericias.length} perícia
                            {dayPericias.length > 1 ? 's' : ''}
                          </Text>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPopoverDay(null)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent/50 border border-border/30 transition-colors"
                          aria-label="Fechar"
                        >
                          <X className="w-3.5 h-3.5 text-foreground/50" />
                        </button>
                      </div>
                      <div className={cn("stack-tight max-h-72 overflow-y-auto pr-0.5")}>
                        {popoverPericias.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleViewDetail(p)}
                            className="w-full text-left"
                          >
                            <PericiaItem pericia={p} />
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <DayCell
                    day={day}
                    periciasDia={[]}
                    isCurrentMonth={isSameMonth(day, currentMonth)}
                    onSelect={() => {}}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Summary Strip ─────────────────────────────────── */}
        <div className={cn("mt-5 pt-4 border-t border-border/30 flex items-center justify-between flex-wrap inline-medium")}>
          <div className={cn("flex items-center inline-default-plus flex-wrap")}>
            <div className="text-center">
              <p className={cn( "text-body-lg font-bold")}>{summary.total}</p>
              <Text variant="caption" className="text-foreground/40 mt-0.5">Total no mês</Text>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="text-center">
              <p className={cn( "text-body-lg font-bold text-primary")}>
                {summary.aguardandoLaudo}
              </p>
              <Text variant="caption" className="text-foreground/40 mt-0.5">Aguardando</Text>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="text-center">
              <p className={cn( "text-body-lg font-bold text-info")}>
                {summary.laudoJuntado}
              </p>
              <Text variant="caption" className="text-foreground/40 mt-0.5">Laudo Juntado</Text>
            </div>
            <div className="w-px h-8 bg-border/50" />
            <div className="text-center">
              <p className={cn( "text-body-lg font-bold text-success")}>
                {summary.finalizadas}
              </p>
              <Text variant="caption" className="text-foreground/40 mt-0.5">Finalizadas</Text>
            </div>
            {summary.vencidas > 0 && (
              <>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-center">
                  <p className={cn( "text-body-lg font-bold text-destructive")}>
                    {summary.vencidas}
                  </p>
                  <Text variant="caption" className="text-foreground/40 mt-0.5">Vencidas</Text>
                </div>
              </>
            )}
          </div>
        </div>
      </GlassPanel>

      {/* Detail dialog */}
      <PericiaDetalhesDialog
        pericia={detailPericia}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
