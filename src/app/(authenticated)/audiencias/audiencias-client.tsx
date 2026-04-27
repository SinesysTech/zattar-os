'use client';

/**
 * AudienciasClient — Componente unificado do módulo Audiências
 * ============================================================================
 * Segue o padrão ContratosClient: single-column Glass Briefing layout com
 * header, KPI strip, insight banners, view controls e content switcher.
 *
 * Substitui o antigo AudienciasContent + 5 wrappers separados.
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAgentContext } from '@copilotkit/react-core/v2';
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
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { Button } from '@/components/ui/button';

import {
  StatusAudiencia,
  GrauTribunal,
  ModalidadeAudiencia,
  calcPrepItems,
  calcPrepScore,
  MissionKpiStrip,
  AudienciaDetailDialog,
  NovaAudienciaDialog,
  AudienciasSemanaView,
  AudienciasMesView,
  AudienciasAnoView,
  AudienciasListaView,
  AudienciasMissaoContent,
  useAudienciasUnified,
  AudienciasFilterBar,
} from '@/app/(authenticated)/audiencias';
import { AudienciasUltimaCapturaCard } from '@/app/(authenticated)/audiencias/components/audiencias-ultima-captura-card';
import { actionObterResumoUltimaCapturaAudiencias } from '@/app/(authenticated)/audiencias/actions';
import type { ResumoUltimaCapturaAudiencias } from '@/app/(authenticated)/audiencias/domain';
import type { Audiencia, TipoAudiencia, AudienciasViewMode, CodigoTribunal } from '@/app/(authenticated)/audiencias';
import type { AudienciasFilterBarFilters } from '@/app/(authenticated)/audiencias/components';
import { Heading, Text } from '@/components/ui/typography';
import { Stack, Inline } from '@/components/ui/stack';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const VIEW_ROUTES: Record<AudienciasViewMode, string> = {
  quadro: '/audiencias/quadro',
  semana: '/audiencias/semana',
  mes: '/audiencias/mes',
  ano: '/audiencias/ano',
  lista: '/audiencias/lista',
};

const ROUTE_TO_VIEW: Record<string, AudienciasViewMode> = {
  '/audiencias': 'quadro',
  '/audiencias/quadro': 'quadro',
  '/audiencias/semana': 'semana',
  '/audiencias/mes': 'mes',
  '/audiencias/ano': 'ano',
  '/audiencias/lista': 'lista',
};

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'quadro', icon: Sparkles, label: 'Missão' },
  { id: 'semana', icon: CalendarDays, label: 'Semana' },
  { id: 'mes', icon: CalendarRange, label: 'Mês' },
  { id: 'ano', icon: Calendar, label: 'Ano' },
  { id: 'lista', icon: List, label: 'Lista' },
];

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AudienciasClientProps {
  initialView?: AudienciasViewMode;
  initialUsuarios?: { id: number; nomeExibicao?: string; nomeCompleto?: string; avatarUrl?: string | null }[];
  initialTiposAudiencia?: TipoAudiencia[];
  currentUserId?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AudienciasClient({
  initialView = 'quadro',
  initialUsuarios = [],
  initialTiposAudiencia = [],
  currentUserId = 0,
}: AudienciasClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── View State ──────────────────────────────────────────────────────────

  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;
  const [viewMode, setViewMode] = useState<AudienciasViewMode>(viewFromUrl);

  useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView && newView !== viewMode) setViewMode(newView);
  }, [pathname, viewMode]);

  const handleViewChange = useCallback((value: string) => {
    const target = value as AudienciasViewMode;
    const route = VIEW_ROUTES[target];
    if (route && route !== pathname) router.push(route);
    setViewMode(target);
  }, [pathname, router]);

  // ── Shared State ────────────────────────────────────────────────────────

  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<AudienciasFilterBarFilters>({
    status: StatusAudiencia.Marcada,
    responsavel: null,
    trt: [],
    modalidade: null,
    grau: [],
    tipoAudienciaId: [],
  });
  const [isNovaAudienciaOpen, setIsNovaAudienciaOpen] = useState(false);

  // Dialog state
  const [selectedAudiencia, setSelectedAudiencia] = useState<Audiencia | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Última captura
  const [ultimaCaptura, setUltimaCaptura] = useState<ResumoUltimaCapturaAudiencias | null>(null);
  const [ultimaCapturaLoading, setUltimaCapturaLoading] = useState(true);

  // capturaId vindo da URL (navegação a partir do card)
  const capturaIdFromUrl = useMemo(() => {
    const raw = searchParams.get('capturaId');
    return raw ? Number(raw) : undefined;
  }, [searchParams]);

  // ── Data Fetching ───────────────────────────────────────────────────────
  // Fetch sem filtro de status — filtragem client-side para manter KPIs e
  // contadores de tabs precisos independente da aba ativa.

  // ── Data Fetching ────────────────────────────────────────────────────
  // Filtros de JOIN (responsável, TRT, modalidade, grau, tipo) vão para o
  // servidor. Status fica client-side para preservar contadores das tabs.

  // Responsavel: UI usa 'meus' | 'sem_responsavel' | number | null.
  // Mapear para o contrato do repository: (number | 'null')[].
  const responsavelIdParam = useMemo<(number | 'null')[] | undefined>(() => {
    if (filters.responsavel === 'sem_responsavel') return ['null'];
    if (filters.responsavel === 'meus') {
      return currentUserId > 0 ? [currentUserId] : undefined;
    }
    if (typeof filters.responsavel === 'number') return [filters.responsavel];
    return undefined;
  }, [filters.responsavel, currentUserId]);

  const modalidadeParam = useMemo<ModalidadeAudiencia[] | undefined>(
    () => (filters.modalidade ? [filters.modalidade as ModalidadeAudiencia] : undefined),
    [filters.modalidade],
  );

  const trtParam = useMemo<CodigoTribunal[] | undefined>(
    () => (filters.trt.length > 0 ? (filters.trt as CodigoTribunal[]) : undefined),
    [filters.trt],
  );

  const grauParam = useMemo<GrauTribunal[] | undefined>(
    () => (filters.grau.length > 0 ? filters.grau : undefined),
    [filters.grau],
  );

  const tipoAudienciaIdParam = useMemo<number[] | undefined>(
    () => (filters.tipoAudienciaId.length > 0 ? filters.tipoAudienciaId : undefined),
    [filters.tipoAudienciaId],
  );

  const { audiencias: allAudiencias, isLoading, error, total: serverTotal, refetch } = useAudienciasUnified({
    viewMode,
    currentDate,
    search: search || undefined,
    capturaId: capturaIdFromUrl,
    responsavelId: responsavelIdParam,
    modalidade: modalidadeParam,
    trt: trtParam,
    grau: grauParam,
    tipoAudienciaId: tipoAudienciaIdParam,
    // status NAO enviado — filtragem client-side mantém contadores das tabs.
  });

  useEffect(() => {
    let cancelado = false;
    setUltimaCapturaLoading(true);
    (async () => {
      const result = await actionObterResumoUltimaCapturaAudiencias();
      if (!cancelado) {
        setUltimaCaptura(result.success && result.data ? result.data : null);
        setUltimaCapturaLoading(false);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  // ── Derived Data ────────────────────────────────────────────────────────

  const responsavelNomesMap = useMemo(() => {
    const map = new Map<number, string>();
    initialUsuarios.forEach((u) => {
      map.set(u.id, u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`);
    });
    return map;
  }, [initialUsuarios]);

  const filterCounts = useMemo(() => ({
    total: serverTotal || allAudiencias.length,
    marcadas: allAudiencias.filter((a) => a.status === StatusAudiencia.Marcada).length,
    finalizadas: allAudiencias.filter((a) => a.status === StatusAudiencia.Finalizada).length,
    canceladas: allAudiencias.filter((a) => a.status === StatusAudiencia.Cancelada).length,
    semResponsavel: allAudiencias.filter((a) => !a.responsavelId).length,
  }), [allAudiencias, serverTotal]);

  const totalMarcadas = filterCounts.marcadas;
  const totalFinalizadas = filterCounts.finalizadas;

  // Audiências filtradas pelos filtros ativos (apenas status client-side;
  // demais filtros já foram aplicados no servidor).
  const audiencias = useMemo(() => {
    if (!filters.status) return allAudiencias;
    return allAudiencias.filter((a) => a.status === filters.status);
  }, [allAudiencias, filters.status]);

  // Low prep warnings (sempre sobre marcadas, independente da tab)
  const lowPrepAudiencias = useMemo(
    () => allAudiencias.filter(
      (a) => a.status === StatusAudiencia.Marcada && calcPrepScore(calcPrepItems(a)) < 50,
    ),
    [allAudiencias],
  );

  // Subtitle
  const subtitle = isLoading
    ? 'Carregando...'
    : `${audiencias.length} audiência${audiencias.length !== 1 ? 's' : ''} · ${totalMarcadas} marcada${totalMarcadas !== 1 ? 's' : ''}`;

  // ── Copilot Context ─────────────────────────────────────────────────────

  useAgentContext({
    description: 'Contexto da tela de audiências: visualização atual e dados carregados',
    value: {
      visualizacao_atual: viewMode,
      total_audiencias: audiencias.length,
      total_marcadas: totalMarcadas,
      total_finalizadas: totalFinalizadas,
      data_atual: currentDate.toISOString(),
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleViewDetail = useCallback((audiencia: Audiencia) => {
    setSelectedAudiencia(audiencia);
    setIsDetailOpen(true);
  }, []);

  const handleUltimaCapturaClick = useCallback((capturaId: number) => {
    router.push(`${VIEW_ROUTES.lista}?capturaId=${capturaId}`);
  }, [router]);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Stack gap="loose">
      {/* ── Header ─────────────────────────────────────────── */}
      {viewMode !== 'quadro' && (
        <Inline align="end" justify="between">
          <Stack gap="tight">
            <Heading level="page">Audiências</Heading>
            <Text variant="caption" as="p" className="mt-0.5">
              {subtitle}
            </Text>
          </Stack>
          <Button size="sm" className="rounded-xl" onClick={() => setIsNovaAudienciaOpen(true)}>
            <Plus className="size-3.5" />
            Nova Audiência
          </Button>
        </Inline>
      )}

      {/* ── KPI Strip ──────────────────────────────────────── */}
      <MissionKpiStrip audiencias={allAudiencias} />

      {/* ── Última Captura ─────────────────────────────────── */}
      <AudienciasUltimaCapturaCard
        resumo={ultimaCaptura}
        isLoading={ultimaCapturaLoading}
        onClick={handleUltimaCapturaClick}
      />

      {/* ── Insight Banners ────────────────────────────────── */}
      {!isLoading && lowPrepAudiencias.length > 0 && (
        <InsightBanner type="warning">
          {lowPrepAudiencias.length} audiência{lowPrepAudiencias.length > 1 ? 's' : ''} com
          preparo abaixo de 50% — revise antes do horário
        </InsightBanner>
      )}

      {error && (
        <InsightBanner type="alert">{error}</InsightBanner>
      )}

      {/* ── View Controls ──────────────────────────────────── */}
      {/* design-system-escape: layout responsivo complexo stack-to-inline */}
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex flex-col sm:flex-row items-start sm:items-center gap-3")}>
        <AudienciasFilterBar
          filters={filters}
          onChange={setFilters}
          usuarios={initialUsuarios.map((u) => ({
            id: u.id,
            nomeExibicao: u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`,
          }))}
          tiposAudiencia={initialTiposAudiencia}
          currentUserId={currentUserId}
          counts={filterCounts}
        />
        <Inline gap="tight" justify="end" className="flex-1 w-full sm:w-auto">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar parte, processo, tipo..."
          />
          <ViewToggle
            mode={viewMode}
            onChange={handleViewChange}
            options={VIEW_OPTIONS}
          />
        </Inline>
      </div>

      {/* ── Content ────────────────────────────────────────── */}

      {isLoading && (
        <Stack gap="tight">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border border-border/20 bg-muted-foreground/5 animate-pulse" />
          ))}
        </Stack>
      )}

      {!isLoading && viewMode === 'quadro' && (
        <AudienciasMissaoContent
          audiencias={audiencias}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onViewDetail={handleViewDetail}
          responsavelNomes={responsavelNomesMap}
        />
      )}

      {!isLoading && viewMode === 'semana' && (
        <AudienciasSemanaView
          audiencias={audiencias}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onViewDetail={handleViewDetail}
          responsavelNomes={responsavelNomesMap}
          usuarios={initialUsuarios}
          onResponsavelChange={refetch}
        />
      )}

      {!isLoading && viewMode === 'mes' && (
        <AudienciasMesView
          audiencias={audiencias}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          refetch={refetch}
        />
      )}

      {!isLoading && viewMode === 'ano' && (
        <AudienciasAnoView
          audiencias={audiencias}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          refetch={refetch}
        />
      )}

      {!isLoading && viewMode === 'lista' && (
        <AudienciasListaView
          audiencias={audiencias}
          onViewDetail={handleViewDetail}
          search={search}
          usuarios={initialUsuarios}
        />
      )}

      {/* ── Detail Dialog ──────────────────────────────────── */}
      {selectedAudiencia && (
        <AudienciaDetailDialog
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          audiencia={selectedAudiencia}
        />
      )}

      {/* ── Nova Audiência Dialog ──────────────────────────── */}
      <NovaAudienciaDialog
        open={isNovaAudienciaOpen}
        onOpenChange={setIsNovaAudienciaOpen}
        onSuccess={refetch}
      />
    </Stack>
  );
}
