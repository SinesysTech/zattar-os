'use client';

import {
  RefreshCw,
  FileText,
  Calendar,
  FileWarning,
  DollarSign,
  BarChart3,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Typography } from '@/components/ui/typography';
import { useDashboard, useWidgetPermissions } from '../../hooks';
import type {
  DashboardUsuarioData,
  DashboardAdminData,
  DadosFinanceirosConsolidados,
} from '../../domain';

import { MetricCard } from './metric-card';
import { DomainSection } from './domain-section';
import {
  WidgetFluxoCaixa,
  WidgetDespesasCategoria,
  WidgetProcessosResumo,
  WidgetAudienciasProximas,
  WidgetExpedientesUrgentes,
  WidgetProdutividade,
} from '../widgets';
import { ObrigacoesRecentesCard } from './obrigacoes-recentes-card';

// ============================================================================
// Financial Metrics Component
// ============================================================================

interface FinancialMetricCardsProps {
  dadosFinanceiros: DadosFinanceirosConsolidados;
}

function FinancialMetricCards({ dadosFinanceiros }: FinancialMetricCardsProps) {
  const formatarMoeda = (valor: number) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <>
      <MetricCard
        title="Saldo Total"
        value={formatarMoeda(dadosFinanceiros.saldoTotal)}
      />
      <MetricCard
        title="Contas a Pagar"
        value={formatarMoeda(dadosFinanceiros.contasPagar.valor)}
      />
      <MetricCard
        title="Contas a Receber"
        value={formatarMoeda(dadosFinanceiros.contasReceber.valor)}
      />
      <MetricCard
        title="Alertas Financeiros"
        value={dadosFinanceiros.alertas.length.toString()}
      />
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
  const {
    podeVerProcessos,
    podeVerAudiencias,
    podeVerExpedientes,
    podeVerFinanceiro,
    temAlgumaPermissao,
    isLoading: isLoadingPermissions,
  } = useWidgetPermissions();

  // Se ainda está carregando permissões, mostra skeleton
  if (isLoadingPermissions) {
    return <DashboardSkeleton />;
  }

  // Se não tem nenhuma permissão
  if (!temAlgumaPermissao) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Typography.H3>Olá, {data.usuario.nome}!</Typography.H3>
            <Typography.Muted>Bem-vindo ao sistema</Typography.Muted>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileWarning className="h-8 w-8 text-muted-foreground" />
          </div>
          <Typography.H4 className="mb-2">Sem permissões de visualização</Typography.H4>
          <Typography.Muted className="max-w-md">
            Você não possui permissões para visualizar dados do dashboard.
            Entre em contato com o administrador do sistema.
          </Typography.Muted>
        </div>
      </div>
    );
  }

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
        {/* Linha 1: KPIs Core - Processos, Audiências, Expedientes */}
        {podeVerProcessos && (
          <MetricCard
            title="Processos"
            value={data.processos.total.toLocaleString('pt-BR')}
            href="/processos"
          />
        )}
        {podeVerAudiencias && (
          <MetricCard
            title="Audiências"
            value={data.audiencias.total.toLocaleString('pt-BR')}
            href="/audiencias"
          />
        )}
        {podeVerExpedientes && (
          <>
            <MetricCard
              title="Expedientes Pendentes"
              value={data.expedientes.total.toLocaleString('pt-BR')}
              href="/expedientes"
            />
            <MetricCard
              title="Expedientes Vencidos"
              value={data.expedientes.vencidos.toLocaleString('pt-BR')}
              href="/expedientes"
            />
          </>
        )}

        {/* Linha 2: KPIs Financeiros */}
        {podeVerFinanceiro && (
          <FinancialMetricCards dadosFinanceiros={data.dadosFinanceiros} />
        )}

        {/* Linha 3: Widgets de Processos e Produtividade */}
        {podeVerProcessos && (
          <>
            <div className="md:col-span-2">
              <WidgetProcessosResumo data={data.processos} />
            </div>
            <div className="md:col-span-2">
              <WidgetProdutividade data={data.produtividade} />
            </div>
          </>
        )}

        {/* Linha 4: Gráficos Financeiros */}
        {podeVerFinanceiro && (
          <>
            <div className="md:col-span-2 lg:col-span-3">
              <WidgetFluxoCaixa />
            </div>
            <div className="lg:col-span-1">
              <WidgetDespesasCategoria />
            </div>
          </>
        )}

        {/* Linha 5: Listas Rápidas - Audiências e Expedientes */}
        {podeVerAudiencias && (
          <div className="md:col-span-2">
            <WidgetAudienciasProximas data={data.proximasAudiencias} />
          </div>
        )}
        {podeVerExpedientes && (
          <div className="md:col-span-2">
            <WidgetExpedientesUrgentes data={data.expedientesUrgentes} />
          </div>
        )}

        {/* Linha 6: Obrigações */}
        {podeVerFinanceiro && (
          <div className="col-span-1 md:col-span-2 lg:col-span-4">
            <ObrigacoesRecentesCard />
          </div>
        )}
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
  onRefetch: () => void;
}

