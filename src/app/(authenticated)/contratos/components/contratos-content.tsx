'use client';

/**
 * ContratosContent — Orchestrator Glass Briefing para a pagina principal de contratos
 * ===================================================================================
 * Compoe: Header → PulseStrip → InsightBanners → PipelineStepper → ContratosTableWrapper
 *
 * Busca stats via actionContratosPulseStats no mount e distribui dados
 * para os sub-componentes visuais. O ContratosTableWrapper continua
 * gerenciando sua propria paginacao e filtros internamente.
 */

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Heading } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InsightBanner } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import {
  actionContratosPulseStats,
  type ContratosPulseStats,
} from '../actions/contratos-actions';
import { ContratosPulseStrip } from './contratos-pulse-strip';
import { ContratosPipelineStepper } from './contratos-pipeline-stepper';
import { ContratosTableWrapper } from './contratos-table-wrapper';

// ─── Component ──────────────────────────────────────────────────────────────

export function ContratosContent() {
  const [stats, setStats] = React.useState<ContratosPulseStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  // ── Fetch stats on mount ──────────────────────────────────────────────────

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await actionContratosPulseStats();
        if (!cancelled && result.success) {
          setStats(result.data);
        }
      } catch {
        // Stats are non-critical — table still works
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────

  const totalContratos = stats
    ? Object.values(stats.porStatus).reduce((sum, n) => sum + n, 0)
    : 0;

  // ── Pipeline stepper click → toggle filter ────────────────────────────────

  const handleStatusClick = React.useCallback((status: string) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Contratos</Heading>
          {isLoading ? (
            <Skeleton className="h-4 w-36 mt-1" />
          ) : (
            <p className="text-sm text-muted-foreground/50 mt-0.5">
              {stats?.ativos ?? 0} ativos &middot; {totalContratos} total
            </p>
          )}
        </div>
        <Button size="sm" className="rounded-xl">
          <Plus className="size-3.5" />
          Novo Contrato
        </Button>
      </div>

      {/* ── Pulse Strip (KPIs) ──────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <ContratosPulseStrip
          ativos={stats.ativos}
          valorTotal={stats.valorTotal}
          vencendo30d={stats.vencendo30d}
          novosMes={stats.novosMes}
          total={totalContratos}
          trendMensal={stats.trendMensal}
        />
      ) : null}

      {/* ── Insight Banners ─────────────────────────────────────── */}
      {!isLoading && stats && stats.vencendo30d > 0 && (
        <InsightBanner type="warning">
          {stats.vencendo30d} contrato{stats.vencendo30d !== 1 ? 's' : ''} vence
          {stats.vencendo30d !== 1 ? 'm' : ''} nos proximos 30 dias
        </InsightBanner>
      )}

      {!isLoading && stats && stats.semResponsavel > 0 && (
        <InsightBanner type="info">
          {stats.semResponsavel} contrato{stats.semResponsavel !== 1 ? 's' : ''} sem
          responsavel atribuido
        </InsightBanner>
      )}

      {/* ── Pipeline Stepper ────────────────────────────────────── */}
      {!isLoading && stats ? (
        <ContratosPipelineStepper
          porStatus={stats.porStatus}
          activeStatus={statusFilter}
          onStatusClick={handleStatusClick}
        />
      ) : isLoading ? (
        <Skeleton className="h-12 rounded-xl" />
      ) : null}

      {/* ── Table ───────────────────────────────────────────────── */}
      <ContratosTableWrapper
        initialData={[]}
        initialPagination={null}
        clientesOptions={[]}
        partesContrariasOptions={[]}
        statusFilter={statusFilter}
      />
    </div>
  );
}
