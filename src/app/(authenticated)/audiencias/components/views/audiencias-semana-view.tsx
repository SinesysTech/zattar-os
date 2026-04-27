/**
 * AudienciasSemanaView — Week view com cards agrupados por dia
 * ============================================================================
 * Apresentação visual: cards em colunas por dia da semana, com GlassPanel.
 * Componente puramente presentacional — recebe dados e callbacks.
 * ============================================================================
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Video,
  Building2,
  Sparkles,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  MessageSquare,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Text } from '@/components/ui/typography';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Audiencia } from '../../domain';
import { StatusAudiencia, GRAU_TRIBUNAL_LABELS } from '../../domain';
import { calcPrepItems, calcPrepScore } from '../prep-score';
import { AudienciaResponsavelPopover, ResponsavelTriggerContent } from '../audiencia-responsavel-popover';

// ─── Types ────────────────────────────────────────────────────────────────

interface Usuario {
  id: number;
  nomeExibicao?: string;
  nomeCompleto?: string;
  avatarUrl?: string | null;
}

export interface AudienciasSemanaViewProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewDetail: (audiencia: Audiencia) => void;
  responsavelNomes?: Map<number, string>;
  usuarios?: Usuario[];
  onResponsavelChange?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  try {
    return format(parseISO(iso), 'HH:mm');
  } catch {
    return '—';
  }
}

function getDayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function getAudienciaTiming(audiencia: Audiencia, now: Date) {
  try {
    const start = parseISO(audiencia.dataInicio);
    const end = parseISO(audiencia.dataFim);
    return {
      isPast: end < now,
      isOngoing: start <= now && end >= now,
      isUpcoming: start > now,
    };
  } catch {
    return {
      isPast: false,
      isOngoing: false,
      isUpcoming: false,
    };
  }
}

function getDaySummary(audiencias: Audiencia[]) {
  const now = new Date();
  const ongoing = audiencias.filter((a) => getAudienciaTiming(a, now).isOngoing);
  const upcoming = audiencias.filter(
    (a) => a.status === StatusAudiencia.Marcada && getAudienciaTiming(a, now).isUpcoming,
  );
  const completed = audiencias.filter(
    (a) => a.status === StatusAudiencia.Finalizada || a.status === StatusAudiencia.Cancelada || getAudienciaTiming(a, now).isPast,
  );
  const lowPrep = audiencias.filter(
    (a) => a.status === StatusAudiencia.Marcada && calcPrepScore(calcPrepItems(a)) < 50,
  );
  const semResponsavel = audiencias.filter((a) => !a.responsavelId);
  const semSala = audiencias.filter(
    (a) => (a.modalidade === 'virtual' || a.modalidade === 'hibrida') && !a.urlAudienciaVirtual,
  );
  const avgPrep = audiencias.length > 0
    ? Math.round(audiencias.reduce((acc, a) => acc + calcPrepScore(calcPrepItems(a)), 0) / audiencias.length)
    : 0;

  return {
    total: audiencias.length,
    ongoing,
    upcoming,
    completed,
    lowPrep,
    semResponsavel,
    semSala,
    avgPrep,
    nextAudiencia: upcoming[0] ?? ongoing[0] ?? null,
  };
}

function getGroupedAudiencias(audiencias: Audiencia[]) {
  const now = new Date();
  const emAndamento = audiencias.filter((a) => getAudienciaTiming(a, now).isOngoing);
  const proximas = audiencias.filter(
    (a) =>
      a.status === StatusAudiencia.Marcada &&
      !getAudienciaTiming(a, now).isOngoing &&
      !getAudienciaTiming(a, now).isPast,
  );
  const encerradas = audiencias.filter(
    (a) =>
      a.status === StatusAudiencia.Finalizada ||
      a.status === StatusAudiencia.Cancelada ||
      getAudienciaTiming(a, now).isPast,
  );

  return [
    { key: 'em-andamento', title: 'Em andamento', items: emAndamento, tone: 'success' as const },
    { key: 'proximas', title: 'Próximas', items: proximas, tone: 'primary' as const },
    { key: 'encerradas', title: 'Encerradas', items: encerradas, tone: 'muted' as const },
  ].filter((group) => group.items.length > 0);
}

// ─── Component ────────────────────────────────────────────────────────────

export function AudienciasSemanaView({
  audiencias,
  currentDate,
  onDateChange,
  onViewDetail,
  responsavelNomes,
  usuarios,
  onResponsavelChange,
}: AudienciasSemanaViewProps) {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 }),
    [currentDate],
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { locale: ptBR, weekStartsOn: 1 }),
    [currentDate],
  );
  // Apenas dias úteis (seg-sex) — audiências não ocorrem no fim de semana
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd })
      .filter((d) => d.getDay() !== 0 && d.getDay() !== 6),
    [weekStart, weekEnd],
  );

  const audienciasByDay = useMemo(() => {
    const map = new Map<string, Audiencia[]>();
    weekDays.forEach((day) => {
      const key = getDayKey(day);
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

  useEffect(() => {
    if (weekDays.length === 0) return;
    const todayInWeek = weekDays.find((day) => isToday(day));
    const nextSelected = todayInWeek ? getDayKey(todayInWeek) : getDayKey(weekDays[0]);
    setSelectedDay(nextSelected);
  }, [weekStart, weekDays]);

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
  // Label da semana: seg — sex (sem fim de semana)
  const friday = weekDays[weekDays.length - 1];
  const weekLabel = `${format(weekStart, "d 'de' MMM", { locale: ptBR })} — ${format(friday, "d 'de' MMM", { locale: ptBR })}`;

  return (
    <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
      {/* Week Navigator */}
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
        <button onClick={handlePrevWeek} className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "p-1.5 rounded-lg hover:bg-foreground/4 transition-colors text-muted-foreground/55 cursor-pointer")}>
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={handleToday}
          className={cn(
            /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'px-2.5 py-1 rounded-lg text-caption font-medium transition-colors cursor-pointer',
            isCurrentWeek ? 'bg-primary/12 text-primary' : 'bg-border/8 text-muted-foreground/50 hover:bg-border/15',
          )}
        >
          Hoje
        </button>
        <button onClick={handleNextWeek} className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "p-1.5 rounded-lg hover:bg-foreground/4 transition-colors text-muted-foreground/55 cursor-pointer")}>
          <ChevronRight className="size-4" />
        </button>
        <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-caption font-medium capitalize ml-1")}>{weekLabel}</span>
      </div>

      <Tabs value={selectedDay} onValueChange={setSelectedDay} className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
        <TabsList className={cn(/* design-system-escape: p-1 → padrão TabsList */ "h-auto w-full justify-start overflow-x-auto")}>
          {weekDays.map((day) => {
            const key = getDayKey(day);
            const dayAudiencias = audienciasByDay.get(key) ?? [];
            const lowPrepCount = dayAudiencias.filter(
              (a) => a.status === StatusAudiencia.Marcada && calcPrepScore(calcPrepItems(a)) < 50,
            ).length;
            const today = isToday(day);

            return (
              <TabsTrigger
                key={key}
                value={key}
                className={cn(
                  /* design-system-escape: gap-0.5 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ 'flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 min-w-16',
                )}
              >
                <span className={cn(
                  'text-overline capitalize',
                  today ? 'text-primary' : 'text-muted-foreground/55',
                )}>
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
                <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1")}>
                  <span className={cn(
                    /* design-system-escape: font-semibold → className de <Text>/<Heading> */ 'text-caption font-semibold tabular-nums',
                    today ? 'text-primary' : 'text-foreground/80',
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayAudiencias.length > 0 && (
                    <span className={cn(
                      /* design-system-escape: px-1.5 padding direcional sem Inset equiv. */ 'text-micro-badge tabular-nums rounded-full px-1.5 py-px',
                      lowPrepCount > 0
                        ? 'bg-warning/15 text-warning'
                        : today
                          ? 'bg-primary/12 text-primary'
                          : 'bg-muted/60 text-muted-foreground/60',
                    )}>
                      {dayAudiencias.length}
                    </span>
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {weekDays.map((day) => {
          const key = getDayKey(day);
          const dayAudiencias = audienciasByDay.get(key) ?? [];
          const dayIsToday = isToday(day);
          const daySummary = getDaySummary(dayAudiencias);
          const groupedAudiencias = getGroupedAudiencias(dayAudiencias);
          const nextAudiencia = daySummary.nextAudiencia;

          return (
            <TabsContent key={key} value={key} className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "mt-0 space-y-4")}>
              <GlassPanel depth={dayIsToday ? 2 : 1} className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "p-4")}>
                <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between")}>
                  <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                      <CalendarDays className="size-4 text-primary/70" />
                      <Text variant="overline" className="text-muted-foreground/70">
                        {dayIsToday ? 'Hoje' : 'Dia selecionado'}
                      </Text>
                    </div>
                    <div>
                      <h3 className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-label font-semibold capitalize")}>
                        {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </h3>
                      <p className="text-caption text-muted-foreground/60">
                        {dayIsToday
                          ? 'Acompanhamento operacional da pauta do dia.'
                          : 'Visão do preparo, sequência e encerramento das audiências deste dia.'}
                      </p>
                    </div>
                    {nextAudiencia && (
                      <p className="text-caption text-muted-foreground/70">
                        Próxima prioridade: <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground/85")}>{fmtTime(nextAudiencia.dataInicio)}</span> · {nextAudiencia.tipoDescricao || 'Audiência'} · {nextAudiencia.numeroProcesso}
                      </p>
                    )}
                  </div>

                  <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "grid grid-cols-2 gap-2 lg:w-105")}>
                    <SummaryMetric
                      icon={Clock3}
                      label="Em andamento"
                      value={daySummary.ongoing.length}
                      tone="success"
                    />
                    <SummaryMetric
                      icon={ChevronRight}
                      label="Próximas"
                      value={daySummary.upcoming.length}
                      tone="primary"
                    />
                    <SummaryMetric
                      icon={AlertTriangle}
                      label="Pendências"
                      value={daySummary.lowPrep.length + daySummary.semResponsavel.length + daySummary.semSala.length}
                      tone="warning"
                    />
                    <SummaryMetric
                      icon={CheckCircle2}
                      label="Preparo médio"
                      value={`${daySummary.avgPrep}%`}
                      tone="muted"
                    />
                  </div>
                </div>

                {(daySummary.lowPrep.length > 0 || daySummary.semResponsavel.length > 0 || daySummary.semSala.length > 0) && (
                  <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mt-4 flex flex-wrap gap-2")}>
                    {daySummary.lowPrep.length > 0 && (
                      <StatusPill>
                        {daySummary.lowPrep.length} com preparo abaixo de 50%
                      </StatusPill>
                    )}
                    {daySummary.semResponsavel.length > 0 && (
                      <StatusPill>
                        {daySummary.semResponsavel.length} sem responsável
                      </StatusPill>
                    )}
                    {daySummary.semSala.length > 0 && (
                      <StatusPill>
                        {daySummary.semSala.length} sem link da sala virtual
                      </StatusPill>
                    )}
                  </div>
                )}
              </GlassPanel>

              {dayAudiencias.length === 0 ? (
                <GlassPanel className={cn(/* design-system-escape: p-10 → usar <Inset> */ "p-10 text-center")}>
                  <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-caption font-medium text-foreground/75")}>
                    Nenhuma audiência neste dia útil.
                  </p>
                  <p className="mt-1 text-caption text-muted-foreground/55">
                    Use as tabs para revisar outra pauta da semana.
                  </p>
                </GlassPanel>
              ) : (
                <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
                  {groupedAudiencias.map((group) => (
                    <section key={group.key} className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center justify-between gap-3")}>
                        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                          <span className={cn(
                            'size-2 rounded-full',
                            group.tone === 'success' && 'bg-success',
                            group.tone === 'primary' && 'bg-primary',
                            group.tone === 'muted' && 'bg-muted-foreground/35',
                          )} />
                          <h4 className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-caption font-semibold text-foreground/85")}>
                            {group.title}
                          </h4>
                        </div>
                        <span className="text-micro-caption tabular-nums text-muted-foreground/55">
                          {group.items.length}
                        </span>
                      </div>
                      <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                        {group.items.map((a) => (
                          <WeekDayCard
                            key={a.id}
                            audiencia={a}
                            onClick={() => onViewDetail(a)}
                            responsavelNomes={responsavelNomes}
                            usuarios={usuarios}
                            onResponsavelChange={onResponsavelChange}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone: 'primary' | 'success' | 'warning' | 'muted';
}) {
  return (
    <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "rounded-2xl border border-border/30 bg-background/55 px-3 py-2.5")}>
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center justify-between gap-2")}>
        <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-micro-caption uppercase tracking-wider text-muted-foreground/55")}>
          {label}
        </span>
        <Icon className={cn(
          'size-3.5',
          tone === 'primary' && 'text-primary/70',
          tone === 'success' && 'text-success/70',
          tone === 'warning' && 'text-warning/75',
          tone === 'muted' && 'text-muted-foreground/55',
        )} />
      </div>
      <div className={cn(/* design-system-escape: leading-none sem token DS; tracking-tight sem token DS */ "mt-1 text-kpi-value leading-none tracking-tight text-foreground/85")}>
        {value}
      </div>
    </div>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className={cn(/* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ "rounded-full border border-border/30 bg-background/60 px-2.5 py-1 text-micro-caption text-muted-foreground/70")}>
      {children}
    </span>
  );
}

// ─── Internal: Week Day Card (GlassRow) ──────────────────────────────────

const MODALIDADE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  virtual: Video,
  presencial: Building2,
  hibrida: Sparkles,
};

const MODALIDADE_LABEL: Record<string, string> = {
  virtual: 'Virtual',
  presencial: 'Presencial',
  hibrida: 'Híbrida',
};

function WeekDayCard({ audiencia, onClick, responsavelNomes, usuarios, onResponsavelChange }: {
  audiencia: Audiencia;
  onClick: () => void;
  responsavelNomes?: Map<number, string>;
  usuarios?: Usuario[];
  onResponsavelChange?: () => void;
}) {
  const now = new Date();
  let isPast = false;
  let isOngoing = false;
  try {
    isPast = parseISO(audiencia.dataFim) < now;
    isOngoing = parseISO(audiencia.dataInicio) <= now && parseISO(audiencia.dataFim) >= now;
  } catch { /* skip */ }

  const isFinalizada = audiencia.status === StatusAudiencia.Finalizada;
  const isCancelada = audiencia.status === StatusAudiencia.Cancelada;
  const prepScore = calcPrepScore(calcPrepItems(audiencia));
  const prepStatus = prepScore >= 80 ? 'good' : prepScore >= 50 ? 'warning' : 'danger';
  const modalidade = audiencia.modalidade ?? null;
  const ModalidadeIcon = modalidade ? MODALIDADE_ICON[modalidade] : null;
  const hasVirtualRoom = (modalidade === 'virtual' || modalidade === 'hibrida') && audiencia.urlAudienciaVirtual;
  const grauLabel = audiencia.grau ? GRAU_TRIBUNAL_LABELS[audiencia.grau] : null;
  const orgao = audiencia.orgaoJulgadorOrigem;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className={cn(
        /* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ 'group w-full text-left rounded-2xl border border-border/60 bg-card p-4 cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:border-border hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isOngoing && 'border-l-2 border-l-success ring-1 ring-success/20 bg-success/3',
        (isPast || isFinalizada) && !isOngoing && 'opacity-55',
        isCancelada && !isOngoing && 'opacity-45',
      )}
    >
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-start gap-4")}>

        {/* TEMPORAL: hora + prep score (coluna fixa à esquerda) */}
        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS; pt-0.5 padding direcional sem Inset equiv. */ "flex flex-col items-center gap-1.5 w-22 shrink-0 pt-0.5")}>
          <div className="text-center">
            <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; leading-tight sem token DS */ "text-caption font-semibold text-foreground leading-tight whitespace-nowrap tabular-nums")}>
              {fmtTime(audiencia.dataInicio)}
            </div>
            <div className="text-micro-caption text-muted-foreground/30">–</div>
            <div className="text-caption text-muted-foreground/60 tabular-nums">
              {fmtTime(audiencia.dataFim)}
            </div>
          </div>
          <div className={cn(
            /* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ 'text-micro-badge font-semibold tabular-nums rounded-md px-1.5 py-0.5',
            prepStatus === 'good'
              ? 'bg-success/15 text-success'
              : prepStatus === 'warning'
                ? 'bg-warning/15 text-warning'
                : 'bg-destructive/15 text-destructive',
          )}>
            {prepScore}%
          </div>
          {isOngoing && <span className="size-2 rounded-full bg-success animate-pulse" />}
        </div>

        {/* MAIN INFO */}
        <div className="flex-1 min-w-0">

          {/* L1 — Tipo como título + badges/flags à direita */}
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
            <h3 className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; leading-tight sem token DS */ 'text-label font-semibold text-foreground leading-tight truncate')}>
              {audiencia.tipoDescricao || 'Audiência'}
            </h3>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "ml-auto flex items-center gap-1.5 shrink-0")}>
              {modalidade && (
                <span className={cn(
                  /* design-system-escape: gap-1 gap sem token DS; px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-micro-caption font-semibold',
                  modalidade === 'virtual'
                    ? 'bg-info/10 border border-info/25 text-info'
                    : modalidade === 'presencial'
                      ? 'bg-warning/10 border border-warning/25 text-warning'
                      : 'bg-primary/10 border border-primary/25 text-primary',
                )}>
                  {ModalidadeIcon && <ModalidadeIcon className="w-2.5 h-2.5" />}
                  {MODALIDADE_LABEL[modalidade]}
                </span>
              )}
              {hasVirtualRoom && (
                <span className={cn(/* design-system-escape: gap-1 gap sem token DS; px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center gap-1 bg-info/10 border border-info/25 text-info rounded-md px-1.5 py-0.5 text-micro-caption font-semibold")}>
                  <ExternalLink className="w-2.5 h-2.5" />
                  Sala
                </span>
              )}
              {audiencia.segredoJustica && (
                <span className={cn(/* design-system-escape: gap-1 gap sem token DS; px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center gap-1 bg-warning/10 border border-warning/25 text-warning rounded-md px-1.5 py-0.5 text-micro-caption font-semibold")}>
                  <Lock className="w-2.5 h-2.5" />
                  Segredo
                </span>
              )}
              {isFinalizada && (
                <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "text-micro-caption font-semibold text-success px-1.5 py-0.5 rounded-full bg-success/15")}>
                  OK
                </span>
              )}
            </div>
          </div>

          {/* L2 — Partes */}
          {(audiencia.poloAtivoNome || audiencia.poloPassivoNome) && (
            <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; leading-snug sem token DS */ "mt-0.5 text-caption font-semibold text-foreground/85 leading-snug flex flex-wrap items-baseline gap-x-1")}>
              {audiencia.poloAtivoNome && <span>{audiencia.poloAtivoNome}</span>}
              {audiencia.poloAtivoNome && audiencia.poloPassivoNome && (
                <span className="text-[9px] font-normal text-muted-foreground/50">vs</span>
              )}
              {audiencia.poloPassivoNome && <span>{audiencia.poloPassivoNome}</span>}
            </div>
          )}

          {/* L3 — Identificação legal unificada em mono */}
          <div className="mt-1 text-mono-num flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {audiencia.trt && <span>{audiencia.trt}</span>}
            {audiencia.trt && <span className="text-muted-foreground/30">·</span>}
            {grauLabel && <span>{grauLabel}</span>}
            {grauLabel && audiencia.numeroProcesso && (
              <span className="text-muted-foreground/30">·</span>
            )}
            {audiencia.numeroProcesso && (
              <span className="tabular-nums">{audiencia.numeroProcesso}</span>
            )}
            {orgao && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="truncate max-w-48" title={orgao}>{orgao}</span>
              </>
            )}
          </div>

          {/* FOOTER — observações + responsável */}
          <div
            className={cn(/* design-system-escape: pt-2.5 padding direcional sem Inset equiv.; gap-3 gap sem token DS */ "mt-2.5 pt-2.5 border-t border-border/50 flex items-center gap-3")}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {audiencia.observacoes && (
              <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 min-w-0 flex-1")}>
                <MessageSquare className="w-3 h-3 shrink-0 text-muted-foreground/60" />
                <span className="text-caption text-muted-foreground/65 line-clamp-1 flex-1">
                  {audiencia.observacoes}
                </span>
              </div>
            )}

            <div className="shrink-0 ml-auto">
              {usuarios ? (
                <AudienciaResponsavelPopover
                  audienciaId={audiencia.id}
                  responsavelId={audiencia.responsavelId}
                  usuarios={usuarios}
                  onSuccess={onResponsavelChange}
                  align="end"
                >
                  <ResponsavelTriggerContent
                    responsavelId={audiencia.responsavelId}
                    usuarios={usuarios}
                    size="sm"
                  />
                </AudienciaResponsavelPopover>
              ) : (
                audiencia.responsavelId && responsavelNomes?.get(audiencia.responsavelId) ? (
                  <span className="text-micro-caption text-muted-foreground/60">
                    {responsavelNomes.get(audiencia.responsavelId)}
                  </span>
                ) : (
                  <span className="text-micro-caption italic text-warning/60">Sem resp.</span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
