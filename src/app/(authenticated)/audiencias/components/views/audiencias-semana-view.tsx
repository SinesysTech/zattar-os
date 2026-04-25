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
  Clock3,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
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
    <div className="space-y-4">
      {/* Week Navigator */}
      <div className="flex items-center gap-2">
        <button onClick={handlePrevWeek} className="p-1.5 rounded-lg hover:bg-foreground/4 transition-colors text-muted-foreground/55 cursor-pointer">
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={handleToday}
          className={cn(
            'px-2.5 py-1 rounded-lg text-caption font-medium transition-colors cursor-pointer',
            isCurrentWeek ? 'bg-primary/12 text-primary' : 'bg-border/8 text-muted-foreground/50 hover:bg-border/15',
          )}
        >
          Hoje
        </button>
        <button onClick={handleNextWeek} className="p-1.5 rounded-lg hover:bg-foreground/4 transition-colors text-muted-foreground/55 cursor-pointer">
          <ChevronRight className="size-4" />
        </button>
        <span className="text-sm font-medium capitalize ml-1">{weekLabel}</span>
      </div>

      <Tabs value={selectedDay} onValueChange={setSelectedDay} className="space-y-4">
        <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-2xl bg-transparent p-0">
          {weekDays.map((day) => {
            const key = getDayKey(day);
            const dayAudiencias = audienciasByDay.get(key) ?? [];
            const lowPrepCount = dayAudiencias.filter(
              (a) => a.status === StatusAudiencia.Marcada && calcPrepScore(calcPrepItems(a)) < 50,
            ).length;
            const ongoingCount = dayAudiencias.filter((a) => getAudienciaTiming(a, new Date()).isOngoing).length;
            const today = isToday(day);

            return (
              <TabsTrigger
                key={key}
                value={key}
                className={cn(
                  'min-w-40 rounded-2xl border border-border/30 bg-card/55 px-4 py-3 text-left data-[state=active]:border-primary/25 data-[state=active]:bg-card',
                  'flex flex-col items-start gap-1.5',
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className={cn(
                    'text-xs font-semibold uppercase tracking-wider',
                    today ? 'text-primary' : 'text-muted-foreground/60',
                  )}>
                    {format(day, 'EEEE', { locale: ptBR })}
                  </span>
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-micro-caption tabular-nums',
                    today ? 'bg-primary/12 text-primary' : 'bg-muted/60 text-muted-foreground/70',
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/65">
                  <span>{dayAudiencias.length} no dia</span>
                  {ongoingCount > 0 && <span className="text-success">• {ongoingCount} em curso</span>}
                </div>
                {lowPrepCount > 0 ? (
                  <span className="text-micro-caption text-warning/80">
                    {lowPrepCount} com preparo baixo
                  </span>
                ) : (
                  <span className="text-micro-caption text-muted-foreground/45">
                    agenda organizada
                  </span>
                )}
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
            <TabsContent key={key} value={key} className="mt-0 space-y-4">
              <GlassPanel depth={dayIsToday ? 2 : 1} className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4 text-primary/70" />
                      <Text variant="overline" className="text-muted-foreground/70">
                        {dayIsToday ? 'Hoje' : 'Dia selecionado'}
                      </Text>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold capitalize">
                        {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </h3>
                      <p className="text-sm text-muted-foreground/60">
                        {dayIsToday
                          ? 'Acompanhamento operacional da pauta do dia.'
                          : 'Visão do preparo, sequência e encerramento das audiências deste dia.'}
                      </p>
                    </div>
                    {nextAudiencia && (
                      <p className="text-sm text-muted-foreground/70">
                        Próxima prioridade: <span className="font-medium text-foreground/85">{fmtTime(nextAudiencia.dataInicio)}</span> · {nextAudiencia.tipoDescricao || 'Audiência'} · {nextAudiencia.numeroProcesso}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:w-105">
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
                  <div className="mt-4 flex flex-wrap gap-2">
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
                <GlassPanel className="p-10 text-center">
                  <p className="text-sm font-medium text-foreground/75">
                    Nenhuma audiência neste dia útil.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground/55">
                    Use as tabs para revisar outra pauta da semana.
                  </p>
                </GlassPanel>
              ) : (
                <div className="space-y-4">
                  {groupedAudiencias.map((group) => (
                    <section key={group.key} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'size-2 rounded-full',
                            group.tone === 'success' && 'bg-success',
                            group.tone === 'primary' && 'bg-primary',
                            group.tone === 'muted' && 'bg-muted-foreground/35',
                          )} />
                          <h4 className="text-sm font-semibold text-foreground/85">
                            {group.title}
                          </h4>
                        </div>
                        <span className="text-micro-caption tabular-nums text-muted-foreground/55">
                          {group.items.length}
                        </span>
                      </div>
                      <div className="space-y-2">
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
    <div className="rounded-2xl border border-border/30 bg-background/55 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-micro-caption uppercase tracking-wider text-muted-foreground/55">
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
      <div className="mt-1 text-lg font-semibold tabular-nums text-foreground/85">
        {value}
      </div>
    </div>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border/30 bg-background/60 px-2.5 py-1 text-micro-caption text-muted-foreground/70">
      {children}
    </span>
  );
}

// ─── Internal: Week Day Card ──────────────────────────────────────────────

function WeekDayCard({ audiencia, onClick, responsavelNomes, usuarios, onResponsavelChange }: { audiencia: Audiencia; onClick: () => void; responsavelNomes?: Map<number, string>; usuarios?: Usuario[]; onResponsavelChange?: () => void }) {
  const now = new Date();
  let isPast = false;
  let isOngoing = false;
  const isFinalizada = audiencia.status === StatusAudiencia.Finalizada;
  try {
    isPast = parseISO(audiencia.dataFim) < now;
    isOngoing = parseISO(audiencia.dataInicio) <= now && parseISO(audiencia.dataFim) >= now;
  } catch { /* skip */ }

  const prepScore = calcPrepScore(calcPrepItems(audiencia));
  const prepStatus = prepScore >= 80 ? 'good' : prepScore >= 50 ? 'warning' : 'danger';
  const isVirtual = audiencia.modalidade === 'virtual' || audiencia.modalidade === 'hibrida';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className={cn(
        'w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer',
        'bg-card/80 border-border/40 hover:border-border/60 hover:shadow-sm hover:scale-[1.01]',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        (isPast || isFinalizada) && 'opacity-60',
        isOngoing && 'ring-1 ring-success/30 border-success/25 bg-success/3',
      )}
    >
      {/* 1. Hora + Status */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs tabular-nums font-semibold text-foreground/80">
          {fmtTime(audiencia.dataInicio)} – {fmtTime(audiencia.dataFim)}
        </span>
        <div className="flex items-center gap-1.5">
          {isOngoing && <span className="size-2 rounded-full bg-success animate-pulse" />}
          {isFinalizada && <span className="text-micro-caption font-semibold text-success px-1.5 py-0.5 rounded-full bg-success/15">OK</span>}
          <Text
            variant="micro-badge"
            as="span"
            className={cn(
            'font-semibold tabular-nums px-1.5 py-0.5 rounded-full',
            prepStatus === 'good' ? 'bg-success/15 text-success' : prepStatus === 'warning' ? 'bg-warning/15 text-warning' : 'bg-destructive/15 text-destructive',
          )}
          >
            {prepScore}%
          </Text>
        </div>
      </div>

      {/* 2. Tipo + Modalidade (mesma linha) */}
      <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
        <p className="text-xs font-medium text-foreground wrap-break-word leading-snug truncate">
          {audiencia.tipoDescricao || 'Audiência'}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          {isVirtual ? <Video className="size-2.5 text-info/60" /> : audiencia.modalidade === 'presencial' ? <Building2 className="size-2.5 text-warning/60" /> : null}
          <span className="text-micro-caption text-muted-foreground/60">
            {audiencia.modalidade === 'virtual' ? 'Virtual' : audiencia.modalidade === 'presencial' ? 'Presencial' : audiencia.modalidade === 'hibrida' ? 'Híbrida' : ''}
          </span>
        </div>
        {audiencia.urlAudienciaVirtual && isVirtual && (
          <span className="text-micro-caption font-semibold px-1.5 py-0.5 rounded bg-info/15 text-info/70 shrink-0">Sala</span>
        )}
      </div>

      {/* 3. Partes */}
      {(audiencia.poloAtivoNome || audiencia.poloPassivoNome) && (
        <p className="text-micro-caption text-muted-foreground/65 mt-1 wrap-break-word leading-snug">
          {audiencia.poloAtivoNome || '—'} <span className="text-muted-foreground/35">vs</span> {audiencia.poloPassivoNome || '—'}
        </p>
      )}

      {/* 4. TRT badge + Grau + Número do processo (mesma linha) */}
      {audiencia.numeroProcesso && (
        <div className="flex items-center gap-1.5 mt-1 min-w-0">
          {audiencia.trt && (
            <span className="text-micro-caption font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary/70 shrink-0">{audiencia.trt}</span>
          )}
          {audiencia.grau && (
            <span className="text-micro-caption text-muted-foreground/50 shrink-0">{GRAU_TRIBUNAL_LABELS[audiencia.grau]}</span>
          )}
          <span className="text-micro-caption text-muted-foreground/65 tabular-nums truncate">
            {audiencia.numeroProcesso}
          </span>
        </div>
      )}

      {/* 5. Órgão jurisdicional */}
      {audiencia.orgaoJulgadorOrigem && (
        <p className="text-micro-caption text-muted-foreground/50 mt-0.5 truncate" title={audiencia.orgaoJulgadorOrigem}>
          {audiencia.orgaoJulgadorOrigem}
        </p>
      )}

      {/* 6. Observações (truncado) */}
      {audiencia.observacoes && (
        <p className="text-micro-caption text-muted-foreground/45 mt-1 truncate italic" title={audiencia.observacoes}>
          {audiencia.observacoes}
        </p>
      )}

      {/* 9. Responsável — footer, alinhado à direita */}
      <div className="flex justify-end mt-2">
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
              size="xs"
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
  );
}
