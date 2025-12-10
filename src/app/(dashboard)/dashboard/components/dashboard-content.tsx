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

import { MetricCard } from '@/components/modules/dashboard/metric-card';
import { WidgetFluxoCaixa } from './widgets/widget-fluxo-caixa';
import { WidgetDespesasCategoria } from './widgets/widget-despesas-categoria';
import { ObrigacoesRecentesCard } from './obrigacoes-recentes-card';

import { useSaldoContas, useContasPagarReceber, useAlertasFinanceiros } from '@/app/_lib/hooks/use-dashboard-financeiro';

// ============================================================================
// Financial Metrics Component
// ============================================================================

function FinancialMetricCards() {
  const { saldoAtual, isLoading: isLoadingSaldo, error: errorSaldo } = useSaldoContas();
  const { contasPagar, contasReceber, isLoading: isLoadingContas, error: errorContas } = useContasPagarReceber();
  const { alertas, isLoading: isLoadingAlertas, error: errorAlertas } = useAlertasFinanceiros();

  const isLoading = isLoadingSaldo || isLoadingContas || isLoadingAlertas;

  if (isLoading) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-2 animate-pulse">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </>
    );
  }

  const saldoTotal = saldoAtual;
  const totalContasPagar = contasPagar?.valor ?? 0;
  const totalContasReceber = contasReceber?.valor ?? 0;
  const alertasCount = alertas?.length ?? 0;

  return (
    <>
      <MetricCard title="Saldo Total" value={errorSaldo ? 'Erro' : saldoTotal} />
      <MetricCard title="Contas a Pagar" value={errorContas ? 'Erro' : totalContasPagar} />
      <MetricCard title="Contas a Receber" value={errorContas ? 'Erro' : totalContasReceber} />
      <MetricCard title="Alertas Financeiros" value={errorAlertas ? 'Erro' : alertasCount} />
    </>
  );
}


// ============================================================================
// Loading e Error States
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Linha 1: KPIs */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}

      {/* Linha 2: Gráficos */}
      <div className="lg:col-span-3 rounded-lg border bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="lg:col-span-1 rounded-lg border bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-48 w-full" />
      </div>

      {/* Linha 3: Lista */}
      <div className="md:col-span-2 lg:col-span-4 rounded-lg border bg-card p-6 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
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
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Linha 1: KPIs */}
        <FinancialMetricCards />

        {/* Linha 2: Gráficos */}
        <div className="md:col-span-2 lg:col-span-3">
            <WidgetFluxoCaixa />
        </div>
        <div className='lg:col-span-1'>
            <WidgetDespesasCategoria />
        </div>

        {/* Linha 3: Listas Rápidas */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <ObrigacoesRecentesCard />
        </div>
      </div>

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Typography.H3>Dashboard Administrador</Typography.H3>
          <Typography.Muted>
            Visão geral do escritório.
          </Typography.Muted>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Linha 1: KPIs */}
        <FinancialMetricCards />

        {/* Linha 2: Gráficos */}
        <div className="md:col-span-2 lg:col-span-3">
            <WidgetFluxoCaixa />
        </div>
        <div className='lg:col-span-1'>
            <WidgetDespesasCategoria />
        </div>

        {/* Linha 3: Listas Rápidas */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <ObrigacoesRecentesCard />
        </div>
      </div>
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
