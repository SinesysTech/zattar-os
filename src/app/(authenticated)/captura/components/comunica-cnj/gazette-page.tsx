'use client';

import { useEffect } from 'react';
import { useGazetteStore } from './hooks/use-gazette-store';
import { GazetteAlertBanner } from './gazette-alert-banner';
import { GazetteAiInsights } from './gazette-ai-insights';
import { GazetteKpiStrip } from './gazette-kpi-strip';
import { GazetteViewTabs } from './gazette-view-tabs';
import { GazetteFilterBar } from './gazette-filter-bar';
import { GazetteFilterChips } from './gazette-filter-chips';
import { GazetteDataTable } from './gazette-data-table';
import { GazetteCardGrid } from './gazette-card-grid';
import { GazetteDetailPanel } from './gazette-detail-panel';
import type { StatusVinculacao } from '@/app/(authenticated)/captura/comunica-cnj/domain';
import {
  actionObterMetricas,
  actionListarComunicacoesCapturadas,
  actionListarViews,
} from '@/app/(authenticated)/captura/actions/comunica-cnj-actions';

export function GazettePage() {
  const {
    metricas,
    viewAtiva,
    modoVisualizacao,
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
        {modoVisualizacao === 'tabela' ? (
          <GazetteDataTable />
        ) : (
          <GazetteCardGrid />
        )}
        <GazetteDetailPanel />
      </div>
    </div>
  );
}
