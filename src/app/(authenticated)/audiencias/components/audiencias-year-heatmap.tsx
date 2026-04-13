'use client';

import * as React from 'react';
import { getYear, getMonth, getDate, format, parseISO, isToday as checkIsToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarDays,
  Flame,
  BarChart2,
  CheckCircle2,
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

import type { Audiencia } from '../domain';
import { StatusAudiencia } from '../domain';
import { AudienciasDiaDialog } from './audiencias-dia-dialog';

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasYearHeatmapProps {
  audiencias: Audiencia[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  refetch: () => void;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEKDAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

// =============================================================================
// HELPERS
// =============================================================================

function getDayIntensity(count: number): string {
  if (count === 0) return 'bg-white/[0.05]';
  if (count === 1) return 'bg-primary/30';
  if (count === 2) return 'bg-primary/55';
  return 'bg-primary/85';
}

function buildDayMap(audiencias: Audiencia[], year: number) {
  const map = new Map<string, Audiencia[]>();
  for (const aud of audiencias) {
    const d = parseISO(aud.dataInicio);
    if (getYear(d) === year) {
      const key = `${getMonth(d)}-${getDate(d)}`;
      const list = map.get(key) || [];
      list.push(aud);
      map.set(key, list);
    }
  }
  return map;
}

function computeStats(audiencias: Audiencia[], year: number) {
  const yearAuds = audiencias.filter(a => getYear(parseISO(a.dataInicio)) === year);
  const total = yearAuds.length;
  const realizadas = yearAuds.filter(a => a.status === StatusAudiencia.Finalizada).length;
  const taxa = total > 0 ? Math.round((realizadas / total) * 100) : 0;

  // Mês mais intenso
  const monthCounts = new Array(12).fill(0);
  for (const a of yearAuds) {
    monthCounts[getMonth(parseISO(a.dataInicio))]++;
  }
  const maxMonth = monthCounts.indexOf(Math.max(...monthCounts));
  const maxMonthCount = monthCounts[maxMonth];

  // Média semanal (52 semanas)
  const weekAvg = total > 0 ? (total / 52).toFixed(1) : '0';

  // Próxima audiência
  const now = new Date();
  const futuras = yearAuds
    .filter(a => parseISO(a.dataInicio) > now && a.status === StatusAudiencia.Marcada)
    .sort((a, b) => parseISO(a.dataInicio).getTime() - parseISO(b.dataInicio).getTime());
  const proxima = futuras[0] || null;

  return { total, realizadas, taxa, maxMonth, maxMonthCount, weekAvg, proxima };
}

// =============================================================================
// MONTH GRID COMPONENT
// =============================================================================

const MonthGrid = React.memo(function MonthGrid({
  monthIndex,
  year,
  dayMap,
  onDayClick,
}: {
  monthIndex: number;
  year: number;
  dayMap: Map<string, Audiencia[]>;
  onDayClick: (month: number, day: number) => void;
}) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDow = new Date(year, monthIndex, 1).getDay(); // 0=Dom

  const cells: React.ReactNode[] = [];

  // Empty cells before first day
  for (let i = 0; i < firstDow; i++) {
    cells.push(<div key={`e-${i}`} className="aspect-square" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${monthIndex}-${d}`;
    const auds = dayMap.get(key) || [];
    const count = auds.length;
    const today = checkIsToday(new Date(year, monthIndex, d));
    const dateLabel = format(new Date(year, monthIndex, d), "dd 'de' MMM", { locale: ptBR });
    const tooltipText = count
      ? `${dateLabel} · ${count} audiência${count > 1 ? 's' : ''}`
      : `${dateLabel} · Nenhuma`;

    cells.push(
      <TooltipTrigger asChild key={d}>
        <button
          type="button"
          onClick={() => count > 0 && onDayClick(monthIndex, d)}
          className={cn(
            'aspect-square rounded-[2px] transition-all duration-100',
            getDayIntensity(count),
            today && 'ring-[1.5px] ring-primary ring-offset-1 ring-offset-transparent',
            count > 0 && 'cursor-pointer hover:opacity-80 hover:scale-[1.3]',
            count === 0 && 'cursor-default',
          )}
          aria-label={tooltipText}
        >
          <TooltipContent side="top" className="text-micro-caption px-2 py-1">
            {tooltipText}
          </TooltipContent>
        </button>
      </TooltipTrigger>
    );
  }

  return (
    <div>
      <div className="text-overline text-muted-foreground/70 mb-1.5">
        {MONTH_NAMES[monthIndex]}
      </div>
      <div className="grid grid-cols-7 gap-[2px] mb-1">
        {WEEKDAY_LABELS.map((lbl, i) => (
          <div key={i} className="text-micro-caption text-muted-foreground/50 text-center">
            {lbl}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[2px]">
        {cells}
      </div>
    </div>
  );
});

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 px-5">
      <div className="flex items-center gap-2 mb-3">
        <IconContainer size="md" className={iconBg}>
          <Icon className={cn('w-3.5 h-3.5', iconColor)} />
        </IconContainer>
        <span className="text-meta-label">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasYearHeatmap({
  audiencias,
  currentDate,
  onDateChange,
  refetch,
}: AudienciasYearHeatmapProps) {
  const year = getYear(currentDate);
  const dayMap = React.useMemo(() => buildDayMap(audiencias, year), [audiencias, year]);
  const stats = React.useMemo(() => computeStats(audiencias, year), [audiencias, year]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [audienciasDia, setAudienciasDia] = React.useState<Audiencia[]>([]);
  const [dataSelecionada, setDataSelecionada] = React.useState<Date>(new Date());

  const handleDayClick = React.useCallback(
    (month: number, day: number) => {
      const key = `${month}-${day}`;
      const auds = dayMap.get(key) || [];
      if (auds.length > 0) {
        setAudienciasDia(auds);
        setDataSelecionada(new Date(year, month, day));
        setDialogOpen(true);
      }
    },
    [dayMap, year],
  );

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-full flex-col overflow-y-auto p-4 sm:p-6">
        {/* Year Navigator */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 border border-white/[0.08] bg-white/[0.06] backdrop-blur-sm hover:bg-white/[0.12]"
              onClick={() => onDateChange(new Date(year - 1, 0, 1))}
              aria-label="Ano anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-section-title w-14 text-center select-none">
              {year}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 border border-white/[0.08] bg-white/[0.06] backdrop-blur-sm hover:bg-white/[0.12]"
              onClick={() => onDateChange(new Date(year + 1, 0, 1))}
              aria-label="Próximo ano"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              className="ml-2 rounded-full px-4"
              onClick={() => onDateChange(new Date())}
            >
              Hoje
            </Button>
          </div>
        </div>

        {/* Main Layout: Heatmap + Stats Sidebar */}
        <div className="flex gap-5 flex-wrap xl:flex-nowrap">
          {/* Heatmap Panel */}
          <GlassPanel depth={1} className="p-6 flex-1 min-w-0">
            <div className="grid grid-cols-4 gap-x-6 gap-y-8">
              {Array.from({ length: 12 }, (_, i) => (
                <Tooltip key={i}>
                  <MonthGrid
                    monthIndex={i}
                    year={year}
                    dayMap={dayMap}
                    onDayClick={handleDayClick}
                  />
                </Tooltip>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-8 flex items-center gap-3">
              <span className="text-micro-caption">Menos</span>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-white/[0.05]" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/30" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/55" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/[0.65]" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/85" />
              </div>
              <span className="text-micro-caption">Mais</span>
              <span className="text-muted-foreground/40 mx-2 text-micro-caption">·</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-white/[0.05] ring-[1.5px] ring-primary ring-offset-1 ring-offset-transparent" />
                <span className="text-micro-caption">Hoje</span>
              </div>
            </div>
          </GlassPanel>

          {/* Stats Sidebar */}
          <div className="flex flex-col gap-4 w-full xl:w-64 shrink-0">
            {/* Total no Ano */}
            <StatCard icon={CalendarDays} iconBg="bg-primary/15" iconColor="text-primary" label="Total no Ano">
              <div className="text-kpi-value">{stats.total}</div>
            </StatCard>

            {/* Mês Mais Intenso */}
            <StatCard icon={Flame} iconBg="bg-warning/12" iconColor="text-warning" label="Mês Mais Intenso">
              <div className="text-card-title">{MONTH_NAMES[stats.maxMonth]}</div>
              <div className="text-widget-sub mt-0.5">
                {stats.maxMonthCount} audiências
              </div>
              <div className="mt-3 h-1 rounded-full bg-white/[0.06]">
                <div
                  className="h-1 rounded-full bg-warning/70"
                  style={{ width: `${stats.total > 0 ? Math.round((stats.maxMonthCount / stats.total) * 100) : 0}%` }}
                />
              </div>
            </StatCard>

            {/* Média Semanal */}
            <StatCard icon={BarChart2} iconBg="bg-success/12" iconColor="text-success" label="Média Semanal">
              <div className="text-kpi-value">{stats.weekAvg}</div>
              <div className="text-widget-sub mt-1">audiências / semana</div>
            </StatCard>

            {/* Taxa de Realização */}
            <StatCard icon={CheckCircle2} iconBg="bg-primary/15" iconColor="text-primary" label="Taxa de Realização">
              <div className="text-kpi-value">
                {stats.taxa}
                <span className="text-subsection-title text-muted-foreground">%</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-white/[0.06]">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80"
                  style={{ width: `${stats.taxa}%` }}
                />
              </div>
              <div className="text-widget-sub mt-1.5">
                {stats.realizadas} de {stats.total} realizadas
              </div>
            </StatCard>

            {/* Próxima Audiência */}
            {stats.proxima && (
              <StatCard icon={Clock} iconBg="bg-info/12" iconColor="text-info" label="Próxima">
                <div className="text-label font-semibold">
                  {format(parseISO(stats.proxima.dataInicio), "dd MMM · HH'h'mm", { locale: ptBR })}
                </div>
                <div className="text-mono-num mt-0.5">
                  {stats.proxima.numeroProcesso.substring(0, 15)}
                </div>
                {stats.proxima.tipoDescricao && (
                  <div className="mt-2">
                    <span className="text-micro-badge px-2 py-0.5 rounded-full font-medium bg-info/12 text-info border border-info/20">
                      {stats.proxima.tipoDescricao}
                    </span>
                  </div>
                )}
              </StatCard>
            )}
          </div>
        </div>
      </div>

      {/* Dialog */}
      <AudienciasDiaDialog
        audiencias={audienciasDia}
        data={dataSelecionada}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />
    </TooltipProvider>
  );
}
