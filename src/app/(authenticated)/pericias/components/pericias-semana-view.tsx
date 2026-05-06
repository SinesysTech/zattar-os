/**
 * PericiasSemanaView — Week view com cards agrupados por dia (Glass Briefing)
 * ============================================================================
 * Apresentação visual: cards em colunas por dia (seg-sex), com GlassPanel.
 * Segue o mesmo padrão visual de ExpedientesSemanaView e AudienciasSemanaView.
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
  differenceInCalendarDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Lock, AlertTriangle, Monitor } from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';

import {
  SituacaoPericiaCodigo,
  SITUACAO_PERICIA_LABELS,
  type Pericia,
} from '../domain';
import { Text } from '@/components/ui/typography';

// =============================================================================
// TYPES
// =============================================================================

type Urgency = 'critico' | 'alto' | 'medio' | 'baixo' | 'ok';

export interface PericiasSemanaViewProps {
  pericias: Pericia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewDetail: (pericia: Pericia) => void;
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

const SITUACAO_TONE: Record<SituacaoPericiaCodigo, string> = {
  [SituacaoPericiaCodigo.AGUARDANDO_LAUDO]: 'bg-primary/10 text-primary border-primary/20',
  [SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS]: 'bg-warning/10 text-warning border-warning/20',
  [SituacaoPericiaCodigo.LAUDO_JUNTADO]: 'bg-info/10 text-info border-info/20',
  [SituacaoPericiaCodigo.FINALIZADA]: 'bg-success/10 text-success border-success/20',
  [SituacaoPericiaCodigo.CANCELADA]: 'bg-muted/30 text-muted-foreground border-border/30',
  [SituacaoPericiaCodigo.REDESIGNADA]: 'bg-accent/30 text-foreground/70 border-border/30',
};

// =============================================================================
// HELPERS
// =============================================================================

function isFinalizada(p: Pericia): boolean {
  return (
    p.situacaoCodigo === SituacaoPericiaCodigo.FINALIZADA ||
    p.situacaoCodigo === SituacaoPericiaCodigo.CANCELADA
  );
}

function getUrgency(p: Pericia): Urgency {
  if (isFinalizada(p)) return 'ok';
  if (!p.prazoEntrega) return 'baixo';

  try {
    const dias = differenceInCalendarDays(parseISO(p.prazoEntrega), new Date());
    if (dias < 0) return 'critico';
    if (dias === 0) return 'alto';
    if (dias <= 3) return 'medio';
    return 'baixo';
  } catch {
    return 'baixo';
  }
}

function getCountdownLabel(p: Pericia): string | null {
  if (!p.prazoEntrega || isFinalizada(p)) return null;
  try {
    const dias = differenceInCalendarDays(parseISO(p.prazoEntrega), new Date());
    return `${dias}d`;
  } catch {
    return null;
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PericiasSemanaView({
  pericias,
  currentDate,
  onDateChange,
  onViewDetail,
}: PericiasSemanaViewProps) {
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 }),
    [currentDate],
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 }),
    [currentDate],
  );

  // Apenas dias úteis (seg-sex) — perícias não têm prazo em fim de semana
  const weekDays = useMemo(
    () =>
      eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(
        (d) => d.getDay() !== 0 && d.getDay() !== 6,
      ),
    [weekStart, weekEnd],
  );

  // Group pericias by day (pelo prazoEntrega) e ordena por urgência
  const periciasByDay = useMemo(() => {
    const map = new Map<string, Pericia[]>();
    const urgencyOrder: Record<Urgency, number> = {
      critico: 0,
      alto: 1,
      medio: 2,
      baixo: 3,
      ok: 4,
    };

    weekDays.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const dayPericias = pericias
        .filter((p) => {
          if (!p.prazoEntrega) return false;
          try {
            return isSameDay(parseISO(p.prazoEntrega), day);
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          const ua = getUrgency(a);
          const ub = getUrgency(b);
          return (
            urgencyOrder[ua] - urgencyOrder[ub] ||
            a.numeroProcesso.localeCompare(b.numeroProcesso)
          );
        });
      map.set(key, dayPericias);
    });
    return map;
  }, [pericias, weekDays]);

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
    <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
      {/* Week Navigator */}
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
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
        <span className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium capitalize ml-1")}>{weekLabel}</span>
      </div>

      {/* Week Grid — 5 colunas (seg-sex) */}
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start")}>
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayPericias = periciasByDay.get(key) ?? [];
          const today = isToday(day);

          return (
            <GlassPanel
              key={key}
              depth={today ? 2 : 1}
              className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "p-4 min-h-40")}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-3">
                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
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
                      /* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-bold → className de <Text>/<Heading> */ 'text-sm font-bold tabular-nums',
                      today
                        ? 'bg-primary text-primary-foreground size-6 rounded-full flex items-center justify-center text-[11px]'
                        : 'text-foreground/80',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                {dayPericias.length > 0 && (
                  <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[10px] tabular-nums text-muted-foreground/45 font-medium")}>
                    {dayPericias.length}
                  </span>
                )}
              </div>

              {/* Pericias */}
              {dayPericias.length === 0 ? (
                <div className={cn(/* design-system-escape: py-6 padding direcional sem Inset equiv. */ "flex items-center justify-center py-6")}>
                  <Text variant="caption" className="text-muted-foreground/30">—</Text>
                </div>
              ) : (
                <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                  {dayPericias.map((pericia) => (
                    <WeekDayCard
                      key={pericia.id}
                      pericia={pericia}
                      onClick={() => onViewDetail(pericia)}
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
  pericia,
  onClick,
}: {
  pericia: Pericia;
  onClick: () => void;
}) {
  const urgency = getUrgency(pericia);
  const finalizada = isFinalizada(pericia);
  const countdownLabel = getCountdownLabel(pericia);

  const situacaoTone = SITUACAO_TONE[pericia.situacaoCodigo] ?? SITUACAO_TONE[SituacaoPericiaCodigo.REDESIGNADA];
  const situacaoLabel =
    SITUACAO_PERICIA_LABELS[pericia.situacaoCodigo] ?? pericia.situacaoCodigo;

  const prazoLabel = pericia.prazoEntrega
    ? format(parseISO(pericia.prazoEntrega), 'dd/MM')
    : null;

  const especialidade = pericia.especialidade?.descricao;
  const perito = pericia.perito?.nome;
  const responsavel = pericia.responsavel?.nomeExibicao;
  const parteAutora = pericia.processo?.nomeParteAutora;
  const parteRe = pericia.processo?.nomeParteRe;

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
      {/* Row 1: prazo + urgency indicator */}
      <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center justify-between gap-1")}>
        <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-caption tabular-nums font-semibold text-foreground/80")}>
          {prazoLabel ?? (
            <span className="italic text-muted-foreground/40">Sem prazo</span>
          )}
        </span>
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

      {/* Row 2: Situação badge + flags */}
      <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 mt-1.5 flex-wrap")}>
        <span
          className={cn(
            /* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ 'inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold border',
            situacaoTone,
          )}
        >
          {situacaoLabel}
        </span>
        {pericia.segredoJustica && (
          <span className={cn(/* design-system-escape: gap-1 gap sem token DS; px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center gap-1 bg-warning/10 border border-warning/20 text-warning rounded px-1.5 py-0.5 text-[9px] font-semibold")}>
            <Lock className="size-2.5" />
            Sigilo
          </span>
        )}
        {pericia.juizoDigital && (
          <span className={cn(/* design-system-escape: gap-1 gap sem token DS; px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center gap-1 bg-info/10 border border-info/20 text-info rounded px-1.5 py-0.5 text-[9px] font-semibold")}>
            <Monitor className="size-2.5" />
            Digital
          </span>
        )}
        {pericia.prioridadeProcessual && (
          <span className={cn(/* design-system-escape: gap-1 gap sem token DS; px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center gap-1 bg-destructive/10 border border-destructive/20 text-destructive rounded px-1.5 py-0.5 text-[9px] font-semibold")}>
            <AlertTriangle className="size-2.5" />
            Prioridade
          </span>
        )}
      </div>

      {/* Row 3: Especialidade */}
      {especialidade && (
        <p
          className={cn(
            /* design-system-escape: font-medium → className de <Text>/<Heading> */ 'text-caption font-medium text-foreground truncate mt-1.5',
            finalizada && 'line-through',
          )}
        >
          {especialidade}
        </p>
      )}

      {/* Row 4: Partes */}
      {(parteAutora || parteRe) && (
        <p className="text-[10px] text-muted-foreground/55 mt-1 truncate">
          {parteAutora || '—'}{' '}
          <span className="text-muted-foreground/35">vs</span>{' '}
          {parteRe || '—'}
        </p>
      )}

      {/* Row 5: TRT + Grau + Processo */}
      <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 mt-1 min-w-0")}>
        {pericia.trt && (
          <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary/70 shrink-0")}>
            {pericia.trt}
          </span>
        )}
        {pericia.grau && (
          <span className="text-[9px] text-muted-foreground/45 shrink-0">
            {pericia.grau}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/60 tabular-nums truncate">
          {pericia.numeroProcesso}
        </span>
      </div>

      {/* Row 6: Perito */}
      {perito && (
        <p
          className="text-[10px] text-muted-foreground/55 mt-0.5 truncate"
          title={perito}
        >
          Perito: {perito}
        </p>
      )}

      {/* Row 7: Responsavel footer */}
      <div className="flex justify-end mt-2">
        {responsavel ? (
          <span className="text-[9px] text-muted-foreground/55">
            {responsavel}
          </span>
        ) : (
          <span className="text-[9px] italic text-warning/60">Sem resp.</span>
        )}
      </div>
    </div>
  );
}
