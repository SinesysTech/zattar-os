'use client';

/**
 * PericiasClient — Orquestrador unificado do módulo Perícias (Glass Briefing).
 * ============================================================================
 * Owns all toolbar state (search, filters, dateRange) — wrappers são thin
 * views que apenas renderizam o conteúdo específico da visualização com
 * paginação/densidade/seleção interna. Padrão single-shell estilo contratos.
 *
 *   Header → PulseStrip (real) → InsightBanners →
 *   [FilterBar | Search | ViewToggle+Settings] →
 *   [WeekNav | FilterChips (condicional)] →
 *   Wrapper por view (list/table/month/year) → Dialog único.
 * ============================================================================
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { format } from 'date-fns';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  List,
  Plus,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';

import { InsightBanner } from '@/app/(authenticated)/dashboard/widgets/primitives';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heading } from '@/components/ui/typography';
import { AppBadge } from '@/components/ui/app-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchInput } from '@/components/dashboard/search-input';
import { useWeekNavigator } from '@/components/shared';
import { cn } from '@/lib/utils';

import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useEspecialidadesPericias } from '../hooks/use-especialidades-pericias';
import { usePeritos } from '../hooks/use-peritos';
import {
  actionPericiasPulseStats,
  type PericiasPulseStats,
} from '../actions';
import {
  SITUACAO_PERICIA_LABELS,
  SituacaoPericiaCodigo,
  type GrauTribunal,
} from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '@/app/(authenticated)/expedientes';

import { PericiasPulseStrip } from './pericias-pulse-strip';
import { PericiasPipelineStepper } from './pericias-pipeline-stepper';
import { PericiasMissaoContent } from './pericias-missao-content';
import { PericiasListWrapper } from './pericias-list-wrapper';
import { PericiasMonthWrapper } from './pericias-month-wrapper';
import { PericiasYearWrapper } from './pericias-year-wrapper';
import { PericiasSemanaWrapper } from './pericias-semana-wrapper';
import { PericiaCriarDialog } from './pericia-criar-dialog';
import {
  PericiasFilterBar,
  DateRangePill,
  type SituacaoFilterType,
  type ResponsavelFilterType,
  type LaudoFilterType,
} from './pericias-filter-bar';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export type PericiasViewMode = 'quadro' | 'semana' | 'mes' | 'ano' | 'lista';

const VIEW_ROUTES: Record<PericiasViewMode, string> = {
  quadro: '/pericias/quadro',
  semana: '/pericias/semana',
  mes: '/pericias/mes',
  ano: '/pericias/ano',
  lista: '/pericias/lista',
};

const ROUTE_TO_VIEW: Record<string, PericiasViewMode> = {
  '/pericias': 'quadro',
  '/pericias/quadro': 'quadro',
  '/pericias/semana': 'semana',
  '/pericias/mes': 'mes',
  '/pericias/ano': 'ano',
  '/pericias/lista': 'lista',
};

interface ViewOption {
  id: PericiasViewMode;
  icon: typeof Sparkles;
  label: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  { id: 'quadro', icon: Sparkles, label: 'Missão' },
  { id: 'semana', icon: CalendarDays, label: 'Semana' },
  { id: 'mes', icon: CalendarRange, label: 'Mês' },
  { id: 'ano', icon: Calendar, label: 'Ano' },
  { id: 'lista', icon: List, label: 'Lista' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export interface PericiasClientProps {
  initialView?: PericiasViewMode;
}

export function PericiasClient({ initialView = 'quadro' }: PericiasClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  // ── View state (sync com URL) ─────────────────────────────────────────
  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;
  const [viewMode, setViewMode] = useState<PericiasViewMode>(viewFromUrl);

  useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView && newView !== viewMode) setViewMode(newView);
  }, [pathname, viewMode]);

  const handleViewChange = useCallback(
    (target: PericiasViewMode) => {
      const route = VIEW_ROUTES[target];
      if (route && route !== pathname) router.push(route);
      setViewMode(target);
    },
    [pathname, router],
  );

  // ── Toolbar state (compartilhado por todos os wrappers) ─────────────
  const [search, setSearch] = useState('');
  const [situacaoFilter, setSituacaoFilter] =
    useState<SituacaoFilterType>('todos');
  const [responsavelFilter, setResponsavelFilter] =
    useState<ResponsavelFilterType>('todos');
  const [laudoFilter, setLaudoFilter] = useState<LaudoFilterType>('todos');
  const [tribunalFilter, setTribunalFilter] = useState('');
  const [grauFilter, setGrauFilter] = useState('');
  const [especialidadeFilter, setEspecialidadeFilter] = useState('');
  const [peritoFilter, setPeritoFilter] = useState('');
  const [dateRange, setDateRange] = useState<
    { from?: Date; to?: Date } | undefined
  >(undefined);

  // ── Navegação temporal específica de ano/semana ─────────────────────
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const weekNav = useWeekNavigator();

  // ── Dialog state (single instance para todas as views) ─────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  const handleCreateSuccess = useCallback(() => {
    setRefetchKey((k) => k + 1);
    setIsCreateOpen(false);
  }, []);

  // ── Pulse stats (dados reais via server action) ───────────────────────
  const [stats, setStats] = useState<PericiasPulseStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await actionPericiasPulseStats();
        if (!cancelled && result.success) setStats(result.data);
      } finally {
        if (!cancelled) setIsStatsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refetchKey]);

  // ── Auxiliary data (pré-carregado e passado aos wrappers) ─────────────
  const { usuarios } = useUsuarios();
  const { especialidades } = useEspecialidadesPericias();
  const { peritos } = usePeritos();

  // ── Subtitle ──────────────────────────────────────────────────────────
  const subtitle =
    isStatsLoading || !stats
      ? 'Carregando...'
      : `${stats.ativas} ativa${stats.ativas !== 1 ? 's' : ''} · ${stats.finalizadas} finalizada${stats.finalizadas !== 1 ? 's' : ''}`;

  // ── Clear all filters ────────────────────────────────────────────────
  const handleClearAllFilters = useCallback(() => {
    setSituacaoFilter('todos');
    setResponsavelFilter('todos');
    setLaudoFilter('todos');
    setDateRange(undefined);
    setTribunalFilter('');
    setGrauFilter('');
    setEspecialidadeFilter('');
    setPeritoFilter('');
    setSearch('');
  }, []);

  // ── Active filter chips ──────────────────────────────────────────────
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (situacaoFilter !== 'todos') {
      chips.push({
        key: 'situacao',
        label: SITUACAO_PERICIA_LABELS[situacaoFilter],
        onRemove: () => setSituacaoFilter('todos'),
      });
    }

    if (responsavelFilter === 'sem_responsavel') {
      chips.push({
        key: 'responsavel',
        label: 'Sem responsável',
        onRemove: () => setResponsavelFilter('todos'),
      });
    } else if (typeof responsavelFilter === 'number') {
      const usuario = usuarios.find((u) => u.id === responsavelFilter);
      chips.push({
        key: 'responsavel',
        label: usuario
          ? usuario.nomeExibicao ||
            usuario.nomeCompleto ||
            `Usuário ${usuario.id}`
          : `Responsável #${responsavelFilter}`,
        onRemove: () => setResponsavelFilter('todos'),
      });
    }

    if (laudoFilter !== 'todos') {
      chips.push({
        key: 'laudo',
        label: laudoFilter === 'sim' ? 'Laudo juntado' : 'Sem laudo',
        onRemove: () => setLaudoFilter('todos'),
      });
    }

    if (dateRange?.from || dateRange?.to) {
      const fromStr = dateRange.from ? format(dateRange.from, 'dd/MM') : '';
      const toStr = dateRange.to ? format(dateRange.to, 'dd/MM') : '';
      chips.push({
        key: 'dateRange',
        label: `${fromStr} - ${toStr}`,
        onRemove: () => setDateRange(undefined),
      });
    }

    if (tribunalFilter) {
      chips.push({
        key: 'tribunal',
        label: tribunalFilter,
        onRemove: () => setTribunalFilter(''),
      });
    }

    if (grauFilter) {
      chips.push({
        key: 'grau',
        label:
          GRAU_TRIBUNAL_LABELS[grauFilter as GrauTribunal] || grauFilter,
        onRemove: () => setGrauFilter(''),
      });
    }

    if (especialidadeFilter) {
      const esp = especialidades.find(
        (e) => e.id === parseInt(especialidadeFilter, 10),
      );
      chips.push({
        key: 'especialidade',
        label: esp ? esp.descricao : `Especialidade #${especialidadeFilter}`,
        onRemove: () => setEspecialidadeFilter(''),
      });
    }

    if (peritoFilter) {
      const p = peritos.find((x) => x.id === parseInt(peritoFilter, 10));
      chips.push({
        key: 'perito',
        label: p ? p.nome : `Perito #${peritoFilter}`,
        onRemove: () => setPeritoFilter(''),
      });
    }

    return chips;
  }, [
    situacaoFilter,
    responsavelFilter,
    laudoFilter,
    dateRange,
    tribunalFilter,
    grauFilter,
    especialidadeFilter,
    peritoFilter,
    usuarios,
    especialidades,
    peritos,
  ]);

  // ── Props comuns a todos os wrappers ─────────────────────────────────
  const commonFilterProps = {
    busca: search,
    situacaoFilter,
    responsavelFilter,
    laudoFilter,
    tribunalFilter,
    grauFilter,
    especialidadeFilter,
    peritoFilter,
    usuarios,
    especialidades,
    peritos,
    refetchKey,
  };

  // ── Render ────────────────────────────────────────────────────────────
  const showDateRangePicker = viewMode === 'lista';
  const hideFilterBarAdvanced = viewMode === 'semana';

  return (
    <div className={cn(/* design-system-escape: space-y-5 sem token DS */ "space-y-5")}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-end justify-between gap-4")}>
        <div>
          <Heading level="page">Perícias</Heading>
          <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground/70 mt-0.5")}>{subtitle}</p>
        </div>
        <Button
          size="sm"
          className="rounded-xl"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="size-3.5" />
          Nova Perícia
        </Button>
      </div>

      {/* ── Pulse Strip (KPIs reais) ────────────────────────── */}
      {isStatsLoading ? (
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 lg:grid-cols-4 gap-3")}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <PericiasPulseStrip stats={stats} />
      ) : null}

      {/* ── Insight Banners ─────────────────────────────────── */}
      <div role="status" aria-live="polite" className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2 empty:hidden")}>
        {!isStatsLoading && stats && stats.prazosCriticos7d > 0 && (
          <InsightBanner type="warning">
            {stats.prazosCriticos7d} perícia
            {stats.prazosCriticos7d !== 1 ? 's' : ''} com prazo vencendo nos
            próximos 7 dias
          </InsightBanner>
        )}
        {!isStatsLoading && stats && stats.semResponsavel > 0 && (
          <InsightBanner type="info">
            {stats.semResponsavel} perícia
            {stats.semResponsavel !== 1 ? 's' : ''} sem responsável atribuído
          </InsightBanner>
        )}
      </div>

      {/* ── Pipeline Stepper (universal, acima da toolbar) ─── */}
      {stats && (
        <PericiasPipelineStepper
          porSituacao={stats.porSituacao}
          activeSituacao={
            situacaoFilter !== 'todos'
              ? (situacaoFilter as SituacaoPericiaCodigo)
              : null
          }
          onSituacaoClick={(s) =>
            setSituacaoFilter((prev) => (prev === s ? 'todos' : s))
          }
        />
      )}

      {/* ── Toolbar universal: Filters | Search | ViewToggle+Settings ── */}
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-wrap")}>
        <PericiasFilterBar
          situacaoFilter={situacaoFilter}
          onSituacaoChange={setSituacaoFilter}
          responsavelFilter={responsavelFilter}
          onResponsavelChange={setResponsavelFilter}
          laudoFilter={laudoFilter}
          onLaudoChange={setLaudoFilter}
          tribunalFilter={tribunalFilter}
          onTribunalChange={setTribunalFilter}
          grauFilter={grauFilter}
          onGrauChange={setGrauFilter}
          especialidadeFilter={especialidadeFilter}
          onEspecialidadeChange={setEspecialidadeFilter}
          peritoFilter={peritoFilter}
          onPeritoChange={setPeritoFilter}
          usuarios={usuarios}
          especialidades={especialidades}
          peritos={peritos}
          hideAdvancedFilters={hideFilterBarAdvanced}
        />

        {showDateRangePicker && (
          <DateRangePill value={dateRange} onChange={setDateRange} />
        )}

        <div className="flex-1" />

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar processo, perito..."
        />

        <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS; p-0.5 → usar <Inset> */ "flex items-center gap-0.5 p-0.5 rounded-lg bg-border/6")}>
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleViewChange(opt.id)}
              aria-label={opt.label}
              className={cn(
                /* design-system-escape: p-1.5 → usar <Inset> */ 'p-1.5 rounded-md transition-all cursor-pointer',
                viewMode === opt.id
                  ? 'bg-primary/12 text-primary'
                  : 'text-muted-foreground/55 hover:text-muted-foreground',
              )}
            >
              <opt.icon className="size-3.5" />
            </button>
          ))}
          <span
            className={cn(/* design-system-escape: mx-0.5 margin sem primitiva DS */ "mx-0.5 h-4 w-px bg-border/40")}
            aria-hidden="true"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Configurações de perícias"
                className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "p-1.5 rounded-md text-muted-foreground/55 hover:text-muted-foreground transition-all cursor-pointer")}
              >
                <SlidersHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "glass-dropdown rounded-2xl p-1.5 min-w-44 border-border/40")}
            >
              <DropdownMenuItem
                asChild
                className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "rounded-lg text-xs px-3 py-2 cursor-pointer")}
              >
                <Link href="/pericias/especialidades">Especialidades</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "rounded-lg text-xs px-3 py-2 cursor-pointer")}
              >
                <Link href="/pericias/peritos">Peritos</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Active Filter Chips ─────────────────────────────── */}
      {activeFilterChips.length > 0 && (
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-wrap items-center gap-2")}>
          <span className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[11px] uppercase tracking-wider text-muted-foreground/60")}>
            Filtros:
          </span>
          {activeFilterChips.map((chip) => (
            <AppBadge
              key={chip.key}
              variant="secondary"
              className={cn(/* design-system-escape: gap-1 gap sem token DS; pr-1 padding direcional sem Inset equiv. */ "gap-1 pr-1 cursor-pointer hover:bg-secondary/80")}
              onClick={() => chip.onRemove()}
            >
              {chip.label}
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-sm hover:bg-background/40"
                onClick={(e) => {
                  e.stopPropagation();
                  chip.onRemove();
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </AppBadge>
          ))}
          {activeFilterChips.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption"> */ "h-6 px-2 text-xs")}
              onClick={handleClearAllFilters}
            >
              Limpar todos
            </Button>
          )}
        </div>
      )}

      {/* ── Content por view ────────────────────────────────── */}
      {viewMode === 'quadro' && (
        <PericiasMissaoContent {...commonFilterProps} />
      )}
      {viewMode === 'lista' && (
        <PericiasListWrapper
          {...commonFilterProps}
          dateRange={dateRange}
        />
      )}
      {viewMode === 'semana' && (
        <PericiasSemanaWrapper
          {...commonFilterProps}
          weekDate={weekNav.selectedDate}
          onWeekDateChange={weekNav.setSelectedDate}
        />
      )}
      {viewMode === 'mes' && <PericiasMonthWrapper {...commonFilterProps} />}
      {viewMode === 'ano' && (
        <PericiasYearWrapper
          {...commonFilterProps}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
      )}

      {/* ── Single Create Dialog ───────────────────────────── */}
      <PericiaCriarDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        usuarios={usuarios}
        especialidades={especialidades}
        peritos={peritos}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
