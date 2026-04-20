'use client';

import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, List, RefreshCw } from 'lucide-react';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/dashboard/search-input';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { ComunicaCnjSubnav } from './components/shared/comunica-cnj-subnav';
import {
  CapturadasPulseStrip,
  CapturadasFilterBar,
  CapturadasGlassList,
  CapturadasGlassCards,
  CapturadasDetailDialog,
} from './components/capturadas';
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

/**
 * Cliente orquestrador da página `/comunica-cnj/capturadas`.
 * Gestão operacional das comunicações já sincronizadas:
 * KPIs, filtros, tabs, lista/cards, banner de prazos e resolver de órfãos.
 *
 * Estrutura espelha o padrão AudienciasClient: full-width space-y-5,
 * PulseStrip, FilterBar inline, ViewToggle, content switcher.
 */
export function CapturadasClient() {
  const {
    metricas,
    comunicacoes,
    viewAtiva,
    modoVisualizacao,
    densidade,
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
            statusVinculacao: (item.expedienteId ? 'vinculado' : 'orfao') as StatusVinculacao,
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

  const comunicacoesFiltradas = useMemo(() => {
    let list = comunicacoes;

    // View tabs
    if (viewAtiva === 'pendentes') {
      list = list.filter((c) => c.statusVinculacao === 'pendente');
    } else if (viewAtiva === 'orfaos') {
      list = list.filter((c) => c.statusVinculacao === 'orfao');
    } else if (viewAtiva === 'prazos') {
      list = list.filter(
        (c) => c.diasParaPrazo !== null && c.diasParaPrazo <= 7,
      );
    }

    // Filter bar
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
  }, [comunicacoes, viewAtiva, filtros, search]);

  const tabs = useMemo<TabPillOption[]>(() => {
    const total = comunicacoes.length;
    const pendentes = comunicacoes.filter(
      (c) => c.statusVinculacao === 'pendente',
    ).length;
    const orfaos = comunicacoes.filter((c) => c.statusVinculacao === 'orfao').length;
    const prazos = comunicacoes.filter(
      (c) => c.diasParaPrazo !== null && c.diasParaPrazo <= 7,
    ).length;

    return [
      { id: 'todas', label: 'Todas', count: total },
      { id: 'pendentes', label: 'Pendentes', count: pendentes },
      { id: 'orfaos', label: 'Órfãos', count: orfaos },
      { id: 'prazos', label: 'Prazos', count: prazos },
    ];
  }, [comunicacoes]);

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

  const isOrphanView = viewAtiva === 'orfaos';
  const subtitle = isLoading
    ? 'Carregando...'
    : `${comunicacoesFiltradas.length.toLocaleString('pt-BR')} comunicaç${comunicacoesFiltradas.length === 1 ? 'ão' : 'ões'}`;

  return (
    <div className="flex flex-col gap-5 px-6 py-6">
      <ComunicaCnjSubnav active="capturadas" />

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Capturadas</Heading>
          <Text variant="caption" className="mt-0.5 text-muted-foreground">
            {subtitle}
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <GazetteSyncDialog
            trigger={
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
                <RefreshCw className="size-3.5" aria-hidden />
                Sincronizar
              </Button>
            }
          />
        </div>
      </div>

      {/* Alert banner */}
      {metricas && metricas.prazosCriticos > 0 && (
        <GazetteAlertBanner
          count={metricas.prazosCriticos}
          descricao="Intimações com prazo crítico"
          onVerPrazos={() => setViewAtiva('prazos')}
        />
      )}

      {/* KPIs */}
      <CapturadasPulseStrip metricas={metricas} comunicacoes={comunicacoes} />

      {/* Tabs + view controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabPills tabs={tabs} active={viewAtiva} onChange={setViewAtiva} />
        <div className="flex items-center gap-2">
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

      {/* Filter bar */}
      {!isOrphanView && (
        <CapturadasFilterBar
          filtros={filtros}
          onChange={setFiltros}
          tribunais={tribunaisDisponiveis}
          tiposComunicacao={tiposDisponiveis}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-2xl border border-border/20 bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : isOrphanView ? (
        <GazetteOrphanResolver />
      ) : modoVisualizacao === 'tabela' ? (
        <CapturadasGlassList
          comunicacoes={comunicacoesFiltradas}
          onSelect={selecionarComunicacao}
          densidade={densidade}
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
