'use client';

/**
 * PericiasYearHeatmap — Visão anual densa com intensidade graduada por dia.
 * ============================================================================
 * Espelho do padrão AudienciasYearHeatmap adaptado a perícias:
 *   • Grid 4×3 meses, cada célula colorida pela quantidade de perícias no dia
 *   • Stats sidebar: Total no Ano, Mês Mais Intenso, Média Semanal,
 *     Taxa de Entrega, Próxima Entrega
 *
 * Diferenças intencionais vs. audiências:
 *   • Células vazias usam `bg-muted/30` (visível em light+dark) em vez do
 *     `bg-white/[0.05]` (quase invisível em light mode).
 *   • Stats cards são `GlassPanel depth={2}` do design system, não divs com
 *     `bg-white/[0.04]` hardcoded.
 * ============================================================================
 */

import * as React from 'react';
import {
  getYear,
  getMonth,
  getDate,
  format,
  parseISO,
  isToday as checkIsToday,
  differenceInCalendarDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarDays,
  Flame,
  BarChart2,
  FileCheck2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { Pericia } from '../domain';
import { SituacaoPericiaCodigo } from '../domain';
import { Text } from '@/components/ui/typography';

// =============================================================================
// TIPOS
// =============================================================================

export interface PericiasYearHeatmapProps {
  pericias: Pericia[];
  year: number;
  onYearChange: (year: number) => void;
  onDayClick: (date: Date, pericias: Pericia[]) => void;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEKDAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

// =============================================================================
// HELPERS
// =============================================================================

function getDayIntensity(count: number): string {
  if (count === 0) return 'bg-muted/30';
  if (count === 1) return 'bg-primary/30';
  if (count === 2) return 'bg-primary/55';
  return 'bg-primary/85';
}

function buildDayMap(pericias: Pericia[], year: number) {
  const map = new Map<string, Pericia[]>();
  for (const p of pericias) {
    if (!p.prazoEntrega) continue;
    try {
      const d = parseISO(p.prazoEntrega);
      if (getYear(d) === year) {
        const key = `${getMonth(d)}-${getDate(d)}`;
        const list = map.get(key) || [];
        list.push(p);
        map.set(key, list);
      }
    } catch {
      // prazo inválido — ignora
    }
  }
  return map;
}

interface YearStats {
  total: number;
  laudosJuntados: number;
  taxaEntrega: number;
  maxMonth: number;
  maxMonthCount: number;
  weekAvg: string;
  proxima: Pericia | null;
}

function computeStats(pericias: Pericia[], year: number): YearStats {
  const yearPericias = pericias.filter((p) => {
    if (!p.prazoEntrega) return false;
    try {
      return getYear(parseISO(p.prazoEntrega)) === year;
    } catch {
      return false;
    }
  });

  const total = yearPericias.length;
  const laudosJuntados = yearPericias.filter(
    (p) =>
      p.laudoJuntado ||
      p.situacaoCodigo === SituacaoPericiaCodigo.LAUDO_JUNTADO ||
      p.situacaoCodigo === SituacaoPericiaCodigo.FINALIZADA,
  ).length;
  const taxaEntrega = total > 0 ? Math.round((laudosJuntados / total) * 100) : 0;

  const monthCounts = new Array(12).fill(0);
  for (const p of yearPericias) {
    monthCounts[getMonth(parseISO(p.prazoEntrega!))]++;
  }
  const maxMonth = monthCounts.indexOf(Math.max(...monthCounts));
  const maxMonthCount = monthCounts[maxMonth];

  const weekAvg = total > 0 ? (total / 52).toFixed(1) : '0';

  const now = new Date();
  const futuras = yearPericias
    .filter((p) => {
      const d = parseISO(p.prazoEntrega!);
      return (
        d > now &&
        p.situacaoCodigo !== SituacaoPericiaCodigo.FINALIZADA &&
        p.situacaoCodigo !== SituacaoPericiaCodigo.CANCELADA
      );
    })
    .sort(
      (a, b) =>
        parseISO(a.prazoEntrega!).getTime() -
        parseISO(b.prazoEntrega!).getTime(),
    );
  const proxima = futuras[0] || null;

  return {
    total,
    laudosJuntados,
    taxaEntrega,
    maxMonth,
    maxMonthCount,
    weekAvg,
    proxima,
  };
}

// =============================================================================
// MONTH GRID
// =============================================================================

interface MonthGridProps {
  monthIndex: number;
  year: number;
  dayMap: Map<string, Pericia[]>;
  onDayClick: (month: number, day: number) => void;
}

const MonthGrid = React.memo(function MonthGrid({
  monthIndex,
  year,
  dayMap,
  onDayClick,
}: MonthGridProps) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDow = new Date(year, monthIndex, 1).getDay();

  const cells: React.ReactNode[] = [];

  for (let i = 0; i < firstDow; i++) {
    cells.push(<div key={`e-${i}`} className="aspect-square" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${monthIndex}-${d}`;
    const dayPericias = dayMap.get(key) || [];
    const count = dayPericias.length;
    const today = checkIsToday(new Date(year, monthIndex, d));
    const dateLabel = format(new Date(year, monthIndex, d), "dd 'de' MMM", {
      locale: ptBR,
    });
    const tooltipText = count
      ? `${dateLabel} · ${count} perícia${count > 1 ? 's' : ''}`
      : `${dateLabel} · Nenhuma`;

    cells.push(
      <Tooltip key={d}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => count > 0 && onDayClick(monthIndex, d)}
            className={cn(
              'aspect-square rounded-[2px] transition-all duration-100',
              getDayIntensity(count),
              today &&
                'ring-[1.5px] ring-primary ring-offset-1 ring-offset-transparent',
              count > 0 && 'cursor-pointer hover:opacity-80 hover:scale-[1.3]',
              count === 0 && 'cursor-default',
            )}
            aria-label={tooltipText}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ "text-[10px] px-2 py-1")}>
          {tooltipText}
        </TooltipContent>
      </Tooltip>,
    );
  }

  return (
    <div>
      <div className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-1.5")}>
        {MONTH_NAMES[monthIndex]}
      </div>
      <div className={cn("grid grid-cols-7 inline-nano mb-1")}>
        {WEEKDAY_LABELS.map((lbl, i) => (
          <div
            key={i}
            className="text-[9px] text-muted-foreground/50 text-center"
          >
            {lbl}
          </div>
        ))}
      </div>
      <div className={cn("grid grid-cols-7 inline-nano")}>{cells}</div>
    </div>
  );
});

// =============================================================================
// STAT CARD (usando GlassPanel depth={2} do DS)
// =============================================================================

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  children: React.ReactNode;
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  children,
}: StatCardProps) {
  return (
    <GlassPanel depth={2} className={cn(/* design-system-escape: px-5 padding direcional sem Inset equiv. */ "inset-card-compact px-5")}>
      <div className={cn("flex items-center inline-tight mb-3")}>
        <IconContainer size="md" className={iconBg}>
          <Icon className={cn('w-3.5 h-3.5', iconColor)} />
        </IconContainer>
        <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70")}>
          {label}
        </span>
      </div>
      {children}
    </GlassPanel>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function PericiasYearHeatmap({
  pericias,
  year,
  onYearChange,
  onDayClick,
}: PericiasYearHeatmapProps) {
  const dayMap = React.useMemo(
    () => buildDayMap(pericias, year),
    [pericias, year],
  );
  const stats = React.useMemo(
    () => computeStats(pericias, year),
    [pericias, year],
  );

  const handleDayClick = React.useCallback(
    (month: number, day: number) => {
      const key = `${month}-${day}`;
      const dayPericias = dayMap.get(key) || [];
      if (dayPericias.length > 0) {
        onDayClick(new Date(year, month, day), dayPericias);
      }
    },
    [dayMap, year, onDayClick],
  );

  return (
    <TooltipProvider delayDuration={100}>
      <div className="w-full">
        {/* Main Layout: Heatmap + Stats Sidebar */}
        <div className={cn(/* design-system-escape: gap-5 gap sem token DS */ "flex gap-5 flex-wrap xl:flex-nowrap")}>
          {/* Heatmap Panel */}
          <GlassPanel depth={1} className={cn("inset-dialog flex-1 min-w-0")}>
            {/* Year Navigator (padrão audiências/expedientes — inline no painel) */}
            <div className="flex items-center justify-between mb-6">
              <div className={cn("flex items-center inline-tight flex-1")}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 border border-border/50 bg-accent/30 backdrop-blur-sm hover:bg-accent/50"
                  onClick={() => onYearChange(year - 1)}
                  aria-label="Ano anterior"
                >
                  <ChevronLeft className="w-4 h-4 text-foreground/60" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 border border-border/50 bg-accent/30 backdrop-blur-sm hover:bg-accent/50"
                  onClick={() => onYearChange(year + 1)}
                  aria-label="Próximo ano"
                >
                  <ChevronRight className="w-4 h-4 text-foreground/60" />
                </Button>
                <Button
                  size="sm"
                  className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; */ "ml-1 rounded-full px-4 text-caption font-semibold")}
                  onClick={() => onYearChange(new Date().getFullYear())}
                >
                  Hoje
                </Button>
              </div>

              <span className={cn(/* design-system-escape: tracking-tight sem token DS */ "text-body font-bold tracking-tight text-center tabular-nums")}>
                {year}
              </span>

              <div className="flex-1" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
              {Array.from({ length: 12 }, (_, i) => (
                <MonthGrid
                  key={i}
                  monthIndex={i}
                  year={year}
                  dayMap={dayMap}
                  onDayClick={handleDayClick}
                />
              ))}
            </div>

            {/* Legend */}
            <div className={cn("mt-8 flex items-center inline-medium flex-wrap")}>
              <span className="text-[10px] text-muted-foreground/60">
                Menos
              </span>
              <div className={cn("flex items-center inline-micro")}>
                <div className="w-2.5 h-2.5 rounded-[2px] bg-muted/30" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/30" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/55" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/85" />
              </div>
              <span className="text-[10px] text-muted-foreground/60">Mais</span>
              <span className={cn(/* design-system-escape: mx-2 margin sem primitiva DS */ "text-muted-foreground/40 mx-2 text-[10px]")}>·</span>
              <div className={cn("flex items-center inline-snug")}>
                <div className="w-2.5 h-2.5 rounded-[2px] bg-muted/30 ring-[1.5px] ring-primary ring-offset-1 ring-offset-transparent" />
                <span className="text-[10px] text-muted-foreground/60">Hoje</span>
              </div>
            </div>
          </GlassPanel>

          {/* Stats Sidebar */}
          <div className={cn("flex flex-col inline-medium w-full xl:w-64 shrink-0")}>
            <StatCard
              icon={CalendarDays}
              iconBg="bg-primary/15"
              iconColor="text-primary"
              label="Total no Ano"
            >
              <Text variant="kpi-value">
                {stats.total}
              </Text>
              <div className="text-[11px] text-muted-foreground/60 mt-1">
                perícia{stats.total !== 1 ? 's' : ''} programada{stats.total !== 1 ? 's' : ''}
              </div>
            </StatCard>

            <StatCard
              icon={Flame}
              iconBg="bg-warning/12"
              iconColor="text-warning"
              label="Mês Mais Intenso"
            >
              <div className={cn(/* design-system-escape: tracking-tight sem token DS */ "text-body-sm font-semibold tracking-tight")}>
                {MONTH_NAMES[stats.maxMonth]}
              </div>
              <div className="text-[11px] text-muted-foreground/60 mt-0.5">
                {stats.maxMonthCount} entrega{stats.maxMonthCount !== 1 ? 's' : ''}
              </div>
              <div className="mt-3 h-1 rounded-full bg-muted/30">
                <div
                  className="h-1 rounded-full bg-warning/70 transition-all duration-500"
                  style={{
                    width: `${stats.total > 0 ? Math.round((stats.maxMonthCount / stats.total) * 100) : 0}%`,
                  }}
                />
              </div>
            </StatCard>

            <StatCard
              icon={BarChart2}
              iconBg="bg-success/12"
              iconColor="text-success"
              label="Média Semanal"
            >
              <Text variant="kpi-value">
                {stats.weekAvg}
              </Text>
              <div className="text-[11px] text-muted-foreground/60 mt-1">
                entregas / semana
              </div>
            </StatCard>

            <StatCard
              icon={FileCheck2}
              iconBg="bg-primary/15"
              iconColor="text-primary"
              label="Taxa de Entrega"
            >
              <Text variant="kpi-value">
                {stats.taxaEntrega}
                <span className={cn("text-body text-muted-foreground/60 ml-0.5")}>
                  %
                </span>
              </Text>
              <div className="mt-3 h-1.5 rounded-full bg-muted/30">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${stats.taxaEntrega}%` }}
                />
              </div>
              <div className="text-[11px] text-muted-foreground/60 mt-1.5">
                {stats.laudosJuntados} de {stats.total} com laudo juntado
              </div>
            </StatCard>

            {stats.proxima && (
              <StatCard
                icon={Clock}
                iconBg="bg-info/12"
                iconColor="text-info"
                label="Próxima Entrega"
              >
                <div className={cn(/* design-system-escape: tracking-tight sem token DS */ "text-body-sm font-semibold tracking-tight")}>
                  {format(parseISO(stats.proxima.prazoEntrega!), "dd 'de' MMM", {
                    locale: ptBR,
                  })}
                </div>
                <div className="text-[11px] text-muted-foreground/60 mt-0.5">
                  em {differenceInCalendarDays(
                    parseISO(stats.proxima.prazoEntrega!),
                    new Date(),
                  )}{' '}
                  dia
                  {differenceInCalendarDays(
                    parseISO(stats.proxima.prazoEntrega!),
                    new Date(),
                  ) !== 1
                    ? 's'
                    : ''}
                </div>
                <div className="text-[11px] text-foreground/80 mt-2 truncate">
                  {stats.proxima.numeroProcesso}
                </div>
              </StatCard>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
