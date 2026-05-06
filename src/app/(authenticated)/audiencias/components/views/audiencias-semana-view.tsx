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
  ativo?: boolean;
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
    <div className={cn("stack-default")}>
      {/* Week Navigator */}
      <div className={cn("flex items-center inline-tight")}>
        <button onClick={handlePrevWeek} className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "p-1.5 rounded-lg hover:bg-foreground/4 transition-colors text-muted-foreground/70 cursor-pointer")}>
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={handleToday}
          className={cn(
            /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv.; */ 'px-2.5 py-1 rounded-lg text-caption font-medium transition-colors cursor-pointer',
            isCurrentWeek ? 'bg-primary/12 text-primary' : 'bg-border/8 text-muted-foreground/70 hover:bg-border/15',
          )}
        >
          Hoje
        </button>
        <button onClick={handleNextWeek} className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "p-1.5 rounded-lg hover:bg-foreground/4 transition-colors text-muted-foreground/70 cursor-pointer")}>
          <ChevronRight className="size-4" />
        </button>
        <span className={cn( "text-caption font-medium capitalize ml-1")}>{weekLabel}</span>
      </div>

      <Tabs value={selectedDay} onValueChange={setSelectedDay} className={cn("stack-default")}>
        <TabsList variant="week">
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
                className={cn('flex-1 gap-1.5', today && 'text-primary')}
              >
                <span className="capitalize">{format(day, 'EEE', { locale: ptBR })}</span>
                <span className="font-semibold tabular-nums">{format(day, 'd')}</span>
                {dayAudiencias.length > 0 && (
                  <span className={cn(
                    'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums',
                    lowPrepCount > 0 ? 'bg-warning/15 text-warning' : 'bg-primary/15 text-primary',
                  )}>
                    {dayAudiencias.length}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {weekDays.map((day) => {
          const key = getDayKey(day);
          const dayAudiencias = audienciasByDay.get(key) ?? [];
          // const dayIsToday = isToday(day);
          const groupedAudiencias = getGroupedAudiencias(dayAudiencias);

          return (
            <TabsContent key={key} value={key} className={cn("mt-0 stack-default")}>
              {dayAudiencias.length === 0 ? (
                <GlassPanel className={cn(/* design-system-escape: p-10 → usar <Inset> */ "p-10 text-center")}>
                  <Text variant="label" as="p">
                    Nenhuma audiência neste dia útil.
                  </Text>
                  <Text variant="caption" as="p" className="mt-1">
                    Use as tabs para revisar outra pauta da semana.
                  </Text>
                </GlassPanel>
              ) : (
                <div className={cn("stack-default")}>
                  {groupedAudiencias.map((group) => (
                    <section key={group.key} className={cn("stack-tight")}>
                      <div className={cn("flex items-center justify-between inline-medium")}>
                        <div className={cn("flex items-center inline-tight")}>
                          <span className={cn(
                            'size-2 rounded-full',
                            group.tone === 'success' && 'bg-success',
                            group.tone === 'primary' && 'bg-primary',
                            group.tone === 'muted' && 'bg-muted-foreground/35',
                          )} />
                          <h3 className="text-overline">
                            {group.title}
                          </h3>
                        </div>
                        <span className="text-mono-num text-muted-foreground/65">
                          {group.items.length}
                        </span>
                      </div>
                      <div className={cn("stack-tight")}>
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
        'group w-full text-left rounded-2xl border border-border/60 bg-card inset-card-compact cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:border-border hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isOngoing && 'border-l-2 border-l-success ring-1 ring-success/20 bg-success/3',
        (isPast || isFinalizada) && !isOngoing && 'opacity-55',
        isCancelada && !isOngoing && 'opacity-45 border-l-2 border-l-destructive',
      )}
    >
      <div className={cn("flex items-center inline-default")}>

        {/* TEMPORAL: hora + prep score (coluna fixa à esquerda) */}
        <div className={cn("flex flex-col items-center inline-snug w-22 shrink-0 pt-0.5")}>
          {isOngoing && <span className="size-2 rounded-full bg-success animate-pulse" />}
          <div className={cn(/* design-system-escape: leading-tight sem token DS */ "text-caption font-semibold text-foreground leading-tight whitespace-nowrap tabular-nums")}>
            {fmtTime(audiencia.dataInicio)}<span className="text-[10px] font-normal ml-px">h</span>
          </div>
          <div className={cn(
            /* design-system-escape: px-1 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; */ 'text-[10px] font-semibold tabular-nums rounded px-1 py-0.5',
            prepStatus === 'good'
              ? 'bg-success/15 text-success'
              : prepStatus === 'warning'
                ? 'bg-warning/15 text-warning'
                : 'bg-destructive/15 text-destructive',
          )}>
            {prepScore}%
          </div>
        </div>

        {/* MAIN INFO */}
        <div className="flex-1 min-w-0">

          {/* L1 — Tipo como título + badges/flags à direita */}
          <div className={cn("flex items-center inline-tight")}>
            <h3 className="text-card-title text-foreground truncate">
              {audiencia.tipoDescricao || 'Audiência'}
            </h3>
            <div className={cn("ml-auto flex items-center inline-snug shrink-0")}>
              {modalidade && (
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                  modalidade === 'virtual'
                    ? 'bg-info/10 border border-info/25 text-info'
                    : modalidade === 'presencial'
                      ? 'bg-warning/10 border border-warning/25 text-warning'
                      : 'bg-primary/10 border border-primary/25 text-primary',
                )}>
                  {ModalidadeIcon && <ModalidadeIcon className="w-2 h-2" />}
                  {MODALIDADE_LABEL[modalidade]}
                </span>
              )}
              {hasVirtualRoom && (
                <span className="inline-flex items-center gap-1 bg-info/10 border border-info/25 text-info rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                  <ExternalLink className="w-2 h-2" />
                  Sala
                </span>
              )}
              {audiencia.segredoJustica && (
                <span className="inline-flex items-center gap-1 bg-warning/10 border border-warning/25 text-warning rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                  <Lock className="w-2 h-2" />
                  Segredo
                </span>
              )}
              {isFinalizada && (
                <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; */ "text-micro-caption font-semibold text-success px-1.5 py-0.5 rounded-full bg-success/15")}>
                  OK
                </span>
              )}
            </div>
          </div>

          {/* Identidade Processual */}
          {(audiencia.poloAtivoNome || audiencia.poloPassivoNome || audiencia.trt || audiencia.numeroProcesso) && (
            <div className={cn("mt-3 border-t border-border/40 pt-3 stack-micro")}>
              {(audiencia.poloAtivoNome || audiencia.poloPassivoNome) && (
                <p className="text-caption font-semibold text-foreground leading-snug">
                  {audiencia.poloAtivoNome || '—'}
                  {audiencia.poloAtivoNome && audiencia.poloPassivoNome && (
                    <span className="mx-1.5 text-[10px] font-normal text-muted-foreground/65">vs</span>
                  )}
                  {audiencia.poloPassivoNome && (
                    <span className="font-medium text-muted-foreground/80">{audiencia.poloPassivoNome}</span>
                  )}
                </p>
              )}
              {(audiencia.trt || grauLabel || audiencia.numeroProcesso || orgao) && (
                <p className="truncate text-caption text-muted-foreground/55">
                  {[audiencia.trt, grauLabel, audiencia.numeroProcesso, orgao].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          )}

          {/* Observações */}
          {audiencia.observacoes && (
            <div className={cn("mt-3 border-t border-border/40 pt-3")}>
              <Text variant="overline" as="p" className="mb-1">Observações</Text>
              <p className="text-caption text-foreground/75 line-clamp-2">{audiencia.observacoes}</p>
            </div>
          )}

          {/* Footer */}
          <div
            className={cn("mt-3 border-t border-border/40 pt-3 flex items-center inline-snug")}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className={cn("flex items-center inline-micro")}>
              <button
                type="button"
                onClick={onClick}
                className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; */ "flex h-6 cursor-pointer items-center inline-micro rounded-md border border-border/40 px-2 text-[10px] font-medium text-muted-foreground/60 transition-colors hover:border-border/40 hover:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
              >
                <ExternalLink className="size-3" />
                Detalhes
              </button>
              {hasVirtualRoom && audiencia.urlAudienciaVirtual && (
                <a
                  href={audiencia.urlAudienciaVirtual}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; */ "flex h-6 items-center inline-micro rounded-md border border-info/25 bg-info/10 px-2 text-[10px] font-medium text-info transition-colors hover:bg-info/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                >
                  <ExternalLink className="size-3" />
                  Entrar na sala
                </a>
              )}
            </div>

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
        </div>
      </div>
    </div>
  );
}
