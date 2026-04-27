'use client';

import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { DiarioOficialPageNav } from './components/shared/diario-oficial-page-nav';
import {
  CapturadasFilterBar,
  CapturadasGlassList,
  CapturadasGlassCards,
  CapturadasDetailDialog,
} from './components/capturadas';
import type { StatusValue } from './components/capturadas/capturadas-filter-bar';
import { GazetteMissionKpiStrip } from './components/capturadas/gazette-mission-kpi-strip';
import { GazetteSyncDialog } from './components/gazette-sync-dialog';
import { GazetteAlertBanner } from './components/gazette-alert-banner';
import { GazetteOrphanResolver } from './components/gazette-orphan-resolver';
import {
  actionObterMetricas,
  actionListarComunicacoesCapturadas,
  actionListarViews,
} from './actions/comunica-cnj-actions';
import { useGazetteStore } from './components/hooks/use-gazette-store';
import type {
  StatusVinculacao,
  ComunicacaoCNJEnriquecida,
} from './domain';

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'tabela', icon: List, label: 'Lista' },
  { id: 'cards', icon: LayoutGrid, label: 'Cards' },
];

// Mapeia valor do StatusFilter <-> viewAtiva no store (strings legadas)
function statusToView(v: StatusValue): string {
  if (v === null) return 'todas';
  if (v === 'vinculado') return 'vinculados';
  if (v === 'pendente') return 'pendentes';
  if (v === 'orfao') return 'orfaos';
  return v; // 'prazos'
}

function viewToStatus(view: string): StatusValue {
  if (view === 'vinculados') return 'vinculado';
  if (view === 'pendentes') return 'pendente';
  if (view === 'orfaos') return 'orfao';
  if (view === 'prazos') return 'prazos';
  return null;
}

