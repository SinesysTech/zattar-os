'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Typography } from '@/components/ui/typography';
import { useDashboard } from '@/app/_lib/hooks/use-dashboard';
import type {
  DashboardUsuarioData,
  DashboardAdminData,
} from '@/backend/types/dashboard/types';

import { SortableUserDashboard, SortableAdminDashboard } from './sortable-dashboard';
import { WidgetSaldoContas } from './widgets/widget-saldo-contas';
import { WidgetContasPagarReceber } from './widgets/widget-contas-pagar-receber';
import { WidgetFluxoCaixa } from './widgets/widget-fluxo-caixa';
import { WidgetDespesasCategoria } from './widgets/widget-despesas-categoria';
import { WidgetOrcamentoAtual } from './widgets/widget-orcamento-atual';
import { WidgetAlertasFinanceiros } from './widgets/widget-alertas-financeiros';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
// import { DashboardFilters, FilterGroup } from './dashboard-filters'; // Disponível para uso futuro

// ============================================================================
// Loading e Error States
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Status Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Widgets Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-24 w-full mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <RefreshCw className="h-8 w-8 text-destructive" />
      </div>
      <Typography.H4 className="mb-2">Erro ao carregar dashboard</Typography.H4>
      <Typography.Muted className="mb-4 max-w-md">{error}</Typography.Muted>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Tentar novamente
      </Button>
    </div>
  );
}

// ============================================================================
// User Dashboard Wrapper
// ============================================================================

interface UserDashboardProps {
  data: DashboardUsuarioData;
  onRefetch: () => void;
}

function UserDashboard({ data, onRefetch }: UserDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Typography.H3>Olá, {data.usuario.nome}!</Typography.H3>
          <Typography.Muted>
            Acompanhe seus processos, audiências e expedientes
          </Typography.Muted>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefetch} className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Widgets Financeiros - Usando ResponsiveGrid */}
      <ResponsiveGrid
        columns={{ xs: 1, sm: 1, md: 2, lg: 3, xl: 3 }}
        gap={4}
      >
        <WidgetSaldoContas />
        <WidgetContasPagarReceber />
        <WidgetAlertasFinanceiros />
      </ResponsiveGrid>

      {/* Fluxo de Caixa e Despesas - Layout responsivo */}
      <ResponsiveGrid
        columns={{ xs: 1, sm: 1, md: 1, lg: 3, xl: 3 }}
        gap={4}
      >
        <div className="lg:col-span-2">
          <WidgetFluxoCaixa />
        </div>
        <WidgetDespesasCategoria />
      </ResponsiveGrid>

      <WidgetOrcamentoAtual />

      {/* Dashboard Sortable */}
      <SortableUserDashboard data={data} />

      {/* Última atualização */}
      <div className="text-center pt-4 border-t">
        <Typography.Muted className="text-xs">
          Última atualização:{' '}
          {new Date(data.ultimaAtualizacao).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </Typography.Muted>
      </div>
    </div>
  );
}

// ============================================================================
// Admin Dashboard Wrapper
// ============================================================================

interface AdminDashboardProps {
  data: DashboardAdminData;
}

function AdminDashboard({ data }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Widgets Financeiros - Usando ResponsiveGrid */}
      <ResponsiveGrid
        columns={{ xs: 1, sm: 1, md: 2, lg: 3, xl: 3 }}
        gap={4}
      >
        <WidgetSaldoContas />
        <WidgetContasPagarReceber />
        <WidgetAlertasFinanceiros />
      </ResponsiveGrid>

      {/* Fluxo de Caixa e Despesas - Layout responsivo */}
      <ResponsiveGrid
        columns={{ xs: 1, sm: 1, md: 1, lg: 3, xl: 3 }}
        gap={4}
      >
        <div className="lg:col-span-2">
          <WidgetFluxoCaixa />
        </div>
        <WidgetDespesasCategoria />
      </ResponsiveGrid>

      <WidgetOrcamentoAtual />

      {/* Dashboard Sortable */}
      <SortableAdminDashboard data={data} />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DashboardContent() {
  const { data, isAdmin, isLoading, error, refetch } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={refetch} />;
  }

  if (!data) {
    return <DashboardError error="Dados não disponíveis" onRetry={refetch} />;
  }

  // Passa os dados tipados para o componente apropriado
  if (isAdmin) {
    return <AdminDashboard data={data as DashboardAdminData} />;
  }

  return (
    <UserDashboard
      data={data as DashboardUsuarioData}
      onRefetch={refetch}
    />
  );
}