function AdminDashboard({ data, onRefetch }: AdminDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Saudação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Typography.H3>Olá, {data.usuario.nome}!</Typography.H3>
          <Typography.Muted>Visão administrativa do escritório</Typography.Muted>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefetch} className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Seção: Processos */}
      <DomainSection
        title="Processos"
        icon={FileText}
        description="Visão geral dos processos do escritório"
        columns={4}
      >
        <MetricCard
          title="Total Processos"
          value={data.metricas.totalProcessos.toLocaleString('pt-BR')}
          href="/processos"
        />
        <MetricCard
          title="Processos Ativos"
          value={data.metricas.processosAtivos.toLocaleString('pt-BR')}
          href="/processos"
        />
        <MetricCard
          title="Processos Únicos"
          value={data.metricas.processosAtivosUnicos.toLocaleString('pt-BR')}
          href="/processos"
        />
        <MetricCard
          title="Taxa de Resolução"
          value={`${data.metricas.taxaResolucao}%`}
        />
      </DomainSection>

      {/* Seção: Audiências */}
      <DomainSection
        title="Audiências"
        icon={Calendar}
        description="Audiências agendadas e próximas"
        columns={2}
      >
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Total Audiências"
            value={data.metricas.totalAudiencias.toLocaleString('pt-BR')}
            href="/audiencias"
          />
          <MetricCard
            title="Audiências do Mês"
            value={data.metricas.audienciasMes.toLocaleString('pt-BR')}
            href="/audiencias"
          />
        </div>
        <WidgetAudienciasProximas data={data.proximasAudiencias} />
      </DomainSection>

      {/* Seção: Expedientes */}
      <DomainSection
        title="Expedientes"
        icon={FileWarning}
        description="Prazos e pendências"
        columns={2}
      >
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Expedientes Pendentes"
            value={data.metricas.expedientesPendentes.toLocaleString('pt-BR')}
            href="/expedientes"
          />
          <MetricCard
            title="Expedientes Vencidos"
            value={data.metricas.expedientesVencidos.toLocaleString('pt-BR')}
            href="/expedientes"
          />
        </div>
        <WidgetExpedientesUrgentes data={data.expedientesUrgentes} />
      </DomainSection>

      {/* Seção: Financeiro */}
      <DomainSection
        title="Financeiro"
        icon={DollarSign}
        description="Indicadores financeiros do escritório"
        columns={4}
      >
        <FinancialMetricCards dadosFinanceiros={data.dadosFinanceiros} />
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <WidgetFluxoCaixa />
        </div>
        <div className="col-span-1 lg:col-span-1">
          <WidgetDespesasCategoria />
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <ObrigacoesRecentesCard />
        </div>
      </DomainSection>

      {/* Seção: Produtividade */}
      <DomainSection
        title="Produtividade"
        icon={BarChart3}
        description="Métricas de performance da equipe"
        columns={2}
      >
        <MetricCard
          title="Usuários Ativos"
          value={data.metricas.totalUsuarios.toLocaleString('pt-BR')}
        />
        <div className="p-4 rounded-lg border bg-card">
          <Typography.H4 className="text-sm font-medium mb-2">Performance de Advogados</Typography.H4>
          {data.performanceAdvogados.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {data.performanceAdvogados.slice(0, 5).map((adv) => (
                <li key={adv.usuario_id} className="flex justify-between">
                  <span className="truncate">{adv.usuario_nome}</span>
                  <span className="text-muted-foreground">
                    {adv.baixasMes} baixas/mês ({adv.taxaCumprimentoPrazo}%)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Typography.Muted>Nenhum dado disponível</Typography.Muted>
          )}
        </div>
      </DomainSection>

      {/* Seção: Captura */}
      {data.statusCapturas.length > 0 && (
        <DomainSection
          title="Captura"
          icon={Radio}
          description="Status das capturas automáticas do PJE"
          columns={3}
        >
          {data.statusCapturas.slice(0, 6).map((captura) => (
            <div
              key={`${captura.trt}-${captura.grau}`}
              className="p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center justify-between mb-2">
                <Typography.H4 className="text-sm font-medium">
                  {captura.trt} - {captura.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau'}
                </Typography.H4>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    captura.status === 'sucesso'
                      ? 'bg-green-100 text-green-800'
                      : captura.status === 'erro'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {captura.status}
                </span>
              </div>
              <Typography.Muted className="text-xs">
                Última execução:{' '}
                {captura.ultimaExecucao
                  ? new Date(captura.ultimaExecucao).toLocaleString('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : 'Nunca'}
              </Typography.Muted>
            </div>
          ))}
        </DomainSection>
      )}

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
    return <AdminDashboard data={data as DashboardAdminData} onRefetch={refetch} />;
  }

  return (
    <UserDashboard
      data={data as DashboardUsuarioData}
      onRefetch={refetch}
    />
  );
}