export function CapturadasClient() {
  const {
    metricas,
    comunicacoes,
    viewAtiva,
    modoVisualizacao,
    comunicacaoSelecionada,
    filtros,
    isLoading,
    setMetricas,
    setComunicacoes,
    setViews,
    setViewAtiva,
    setModoVisualizacao,
    setFiltros,
    selecionarComunicacao,
    setIsLoading,
  } = useGazetteStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [metricasRes, comunicacoesRes, viewsRes] = await Promise.all([
          actionObterMetricas(),
          actionListarComunicacoesCapturadas({ page: 1, limit: 100 }),
          actionListarViews(),
        ]);
        if (metricasRes.success && metricasRes.data) setMetricas(metricasRes.data);
        if (comunicacoesRes.success && comunicacoesRes.data) {
          const enriquecidas: ComunicacaoCNJEnriquecida[] = (
            comunicacoesRes.data.data ?? []
          ).map((item) => ({
            ...item,
            statusVinculacao: (item.expedienteId
              ? 'vinculado'
              : 'orfao') as StatusVinculacao,
            diasParaPrazo: null,
            partesAutor: [] as string[],
            partesReu: [] as string[],
          }));
          setComunicacoes(enriquecidas);
        }
        if (viewsRes.success && viewsRes.data) setViews(viewsRes.data);
      } catch (e) {
        console.error('Failed to load capturadas:', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusSelecionado = viewToStatus(viewAtiva);

  const comunicacoesFiltradas = useMemo(() => {
    let list = comunicacoes;

    // Filtro por status de vinculação / prazos críticos
    if (statusSelecionado === 'vinculado') {
      list = list.filter((c) => c.statusVinculacao === 'vinculado');
    } else if (statusSelecionado === 'pendente') {
      list = list.filter((c) => c.statusVinculacao === 'pendente');
    } else if (statusSelecionado === 'orfao') {
      list = list.filter((c) => c.statusVinculacao === 'orfao');
    } else if (statusSelecionado === 'prazos') {
      list = list.filter(
        (c) => c.diasParaPrazo !== null && c.diasParaPrazo <= 7,
      );
    }

    // Demais filtros
    if (filtros.fonte && filtros.fonte.length > 0) {
      list = list.filter((c) => filtros.fonte!.includes(c.siglaTribunal));
    }
    if (filtros.tipo && filtros.tipo.length > 0) {
      list = list.filter(
        (c) => c.tipoComunicacao && filtros.tipo!.includes(c.tipoComunicacao),
      );
    }
    if (filtros.meio) {
      list = list.filter((c) => c.meio === filtros.meio);
    }
    if (filtros.periodo?.inicio) {
      list = list.filter((c) => c.dataDisponibilizacao >= filtros.periodo!.inicio);
    }
    if (filtros.periodo?.fim) {
      list = list.filter((c) => c.dataDisponibilizacao <= filtros.periodo!.fim);
    }

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => {
        const num = (c.numeroProcessoMascara ?? c.numeroProcesso).toLowerCase();
        const orgao = (c.nomeOrgao ?? '').toLowerCase();
        const tipo = (c.tipoComunicacao ?? '').toLowerCase();
        return num.includes(q) || orgao.includes(q) || tipo.includes(q);
      });
    }

    return list;
  }, [comunicacoes, statusSelecionado, filtros, search]);

  const statusCounts = useMemo(
    () => ({
      vinculado: comunicacoes.filter((c) => c.statusVinculacao === 'vinculado')
        .length,
      pendente: comunicacoes.filter((c) => c.statusVinculacao === 'pendente')
        .length,
      orfao: comunicacoes.filter((c) => c.statusVinculacao === 'orfao').length,
      prazos: comunicacoes.filter(
        (c) => c.diasParaPrazo !== null && c.diasParaPrazo <= 7,
      ).length,
    }),
    [comunicacoes],
  );

  const tribunaisDisponiveis = useMemo(() => {
    const set = new Set<string>();
    comunicacoes.forEach((c) => c.siglaTribunal && set.add(c.siglaTribunal));
    return Array.from(set).sort();
  }, [comunicacoes]);

  const tiposDisponiveis = useMemo(() => {
    const set = new Set<string>();
    comunicacoes.forEach((c) => c.tipoComunicacao && set.add(c.tipoComunicacao));
    return Array.from(set).sort();
  }, [comunicacoes]);

  const tipoCounts = useMemo(() => {
    const map = new Map<string, number>();
    comunicacoes.forEach((c) => {
      if (!c.tipoComunicacao) return;
      map.set(c.tipoComunicacao, (map.get(c.tipoComunicacao) ?? 0) + 1);
    });
    return map;
  }, [comunicacoes]);

  const isOrphanView = statusSelecionado === 'orfao';

  const subtitle = isLoading
    ? 'Carregando...'
    : `${comunicacoesFiltradas.length.toLocaleString('pt-BR')} comunicaç${
        comunicacoesFiltradas.length === 1 ? 'ão' : 'ões'
      }${
        statusCounts.prazos > 0
          ? ` · ${statusCounts.prazos} prazo${statusCounts.prazos === 1 ? '' : 's'} crítico${statusCounts.prazos === 1 ? '' : 's'}`
          : ''
      }`;

  return (
    <div className={cn(/* design-system-escape: space-y-5 sem token DS */ "space-y-5")}>
      <DiarioOficialPageNav
        active="capturadas"
        subtitle={subtitle}
        action={
          <GazetteSyncDialog
            trigger={
              <Button variant="outline" size="sm" className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "gap-1.5 rounded-xl")}>
                <RefreshCw className="size-3.5" aria-hidden />
                Sincronizar
              </Button>
            }
          />
        }
      />

      {/* Alert banner */}
      {metricas && metricas.prazosCriticos > 0 && (
        <GazetteAlertBanner
          count={metricas.prazosCriticos}
          descricao="Intimações com prazo crítico"
          onVerPrazos={() => setViewAtiva(statusToView('prazos'))}
        />
      )}

      {/* KPI Strip (custom com sparkline/próximo prazo/taxa de vinculação) */}
      <GazetteMissionKpiStrip
        metricas={metricas}
        comunicacoes={comunicacoes}
      />

      {/* Toolbar unificada: FilterBar + Search + ViewToggle */}
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex flex-col sm:flex-row items-start sm:items-center gap-3")}>
        <CapturadasFilterBar
          filtros={filtros}
          onChange={setFiltros}
          tribunais={tribunaisDisponiveis}
          tiposComunicacao={tiposDisponiveis}
          tipoCounts={tipoCounts}
          statusSelecionado={statusSelecionado}
          onStatusChange={(v) => setViewAtiva(statusToView(v))}
          statusCounts={statusCounts}
        />
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-1 justify-end")}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar processo, órgão, tipo..."
          />
          <ViewToggle
            mode={modoVisualizacao}
            onChange={(m) => setModoVisualizacao(m as 'tabela' | 'cards')}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl border border-border/20 bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : isOrphanView ? (
        <GazetteOrphanResolver />
      ) : modoVisualizacao === 'tabela' ? (
        <CapturadasGlassList
          comunicacoes={comunicacoesFiltradas}
          onSelect={selecionarComunicacao}
          selectedId={comunicacaoSelecionada?.id ?? null}
        />
      ) : (
        <CapturadasGlassCards
          comunicacoes={comunicacoesFiltradas}
          onSelect={selecionarComunicacao}
          selectedId={comunicacaoSelecionada?.id ?? null}
        />
      )}

      {/* Detail dialog */}
      <CapturadasDetailDialog
        comunicacao={comunicacaoSelecionada}
        open={comunicacaoSelecionada !== null}
        onOpenChange={(open) => {
          if (!open) selecionarComunicacao(null);
        }}
      />
    </div>
  );
}
