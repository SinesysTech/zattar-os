'use client';

import { useEffect } from 'react';
import { useGazetteStore } from './hooks/use-gazette-store';
import { useGazetteKeyboard } from './hooks/use-gazette-keyboard';
import { GazetteKeyboardHelp } from './gazette-keyboard-help';
import { GazetteAlertBanner } from './gazette-alert-banner';
import { GazetteAiInsights } from './gazette-ai-insights';
import { GazetteKpiStrip } from './gazette-kpi-strip';
import { GazetteSearchBar } from './gazette-search-bar';
import { GazetteSyncDialog } from './gazette-sync-dialog';
import { GazetteOrphanResolver } from './gazette-orphan-resolver';
import { EmptyFirstTime } from './gazette-empty-states';
import { GazetteViewTabs } from './gazette-view-tabs';
import { GazetteFilterBar } from './gazette-filter-bar';
import { GazetteFilterChips } from './gazette-filter-chips';
import { GazetteDataTable } from './gazette-data-table';
import { GazetteCardGrid } from './gazette-card-grid';
import { GazetteDetailPanel } from './gazette-detail-panel';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { StatusVinculacao } from '@/app/(authenticated)/comunica-cnj/domain';
import {
  actionObterMetricas,
  actionListarComunicacoesCapturadas,
  actionListarViews,
} from '@/app/(authenticated)/comunica-cnj/actions/comunica-cnj-actions';

export function GazettePage() {
  useGazetteKeyboard();

  const {
    metricas,
    comunicacoes,
    viewAtiva,
    modoVisualizacao,
    isLoading,
    setMetricas,
    setComunicacoes,
    setViews,
    setIsLoading,
  } = useGazetteStore();

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [metricasRes, comunicacoesRes, viewsRes] = await Promise.all([
          actionObterMetricas(),
          actionListarComunicacoesCapturadas({ page: 1, limit: 50 }),
          actionListarViews(),
        ]);
        if (metricasRes.success && metricasRes.data) setMetricas(metricasRes.data);
        if (comunicacoesRes.success && comunicacoesRes.data) {
          // Map raw data to enriched format with safe defaults
          const items = (comunicacoesRes.data.data ?? []).map((item) => ({
            ...item,
            statusVinculacao: (item.expedienteId ? 'vinculado' : 'orfao') as StatusVinculacao,
            diasParaPrazo: null,
            partesAutor: [] as string[],
            partesReu: [] as string[],
          }));
          setComunicacoes(items);
        }
        if (viewsRes.success && viewsRes.data) setViews(viewsRes.data);
      } catch (e) {
        console.error('Failed to load gazette data:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOrphanView = viewAtiva === 'orfaos';

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)]">
      {/* Header with Search + Sync */}
      <div className="flex items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-3">
          <Heading level="page">Diário Oficial</Heading>
          <Text
            variant="overline"
            className="rounded border border-border/40 px-2 py-0.5 text-muted-foreground"
          >
            Comunica CNJ
          </Text>
        </div>
        <div className="flex max-w-xl flex-1 items-center gap-3">
          <GazetteSearchBar />
        </div>
        <div className="flex items-center gap-3">
          <GazetteSyncDialog
            trigger={
              <Button variant="outline" size="sm" className="gap-1.5">
                <RefreshCw className="size-3.5" aria-hidden />
                Sincronizar
              </Button>
            }
          />
          <div className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full bg-success shadow-[0_0_6px_var(--success)]"
              aria-hidden
            />
            <Text variant="micro-caption">API ok</Text>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {metricas && metricas.prazosCriticos > 0 && (
        <GazetteAlertBanner
          count={metricas.prazosCriticos}
          descricao="Intimações com prazo crítico"
          onVerPrazos={() => useGazetteStore.getState().setViewAtiva('prazos')}
        />
      )}

      {/* AI Insights */}
      {!isOrphanView && <GazetteAiInsights />}

      {/* KPI Strip */}
      {!isOrphanView && <GazetteKpiStrip />}

      {/* View Tabs + Filter Bar */}
      {!isOrphanView && (
        <>
          <GazetteViewTabs />
          <GazetteFilterBar />
          <GazetteFilterChips />
        </>
      )}

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {isOrphanView ? (
          <GazetteOrphanResolver />
        ) : comunicacoes.length === 0 && !isLoading ? (
          <EmptyFirstTime onSync={() => useGazetteStore.getState().setIsLoading(true)} />
        ) : (
          <>
            {modoVisualizacao === 'tabela' ? <GazetteDataTable /> : <GazetteCardGrid />}
            <GazetteDetailPanel />
          </>
        )}
      </div>
      <GazetteKeyboardHelp />
    </div>
  );
}
