'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Typography } from '@/components/ui/typography';
import { useDashboard, isDashboardAdmin, isDashboardUsuario } from '@/app/_lib/hooks/use-dashboard';
import type {
  DashboardUsuarioData,
  DashboardAdminData,
} from '@/backend/types/dashboard/types';

import {
  UserStatusCards,
  AdminStatusCards,
  AdminInfoCards,
  WidgetProcessosResumo,
  WidgetAudienciasProximas,
  WidgetExpedientesUrgentes,
  WidgetProdutividadePerformance,
} from './widgets';

// ============================================================================
// Interfaces de Props
// ============================================================================

interface UserDashboardProps {
  data: DashboardUsuarioData;
  onRefetch: () => void;
}

interface AdminDashboardProps {
  data: DashboardAdminData;
  onRefetch: () => void;
}

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

function UserDashboard({ data, onRefetch }: UserDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div className="flex items-center justify-between">
        <div>
          <Typography.H3>Olá, {data.usuario.nome}!</Typography.H3>
          <Typography.Muted>
            Acompanhe seus processos, audiências e expedientes
          </Typography.Muted>
        </div>
        <Button variant="outline" size="sm" onClick={onRefetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Status */}
      <section>
        <UserStatusCards
          processos={data.processos}
          audiencias={data.audiencias}
          expedientes={data.expedientes}
        />
      </section>

      {/* Widgets de Detalhe */}
      <section className="space-y-4">
        <Typography.H4 className="text-muted-foreground">Detalhamento</Typography.H4>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Coluna 1 */}
          <div className="space-y-6">
            <WidgetProcessosResumo data={data.processos} />
            <WidgetAudienciasProximas
              audiencias={data.proximasAudiencias}
              resumo={data.audiencias}
            />
          </div>

          {/* Coluna 2 */}
          <div className="space-y-6">
            <WidgetExpedientesUrgentes
              expedientes={data.expedientesUrgentes}
              resumo={data.expedientes}
            />
            <WidgetProdutividadePerformance data={data.produtividade} />
          </div>
        </div>
      </section>

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

function AdminDashboard({ data, onRefetch }: AdminDashboardProps) {
  const expedientesVencidos = data.expedientesUrgentes.filter(
    (e) => e.dias_restantes < 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Typography.H3>Visão Geral do Escritório</Typography.H3>
          <Typography.Muted>
            Métricas consolidadas e status das operações
          </Typography.Muted>
        </div>
        <Button variant="outline" size="sm" onClick={onRefetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Status */}
      <section>
        <AdminStatusCards
          metricas={data.metricas}
          expedientesVencidos={expedientesVencidos}
        />
      </section>

      {/* Info Cards */}
      <section>
        <AdminInfoCards metricas={data.metricas} />
      </section>

      {/* Widgets de Detalhe */}
      <section className="space-y-4">
        <Typography.H4 className="text-muted-foreground">Expedientes e Audiências</Typography.H4>

        <div className="grid gap-6 lg:grid-cols-2">
          <WidgetAudienciasProximas audiencias={data.proximasAudiencias} />
          <WidgetExpedientesUrgentes expedientes={data.expedientesUrgentes} />
        </div>
      </section>

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
    return (
      <AdminDashboard
        data={data as DashboardAdminData}
        onRefetch={refetch}
      />
    );
  }

  return (
    <UserDashboard
      data={data as DashboardUsuarioData}
      onRefetch={refetch}
    />
  );
}
