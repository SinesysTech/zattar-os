'use client';

/**
 * ObrigacoesYearHeatmap — Heatmap anual estilo audiências/expedientes
 * ============================================================================
 * 12 meses em grid + stats sidebar (Total, Mês mais intenso, Média semanal,
 * Taxa efetivação, Próxima parcela). Agrupa por data de vencimento de parcela.
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
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarDays,
  Flame,
  BarChart2,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Wallet,
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

import type { AcordoComParcelas, Parcela } from '../../domain';

// =============================================================================
// TYPES
// =============================================================================

interface ParcelaDisplay {
  parcela: Parcela;
  acordo: AcordoComParcelas;
}

interface ObrigacoesYearHeatmapProps {
  acordos: AcordoComParcelas[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onDayClick?: (itens: ParcelaDisplay[], date: Date) => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const WEEKDAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

const CURRENCY = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

// =============================================================================
// HELPERS
// =============================================================================

function getDayIntensity(count: number): string {
  if (count === 0) return 'bg-muted/50';
  if (count === 1) return 'bg-primary/30';
  if (count === 2) return 'bg-primary/55';
  return 'bg-primary/85';
}

function buildDayMap(acordos: AcordoComParcelas[], year: number) {
  const map = new Map<string, ParcelaDisplay[]>();
  acordos.forEach((acordo) => {
    acordo.parcelas?.forEach((parcela) => {
      if (!parcela.dataVencimento) return;
      try {
        const d = parseISO(parcela.dataVencimento);
        if (getYear(d) === year) {
          const key = `${getMonth(d)}-${getDate(d)}`;
          const list = map.get(key) || [];
          list.push({ parcela, acordo });
          map.set(key, list);
        }
      } catch {
        /* noop */
      }
    });
  });
  return map;
}

function computeStats(acordos: AcordoComParcelas[], year: number) {
  const parcelasDoAno: ParcelaDisplay[] = [];
  acordos.forEach((acordo) => {
    acordo.parcelas?.forEach((parcela) => {
      if (!parcela.dataVencimento) return;
      try {
        if (getYear(parseISO(parcela.dataVencimento)) === year) {
          parcelasDoAno.push({ parcela, acordo });
        }
      } catch {
        /* noop */
      }
    });
  });

  const total = parcelasDoAno.length;
  const efetivadas = parcelasDoAno.filter(
    (p) => p.parcela.status === 'paga' || p.parcela.status === 'recebida',
  ).length;
  const taxa = total > 0 ? Math.round((efetivadas / total) * 100) : 0;

  // Mês mais intenso
  const monthCounts = new Array(12).fill(0);
  parcelasDoAno.forEach((p) => {
    try {
      monthCounts[getMonth(parseISO(p.parcela.dataVencimento))]++;
    } catch {
      /* noop */
    }
  });
  const maxMonth = monthCounts.indexOf(Math.max(...monthCounts));
  const maxMonthCount = monthCounts[maxMonth] || 0;

  // Média semanal (52 semanas)
  const weekAvg = total > 0 ? (total / 52).toFixed(1) : '0';

  // Valor total no ano (parcelas pendentes)
  const valorTotal = parcelasDoAno
    .filter((p) => p.parcela.status === 'pendente' || p.parcela.status === 'atrasada')
    .reduce((acc, p) => acc + Number(p.parcela.valorBrutoCreditoPrincipal ?? 0), 0);

  // Próxima parcela pendente
  const now = new Date();
  const futuras = parcelasDoAno
    .filter(
      (p) =>
        p.parcela.status === 'pendente' &&
        parseISO(p.parcela.dataVencimento) >= now,
    )
    .sort(
      (a, b) =>
        parseISO(a.parcela.dataVencimento).getTime() -
        parseISO(b.parcela.dataVencimento).getTime(),
    );
  const proxima = futuras[0] || null;

  return { total, efetivadas, taxa, maxMonth, maxMonthCount, weekAvg, valorTotal, proxima };
}

