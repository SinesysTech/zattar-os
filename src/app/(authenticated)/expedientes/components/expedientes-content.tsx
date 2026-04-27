'use client';

import { cn } from '@/lib/utils';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  CalendarDays,
  CalendarRange,
  Calendar,
  List,
  Sparkles,
  Plus,
} from 'lucide-react';
import { InsightBanner } from '@/app/(authenticated)/dashboard/widgets/primitives';
import { SearchInput } from '@/components/dashboard/search-input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared';
import { type ViewType } from '@/components/shared';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { FileSearch } from 'lucide-react';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';
import { useExpedientes } from '../hooks/use-expedientes';
import { actionContarExpedientesPorStatus } from '../actions';
import type { Expediente } from '../domain';
import { getExpedientePartyNames } from '../domain';
import { ExpedientesPulseStrip } from './expedientes-pulse-strip';
import { ExpedientesUltimaCapturaCard } from './expedientes-ultima-captura-card';
import {
  ExpedientesFilterBar,
  type ExpedientesFilterBarFilters,
  type ExpedientesStatus,
} from './expedientes-filter-bar';
import type { ResumoUltimaCaptura } from '../domain';
import { actionObterResumoUltimaCaptura } from '../actions';
import { Heading, Text } from '@/components/ui/typography';

// ─── Lazy-loaded views e dialogs ──────────────────────────────────────────────
// As 5 views de expedientes são exclusivas entre si (só uma renderiza por vez),
// então carregar só a ativa reduz o bundle inicial. Os 3 dialogs são
// renderizados condicionalmente e lazy-loaded para não entrarem no first paint.

const ViewSkeleton = () => (
  <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")} aria-busy="true" aria-label="Carregando visualização">
    {Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-20 rounded-2xl" />
    ))}
  </div>
);

const ExpedientesControlView = dynamic(
  () => import('./expedientes-control-view').then((m) => ({ default: m.ExpedientesControlView })),
  { loading: ViewSkeleton, ssr: false }
);
const ExpedientesListWrapper = dynamic(
  () => import('./expedientes-list-wrapper').then((m) => ({ default: m.ExpedientesListWrapper })),
  { loading: ViewSkeleton, ssr: false }
);
const ExpedientesSemanaView = dynamic(
  () => import('./expedientes-semana-view').then((m) => ({ default: m.ExpedientesSemanaView })),
  { loading: ViewSkeleton, ssr: false }
);
const ExpedientesMonthWrapper = dynamic(
  () => import('./expedientes-month-wrapper').then((m) => ({ default: m.ExpedientesMonthWrapper })),
  { loading: ViewSkeleton, ssr: false }
);
const ExpedientesYearWrapper = dynamic(
  () => import('./expedientes-year-wrapper').then((m) => ({ default: m.ExpedientesYearWrapper })),
  { loading: ViewSkeleton, ssr: false }
);

const ExpedienteDialog = dynamic(
  () => import('./expediente-dialog').then((m) => ({ default: m.ExpedienteDialog })),
  { ssr: false }
);
const ExpedienteVisualizarDialog = dynamic(
  () => import('./expediente-visualizar-dialog').then((m) => ({ default: m.ExpedienteVisualizarDialog })),
  { ssr: false }
);
const ExpedientesBaixarDialog = dynamic(
  () => import('./expedientes-baixar-dialog').then((m) => ({ default: m.ExpedientesBaixarDialog })),
  { ssr: false }
);

// ─── Route constants ──────────────────────────────────────────────────────────

const APP_BASE_ROUTE = '/app/expedientes';

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/app/expedientes': 'quadro',
  '/app/expedientes/semana': 'semana',
  '/app/expedientes/mes': 'mes',
  '/app/expedientes/ano': 'ano',
  '/app/expedientes/lista': 'lista',
  '/app/expedientes/quadro': 'quadro',
};

const VIEW_ROUTES: Record<ViewType, string> = {
  semana: `${APP_BASE_ROUTE}/semana`,
  mes: `${APP_BASE_ROUTE}/mes`,
  ano: `${APP_BASE_ROUTE}/ano`,
  lista: `${APP_BASE_ROUTE}/lista`,
  quadro: `${APP_BASE_ROUTE}/quadro`,
};

