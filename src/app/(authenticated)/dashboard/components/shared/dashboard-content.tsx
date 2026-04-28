'use client';

import { cn } from '@/lib/utils';
import {
  RefreshCw,
  FileWarning,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heading } from '@/components/ui/typography';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { useDashboard, useWidgetPermissions } from '../../hooks';
import type {
  DashboardUsuarioData,
  DashboardAdminData,
  DadosFinanceirosConsolidados,
} from '../../domain';

import { MetricCard } from './metric-card';
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
    <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "w-full grid gap-4 md:grid-cols-2 lg:grid-cols-4")}>
      {/* Linha 1: KPIs */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog">; space-y-2 → migrar para <Stack gap="tight"> */ "min-w-0 rounded-lg border bg-card p-6 space-y-2")}>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}

      {/* Linha 2: Gráficos */}
      <div className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog">; space-y-4 → migrar para <Stack gap="default"> */ "min-w-0 lg:col-span-3 rounded-lg border bg-card p-6 space-y-4")}>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog">; space-y-4 → migrar para <Stack gap="default"> */ "min-w-0 lg:col-span-1 rounded-lg border bg-card p-6 space-y-4")}>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-48 w-full" />
      </div>

      {/* Linha 3: Lista */}
      <div className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog">; space-y-4 → migrar para <Stack gap="default"> */ "min-w-0 md:col-span-2 lg:col-span-4 rounded-lg border bg-card p-6 space-y-4")}>
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
    <div className={cn(/* design-system-escape: py-12 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-12 text-center")}>
      <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "rounded-full bg-destructive/10 p-4 mb-4")}>
        <RefreshCw className="h-8 w-8 text-destructive" />
      </div>
      <Heading level="subsection" className="mb-2">Erro ao carregar dashboard</Heading>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{error}</p>
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
      <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4")}>
          <Heading level="page">Olá, {data.usuario.nome}!</Heading>
        </div>
        <div className={cn(/* design-system-escape: py-12 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-12 text-center")}>
          <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "rounded-full bg-muted p-4 mb-4")}>
            <FileWarning className="h-8 w-8 text-muted-foreground" />
          </div>
          <Heading level="subsection" className="mb-2">Sem permissões de visualização</Heading>
          <p className="text-sm text-muted-foreground max-w-md">
            Você não possui permissões para visualizar dados do dashboard.
            Entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
      {/* Saudação */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4")}>
        <Heading level="page">Olá, {data.usuario.nome}!</Heading>
        <Button variant="ghost" size="sm" onClick={onRefetch} className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
        {/* ====================================================================
            GRUPO 1: KPIs CORE - Métricas Principais
            Processos, Audiências, Expedientes, Financeiro
        ==================================================================== */}
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "w-full grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4")}>
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
                href="/app/expedientes"
              />
              <MetricCard
                title="Expedientes Vencidos"
                value={data.expedientes.vencidos.toLocaleString('pt-BR')}
                href="/app/expedientes"
              />
            </>
          )}
          {podeVerFinanceiro && (
            <FinancialMetricCards dadosFinanceiros={data.dadosFinanceiros} />
          )}
        </div>

        {/* ====================================================================
            GRUPO 2: PROCESSOS - Detalhes e Análises
        ==================================================================== */}
        {podeVerProcessos && (
          <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "w-full grid grid-cols-1 gap-4 md:grid-cols-2")}>
            <WidgetProcessosResumo data={data.processos} />
            <WidgetProdutividade data={data.produtividade} />
          </div>
        )}

        {/* ====================================================================
            GRUPO 3: AUDIÊNCIAS E EXPEDIENTES - Listas Rápidas
        ==================================================================== */}
        {(podeVerAudiencias || podeVerExpedientes) && (
          <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "w-full grid grid-cols-1 gap-4 md:grid-cols-2")}>
            {podeVerAudiencias && (
              <WidgetAudienciasProximas data={data.proximasAudiencias} />
            )}
            {podeVerExpedientes && (
              <WidgetExpedientesUrgentes data={data.expedientesUrgentes} />
            )}
          </div>
        )}

        {/* ====================================================================
            GRUPO 4: FINANCEIRO - Gráficos e Análises
            Layout ajustado: Fluxo de Caixa (2 cols) + Despesas (1 col)
            Alturas equalizadas para consistência visual
        ==================================================================== */}
        {podeVerFinanceiro && (
          <>
            <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "w-full grid grid-cols-1 gap-4 lg:grid-cols-3")}>
              <div className="lg:col-span-2">
                <WidgetFluxoCaixa />
              </div>
              <div className="lg:col-span-1">
                <WidgetDespesasCategoria />
              </div>
            </div>
            <div className="w-full">
              <ObrigacoesRecentesCard />
            </div>
          </>
        )}
      </div>

      {/* Última atualização */}
      <div className={cn(/* design-system-escape: pt-4 padding direcional sem Inset equiv. */ "text-center pt-4 border-t")}>
        <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground")}>
          Última atualização:{' '}
          {new Date(data.ultimaAtualizacao).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </p>
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
    <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
      {/* Saudação */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4")}>
        <Heading level="page">Olá, {data.usuario.nome}!</Heading>
        <Button variant="ghost" size="sm" onClick={onRefetch} className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
        {/* ====================================================================
            GRUPO 1: KPIs CORE - Métricas Principais
        ==================================================================== */}
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "w-full grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4")}>
          <MetricCard
            title="Total Processos"
            value={data.metricas.totalProcessos.toLocaleString('pt-BR')}
            href="/processos"
            footer={
              <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground")}>
                Total de processos ativos: {data.metricas.processosAtivos.toLocaleString('pt-BR')} • Total de processos arquivados: {data.metricas.processosArquivados.toLocaleString('pt-BR')}
              </p>
            }
          />
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
          <MetricCard
            title="Expedientes Pendentes"
            value={data.metricas.expedientesPendentes.toLocaleString('pt-BR')}
            href="/app/expedientes"
          />
          <MetricCard
            title="Expedientes Vencidos"
            value={data.metricas.expedientesVencidos.toLocaleString('pt-BR')}
            href="/app/expedientes"
          />
          <FinancialMetricCards dadosFinanceiros={data.dadosFinanceiros} />
        </div>

        {/* ====================================================================
            GRUPO 2: AUDIÊNCIAS E EXPEDIENTES - Listas Rápidas
        ==================================================================== */}
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "w-full grid grid-cols-1 gap-4 md:grid-cols-2")}>
          <WidgetAudienciasProximas data={data.proximasAudiencias} />
          <WidgetExpedientesUrgentes data={data.expedientesUrgentes} />
        </div>

        {/* ====================================================================
            GRUPO 3: FINANCEIRO - Gráficos e Análises
            Layout ajustado: Fluxo de Caixa (2 cols) + Despesas (1 col)
            Alturas equalizadas para consistência visual
        ==================================================================== */}
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "w-full grid grid-cols-1 gap-4 lg:grid-cols-3")}>
          <div className="lg:col-span-2">
            <WidgetFluxoCaixa />
          </div>
          <div className="lg:col-span-1">
            <WidgetDespesasCategoria />
          </div>
        </div>
        <div className="w-full">
          <ObrigacoesRecentesCard />
        </div>

        {/* ====================================================================
            GRUPO 4: PRODUTIVIDADE E ADMINISTRAÇÃO
        ==================================================================== */}
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "w-full grid grid-cols-1 gap-4 md:grid-cols-2")}>
          <MetricCard
            title="Usuários Ativos"
            value={data.metricas.totalUsuarios.toLocaleString('pt-BR')}
          />
          <div className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "p-6 rounded-lg border bg-card")}>
            <Heading level="subsection" className="mb-4">Performance de Advogados</Heading>
            {data.performanceAdvogados.length > 0 ? (
              <ul className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                {data.performanceAdvogados.slice(0, 5).map((adv) => (
                  <li key={adv.usuario_id} className="flex justify-between">
                    <span className="truncate">{adv.usuario_nome}</span>
                    <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground")}>
                      {adv.baixasMes} baixas/mês ({adv.taxaCumprimentoPrazo}%)
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* ====================================================================
            GRUPO 5: CAPTURA - Status de Capturas
        ==================================================================== */}
        {data.statusCapturas.length > 0 && (
          <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "w-full grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3")}>
            {data.statusCapturas.slice(0, 6).map((captura) => {
              // Mapear status do domínio para valores do design system
              const statusMap: Record<string, string> = {
                sucesso: 'completed',
                erro: 'failed',
                pendente: 'pending',
                executando: 'in_progress',
              };
              const capturaStatus = statusMap[captura.status] || 'pending';
              
              return (
                <div
                  key={`${captura.trt}-${captura.grau}`}
                  className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "p-6 rounded-lg border bg-card")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Heading level="subsection">
                      {captura.trt} - {captura.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau'}
                    </Heading>
                    <Badge variant={getSemanticBadgeVariant('captura_status', capturaStatus)}>
                      {captura.status}
                    </Badge>
                  </div>
                  <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground")}>
                    Última execução:{' '}
                    {captura.ultimaExecucao
                      ? new Date(captura.ultimaExecucao).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : 'Nunca'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Última atualização */}
      <div className={cn(/* design-system-escape: pt-4 padding direcional sem Inset equiv. */ "text-center pt-4 border-t")}>
        <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground")}>
          Última atualização:{' '}
          {new Date(data.ultimaAtualizacao).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </p>
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