// =============================================================================
// MONTH GRID
// =============================================================================

const MonthGrid = React.memo(function MonthGrid({
  monthIndex,
  year,
  dayMap,
  onDayClick,
}: {
  monthIndex: number;
  year: number;
  dayMap: Map<string, ParcelaDisplay[]>;
  onDayClick: (month: number, day: number) => void;
}) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDow = new Date(year, monthIndex, 1).getDay();

  const cells: React.ReactNode[] = [];

  for (let i = 0; i < firstDow; i++) {
    cells.push(<div key={`e-${i}`} className="aspect-square" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${monthIndex}-${d}`;
    const items = dayMap.get(key) || [];
    const count = items.length;
    const today = checkIsToday(new Date(year, monthIndex, d));
    const dateLabel = format(new Date(year, monthIndex, d), "dd 'de' MMM", { locale: ptBR });
    const tooltipText = count
      ? `${dateLabel} · ${count} parcela${count > 1 ? 's' : ''}`
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
          <TooltipContent side="top" className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ "text-micro-caption px-2 py-1")}>
            {tooltipText}
          </TooltipContent>
        </button>
      </TooltipTrigger>,
    );
  }

  return (
    <div>
      <div className="text-overline text-muted-foreground/70 mb-1.5">
        {MONTH_NAMES[monthIndex]}
      </div>
      <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "grid grid-cols-7 gap-0.5 mb-1")}>
        {WEEKDAY_LABELS.map((lbl, i) => (
          <div key={i} className="text-micro-caption text-muted-foreground/50 text-center">
            {lbl}
          </div>
        ))}
      </div>
      <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "grid grid-cols-7 gap-0.5")}>{cells}</div>
    </div>
  );
});

// =============================================================================
// STAT CARD
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
    <div className={cn(/* design-system-escape: px-5 padding direcional sem Inset equiv. */ "rounded-2xl border border-border/40 bg-muted/30 inset-card-compact px-5")}>
      <div className={cn("flex items-center inline-tight mb-3")}>
        <IconContainer size="md" className={iconBg}>
          <Icon className={cn('w-3.5 h-3.5', iconColor)} />
        </IconContainer>
        <span className="text-meta-label">{label}</span>
      </div>
      {children}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ObrigacoesYearHeatmap({
  acordos,
  currentDate,
  onDateChange,
  onDayClick,
}: ObrigacoesYearHeatmapProps) {
  const year = getYear(currentDate);
  const dayMap = React.useMemo(() => buildDayMap(acordos, year), [acordos, year]);
  const stats = React.useMemo(() => computeStats(acordos, year), [acordos, year]);

  const handleDayClick = React.useCallback(
    (month: number, day: number) => {
      const key = `${month}-${day}`;
      const items = dayMap.get(key) || [];
      if (items.length > 0) {
        onDayClick?.(items, new Date(year, month, day));
      }
    },
    [dayMap, year, onDayClick],
  );

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn(/* design-system-escape: sm:p-6 sem equivalente DS */ "flex h-full flex-col overflow-y-auto inset-card-compact sm:p-6")}>
        {/* Year Navigator */}
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center justify-between mb-6 flex-wrap gap-3")}>
          <div className={cn("flex items-center inline-tight")}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 border border-border/40 bg-muted/60 backdrop-blur-sm hover:bg-muted/70"
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
              className="h-9 w-9 border border-border/40 bg-muted/60 backdrop-blur-sm hover:bg-muted/70"
              onClick={() => onDateChange(new Date(year + 1, 0, 1))}
              aria-label="Próximo ano"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv. */ "ml-2 rounded-full px-4")}
              onClick={() => onDateChange(new Date())}
            >
              Hoje
            </Button>
          </div>
        </div>

        {/* Main Layout: Heatmap + Stats Sidebar */}
        <div className={cn(/* design-system-escape: gap-5 gap sem token DS */ "flex gap-5 flex-wrap xl:flex-nowrap")}>
          <GlassPanel depth={1} className={cn("inset-dialog flex-1 min-w-0")}>
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
            <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "mt-8 flex items-center gap-3")}>
              <span className="text-micro-caption">Menos</span>
              <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1")}>
                <div className="w-2.5 h-2.5 rounded-[2px] bg-muted/50" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/30" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/55" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/85" />
              </div>
              <span className="text-micro-caption">Mais</span>
              <span className={cn(/* design-system-escape: mx-2 margin sem primitiva DS */ "text-muted-foreground/40 mx-2 text-micro-caption")}>·</span>
              <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
                <div className="w-2.5 h-2.5 rounded-[2px] bg-muted/50 ring-[1.5px] ring-primary ring-offset-1 ring-offset-transparent" />
                <span className="text-micro-caption">Hoje</span>
              </div>
            </div>
          </GlassPanel>

          {/* Stats Sidebar */}
          <div className={cn("flex flex-col inline-default w-full xl:w-64 shrink-0")}>
            <StatCard icon={CalendarDays} iconBg="bg-primary/15" iconColor="text-primary" label="Parcelas no Ano">
              <div className="text-kpi-value">{stats.total}</div>
            </StatCard>

            <StatCard icon={Wallet} iconBg="bg-info/12" iconColor="text-info" label="Valor Pendente">
              <div className="text-kpi-value">{CURRENCY.format(stats.valorTotal)}</div>
              <div className="text-widget-sub mt-1">a vencer neste ano</div>
            </StatCard>

            <StatCard icon={Flame} iconBg="bg-warning/12" iconColor="text-warning" label="Mês Mais Intenso">
              <div className="text-card-title">{MONTH_NAMES[stats.maxMonth]}</div>
              <div className="text-widget-sub mt-0.5">
                {stats.maxMonthCount} parcela{stats.maxMonthCount !== 1 ? 's' : ''}
              </div>
              <div className="mt-3 h-1 rounded-full bg-muted/60">
                <div
                  className="h-1 rounded-full bg-warning/70"
                  style={{
                    width: `${stats.total > 0 ? Math.round((stats.maxMonthCount / stats.total) * 100) : 0}%`,
                  }}
                />
              </div>
            </StatCard>

            <StatCard icon={BarChart2} iconBg="bg-success/12" iconColor="text-success" label="Média Semanal">
              <div className="text-kpi-value">{stats.weekAvg}</div>
              <div className="text-widget-sub mt-1">parcelas / semana</div>
            </StatCard>

            <StatCard icon={CheckCircle2} iconBg="bg-primary/15" iconColor="text-primary" label="Taxa de Efetivação">
              <div className="text-kpi-value">
                {stats.taxa}
                <span className="text-subsection-title text-muted-foreground">%</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-muted/60">
                <div
                  className="h-1.5 rounded-full bg-linear-to-r from-primary to-primary/80"
                  style={{ width: `${stats.taxa}%` }}
                />
              </div>
              <div className="text-widget-sub mt-1.5">
                {stats.efetivadas} de {stats.total} efetivadas
              </div>
            </StatCard>

            {stats.proxima && (
              <StatCard icon={Clock} iconBg="bg-info/12" iconColor="text-info" label="Próxima">
                <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-label font-semibold")}>
                  {format(parseISO(stats.proxima.parcela.dataVencimento), "dd MMM", { locale: ptBR })}
                </div>
                <div className="text-mono-num mt-0.5">
                  {CURRENCY.format(stats.proxima.parcela.valorBrutoCreditoPrincipal)}
                </div>
                {stats.proxima.acordo.processo?.numero_processo && (
                  <div className="text-widget-sub mt-1.5 truncate">
                    {stats.proxima.acordo.processo.numero_processo}
                  </div>
                )}
              </StatCard>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