// ─── View mode options ────────────────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'quadro', label: 'Quadro', icon: Sparkles },
  { id: 'semana', label: 'Semana', icon: CalendarDays },
  { id: 'mes', label: 'Mês', icon: CalendarRange },
  { id: 'ano', label: 'Ano', icon: Calendar },
  { id: 'lista', label: 'Lista', icon: List },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizarData(dataISO: string | null | undefined): Date | null {
  if (!dataISO) return null;
  const data = new Date(dataISO);
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function calcularDiasRestantes(expediente: Expediente): number | null {
  const prazo = normalizarData(expediente.dataPrazoLegalParte);
  if (!prazo) return null;
  const hoje = new Date();
  const hojeZerado = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((prazo.getTime() - hojeZerado.getTime()) / 86400000);
}

// ─── URL sync helpers ─────────────────────────────────────────────────────────

const STATUS_VALIDOS: ReadonlyArray<ExpedientesStatus> = ['pendentes', 'baixados', 'todos'];

function parseStatusFromUrl(raw: string | null): ExpedientesStatus {
  if (raw && (STATUS_VALIDOS as ReadonlyArray<string>).includes(raw)) {
    return raw as ExpedientesStatus;
  }
  return 'pendentes';
}

function filtersFromSearchParams(
  params: URLSearchParams
): ExpedientesFilterBarFilters {
  const capturaIdRaw = params.get('capturaId');
  return {
    status: parseStatusFromUrl(params.get('status')),
    trt: params.get('trt'),
    grau: params.get('grau'),
    origem: params.get('origem'),
    responsavel: params.get('responsavel'),
    tipo: params.get('tipo'),
    capturaId: capturaIdRaw ? Number(capturaIdRaw) : undefined,
  };
}

function filtersToSearchString(
  filters: ExpedientesFilterBarFilters,
  search: string
): string {
  const params = new URLSearchParams();
  if (search.trim()) params.set('q', search.trim());
  if (filters.status !== 'pendentes') params.set('status', filters.status);
  if (filters.trt) params.set('trt', filters.trt);
  if (filters.grau) params.set('grau', filters.grau);
  if (filters.origem) params.set('origem', filters.origem);
  if (filters.responsavel) params.set('responsavel', filters.responsavel);
  if (filters.tipo) params.set('tipo', filters.tipo);
  if (filters.capturaId) params.set('capturaId', String(filters.capturaId));
  return params.toString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExpedientesContent({ visualizacao: initialView = 'quadro' }: { visualizacao?: ViewType }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;
  const [viewMode, setViewMode] = useState<ViewType>(viewFromUrl);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filtros e busca hidratados da URL no primeiro render, para deep-link e
  // preservação entre trocas de view.
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [filters, setFilters] = useState<ExpedientesFilterBarFilters>(() =>
    filtersFromSearchParams(new URLSearchParams(searchParams.toString()))
  );

  // Detail/baixa dialog state
  const [selectedExpediente, setSelectedExpediente] = useState<Expediente | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [baixarExpediente, setBaixarExpediente] = useState<Expediente | null>(null);

  // Última captura
  const [ultimaCaptura, setUltimaCaptura] = useState<ResumoUltimaCaptura | null>(null);
  const [ultimaCapturaLoading, setUltimaCapturaLoading] = useState(true);

  // Sync view mode with URL
  useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView) setViewMode(newView);
  }, [pathname]);

  // Sync filters + search → URL (debounced para não floodar history com cada keystroke)
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextQuery = filtersToSearchString(filters, search);
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) return;
      const target = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      // replace (não push) — filtros não geram entradas de histórico; trocar
      // view ainda usa push (handleViewChange abaixo).
      router.replace(target, { scroll: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [filters, search, pathname, router, searchParams]);

  // Data fetching
  const { usuarios } = useUsuarios();
  const { tiposExpedientes } = useTiposExpedientes({ limite: 100 });
  const [semanaDate, setSemanaDate] = useState(new Date());

  const baixadoFiltroAtivo = useMemo(() => {
    if (filters.status === 'pendentes') return false;
    if (filters.status === 'baixados') return true;
    return undefined;
  }, [filters.status]);

  // Busca os expedientes da aba ativa para garantir que a view renderize
  // exatamente o subconjunto esperado, sem depender de uma amostra parcial.
  const {
    expedientes: expedientesDaAba,
    paginacao: _paginacao,
    isLoading,
    refetch,
  } = useExpedientes({
    pagina: 1,
    limite: 1000,
    baixado: baixadoFiltroAtivo,
    incluirSemPrazo: true,
  });

  // Contadores globais carregados em uma única request server (2 COUNT em
  // paralelo dentro da action). Antes: 2 calls useExpedientes({ limite: 1 }) —
  // agora: 1 request, metade do round-trip overhead cliente ↔ server.
  const [statusCounts, setStatusCounts] = useState<{ pendentes: number; baixados: number }>(
    { pendentes: 0, baixados: 0 }
  );

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const result = await actionContarExpedientesPorStatus();
      if (!cancelado && result.success && result.data) {
        setStatusCounts(result.data as { pendentes: number; baixados: number });
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [refreshCounter]);

  useEffect(() => {
    let cancelado = false;
    setUltimaCapturaLoading(true);
    (async () => {
      const result = await actionObterResumoUltimaCaptura();
      if (!cancelado) {
        setUltimaCaptura(result.success && result.data ? result.data : null);
        setUltimaCapturaLoading(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [refreshCounter]);

  const globalCounts = useMemo(
    () => ({
      todos: statusCounts.pendentes + statusCounts.baixados,
      pendentes: statusCounts.pendentes,
      baixados: statusCounts.baixados,
    }),
    [statusCounts]
  );

  const rotuloExpedientes = useMemo(() => expedientesDaAba, [expedientesDaAba]);

  // ─── Derived metrics ────────────────────────────────────────────────────────

  const pendentes = useMemo(
    () => rotuloExpedientes.filter((e) => !e.baixadoEm),
    [rotuloExpedientes],
  );

  const vencidos = useMemo(
    () => pendentes.filter((e) => {
      if (e.prazoVencido) return true;
      const dias = calcularDiasRestantes(e);
      return dias !== null && dias < 0;
    }),
    [pendentes],
  );

  const hoje = useMemo(
    () => pendentes.filter((e) => calcularDiasRestantes(e) === 0),
    [pendentes],
  );

  const proximos = useMemo(
    () => pendentes.filter((e) => {
      const dias = calcularDiasRestantes(e);
      return dias !== null && dias > 0 && dias <= 3;
    }),
    [pendentes],
  );

  const semResponsavel = useMemo(
    () => pendentes.filter((e) => !e.responsavelId),
    [pendentes],
  );

  // ─── Tab filtering ───────────────────────────────────────────────────────────

  const tabSource = useMemo(() => rotuloExpedientes, [rotuloExpedientes]);

  const filteredExpedientes = useMemo(() => {
    if (!search.trim()) return tabSource;
    const q = search.toLowerCase();
    return tabSource.filter(
      (e) => {
        const partes = getExpedientePartyNames(e);
        return e.numeroProcesso.toLowerCase().includes(q) ||
        (partes.autora?.toLowerCase().includes(q) ?? false) ||
        (partes.re?.toLowerCase().includes(q) ?? false) ||
        (e.classeJudicial?.toLowerCase().includes(q) ?? false);
      }
    );
  }, [tabSource, search]);

  // ─── Navigation ──────────────────────────────────────────────────────────────

  const handleViewChange = useCallback((view: string) => {
    // Preserva filtros e busca ao trocar de view, garantindo continuidade
    // da seleção do usuário entre quadro/semana/mês/ano/lista.
    const target = VIEW_ROUTES[view as ViewType];
    const query = filtersToSearchString(filters, search);
    router.push(query ? `${target}?${query}` : target);
  }, [router, filters, search]);

  // ─── Dynamic subtitle ─────────────────────────────────────────────────────────

  const subtitle = useMemo(() => {
    if (isLoading) return 'Carregando...';
    const p = pendentes.length;
    const v = vencidos.length;
    const pendLabel = `${p} pendente${p !== 1 ? 's' : ''}`;
    const vencLabel = `${v} vencido${v !== 1 ? 's' : ''}`;
    return `${pendLabel} · ${vencLabel}`;
  }, [isLoading, pendentes.length, vencidos.length]);

  // ─── Insight banners ─────────────────────────────────────────────────────────

  const showVencidosBanner = vencidos.length > 0 && filters.status !== 'baixados';
  const showSemResponsavelBanner = semResponsavel.length > 3 && !showVencidosBanner && filters.status !== 'baixados';

  // ─── Filtros ativos (para empty state contextual) ───────────────────────────

  const temFiltroAtivo = useMemo(
    () =>
      filters.status !== 'pendentes' ||
      filters.trt !== null ||
      filters.grau !== null ||
      filters.origem !== null ||
      filters.responsavel !== null ||
      filters.tipo !== null,
    [filters]
  );

  const limparFiltros = useCallback(() => {
    setFilters({
      status: 'pendentes',
      trt: null,
      grau: null,
      origem: null,
      responsavel: null,
      tipo: null,
    });
  }, []);

  // ─── Detail/action handlers ──────────────────────────────────────────────────

  const handleViewDetail = useCallback((expediente: Expediente) => {
    setSelectedExpediente(expediente);
    setIsDetailOpen(true);
  }, []);

  const handleBaixar = useCallback((expediente: Expediente) => {
    setBaixarExpediente(expediente);
  }, []);

  const handleBaixaSuccess = useCallback(() => {
    setBaixarExpediente(null);
    refetch();
    setRefreshCounter((c) => c + 1);
  }, [refetch]);

  const handleUltimaCapturaClick = useCallback((capturaId: number) => {
    router.push(`${VIEW_ROUTES.lista}?capturaId=${capturaId}`);
  }, [router]);

  return (
    <div className={cn(/* design-system-escape: space-y-5 sem token DS */ "space-y-5")}>

      {/* 1. Header */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-end justify-between gap-4")}>
        <div>
          <Heading level="page">
            Expedientes
          </Heading>
          <Text variant="caption" as="p" className="mt-0.5" aria-live="polite">{subtitle}</Text>
        </div>

        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
          <Button size="sm" className="rounded-xl" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-3.5" />
            Novo Expediente
          </Button>
        </div>
      </div>

      {/* 2. KPI Strip */}
      {!isLoading && filters.status !== 'baixados' && (
        <ExpedientesPulseStrip
          vencidos={vencidos.length}
          hoje={hoje.length}
          proximos={proximos.length}
          semDono={semResponsavel.length}
          total={pendentes.length}
        />
      )}

      {/* 3. Última Captura */}
      <ExpedientesUltimaCapturaCard
        resumo={ultimaCaptura}
        isLoading={ultimaCapturaLoading}
        onClick={handleUltimaCapturaClick}
      />

      {/* 4. Insight Banners */}
      <div role="status" aria-live="polite" aria-atomic="true" className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2 empty:hidden")}>
        {!isLoading && showVencidosBanner && (
          <InsightBanner type="alert">
            {vencidos.length} expediente{vencidos.length !== 1 ? 's' : ''} com prazo vencido —
            atenção imediata necessária.
          </InsightBanner>
        )}
        {!isLoading && showSemResponsavelBanner && (
          <InsightBanner type="warning">
            {semResponsavel.length} expedientes pendentes sem responsável atribuído.
          </InsightBanner>
        )}
      </div>

      {/* 5. View Controls — sempre visível conforme Glass Briefing */}
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex flex-col sm:flex-row items-start sm:items-center gap-3")}>
        <ExpedientesFilterBar
          filters={filters}
          onChange={setFilters}
          usuarios={usuarios || []}
          tiposExpedientes={tiposExpedientes || []}
          counts={globalCounts}
        />
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-1 justify-end")}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar processo, parte..."
          />
          <ViewToggle
            mode={viewMode}
            onChange={(v) => handleViewChange(v)}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* 6. Content Switcher */}
      <main className="min-h-0 transition-opacity duration-300">
        {isLoading && (
          <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")} aria-busy="true" aria-label="Carregando expedientes">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty state — só para views que renderizam a lista filtrada (quadro/semana/mes/ano).
            `lista` tem empty state próprio dentro do DataShell/DataTable.
            3 estados distintos: busca, filtros restritivos, sem dados reais. */}
        {!isLoading &&
          viewMode !== 'lista' &&
          filteredExpedientes.length === 0 && (
            <EmptyState
              icon={FileSearch}
              title={
                search.trim()
                  ? 'Nenhum expediente corresponde à busca'
                  : temFiltroAtivo
                  ? 'Nenhum expediente corresponde aos filtros'
                  : 'Nada por aqui ainda'
              }
              description={
                search.trim()
                  ? `A busca "${search.trim()}" não retornou resultados. Tente termos mais curtos ou revise os filtros.`
                  : temFiltroAtivo
                  ? 'Os filtros aplicados estão restritivos. Limpe-os para ver todos os expedientes.'
                  : 'Crie o primeiro expediente ou troque de aba para conferir os baixados.'
              }
              action={
                search.trim() ? (
                  <Button variant="outline" onClick={() => setSearch('')}>
                    Limpar busca
                  </Button>
                ) : temFiltroAtivo ? (
                  <Button variant="outline" onClick={limparFiltros}>
                    Limpar filtros
                  </Button>
                ) : (
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="size-4" />
                    Novo Expediente
                  </Button>
                )
              }
            />
          )}

        {!isLoading && viewMode === 'quadro' && filteredExpedientes.length > 0 && (
          <ExpedientesControlView
            expedientes={filteredExpedientes}
            usuariosData={usuarios}
            tiposExpedientesData={tiposExpedientes}
            onBaixar={handleBaixar}
            onViewDetail={handleViewDetail}
            onSuccess={() => {
              refetch();
              setRefreshCounter((c) => c + 1);
            }}
          />
        )}

        {viewMode === 'lista' && (
          <ExpedientesListWrapper
            search={search}
            activeTab={filters.status}
            refreshCounter={refreshCounter}
            onViewDetail={handleViewDetail}
            onBaixar={handleBaixar}
            filters={filters}
          />
        )}

        {!isLoading && viewMode === 'semana' && filteredExpedientes.length > 0 && (
          <ExpedientesSemanaView
            expedientes={filteredExpedientes}
            currentDate={semanaDate}
            onDateChange={setSemanaDate}
            onViewDetail={handleViewDetail}
            usuariosData={usuarios}
            tiposExpedientesData={tiposExpedientes}
            onSuccess={() => {
              refetch();
              setRefreshCounter((c) => c + 1);
            }}
          />
        )}

        {!isLoading && viewMode === 'mes' && filteredExpedientes.length > 0 && (
          <ExpedientesMonthWrapper
            expedientes={filteredExpedientes}
            onViewDetail={handleViewDetail}
          />
        )}

        {!isLoading && viewMode === 'ano' && filteredExpedientes.length > 0 && (
          <ExpedientesYearWrapper
            expedientes={filteredExpedientes}
          />
        )}
      </main>

      {/* 6. Overlays — renderizados condicionalmente para que os chunks
          lazy-loaded só sejam baixados quando o dialog vai de fato abrir. */}
      {isCreateOpen && (
        <ExpedienteDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={() => {
            setIsCreateOpen(false);
            refetch();
            setRefreshCounter((c) => c + 1);
          }}
        />
      )}

      {isDetailOpen && selectedExpediente && (
        <ExpedienteVisualizarDialog
          expediente={selectedExpediente}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
        />
      )}

      {baixarExpediente && (
        <ExpedientesBaixarDialog
          expediente={baixarExpediente}
          open={!!baixarExpediente}
          onOpenChange={(open) => { if (!open) setBaixarExpediente(null); }}
          onSuccess={handleBaixaSuccess}
        />
      )}

    </div>
  );
}
