'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircle,
  MoreHorizontal,
  Pin,
  Settings,
  Share2,
  Trash,
  TrendingDown,
  TrendingUp,
  Clock,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { cn } from '@/app/_lib/utils/utils';

// ============================================================================
// Types
// ============================================================================

interface PerformanceMetric {
  label: string;
  value: number | string;
  trend?: number;
  trendDir?: 'up' | 'down';
  icon?: React.ElementType;
}

interface ActivityItem {
  id: string;
  text: string;
  date: string;
  status: 'success' | 'warning' | 'danger' | 'neutral';
}

interface PerformanceCardProps {
  title: string;
  subtitle?: string;
  metrics: PerformanceMetric[];
  progressLabel?: string;
  progressValue?: number;
  activities?: ActivityItem[];
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  onPin?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  onRemove?: () => void;
  className?: string;
}

// ============================================================================
// Subcomponents
// ============================================================================

function MetricItem({ metric }: { metric: PerformanceMetric }) {
  const Icon = metric.icon;

  return (
    <div className="flex flex-col items-start justify-start">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <span className="text-xl font-bold text-foreground">{metric.value}</span>
      </div>
      <span className="text-xs text-muted-foreground font-medium mb-1">
        {metric.label}
      </span>
      {metric.trend !== undefined && metric.trendDir && (
        <span
          className={cn(
            'flex items-center gap-0.5 text-xs font-semibold',
            metric.trendDir === 'up' ? 'text-emerald-500' : 'text-destructive'
          )}
        >
          {metric.trendDir === 'up' ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {metric.trendDir === 'up' ? '+' : ''}
          {metric.trend}%
        </span>
      )}
    </div>
  );
}

function ActivityListItem({ activity }: { activity: ActivityItem }) {
  const statusConfig = {
    success: { color: 'text-emerald-500', tone: 'success' as const },
    warning: { color: 'text-amber-500', tone: 'warning' as const },
    danger: { color: 'text-destructive', tone: 'danger' as const },
    neutral: { color: 'text-muted-foreground', tone: 'neutral' as const },
  };

  const config = statusConfig[activity.status];

  return (
    <li className="flex items-center justify-between gap-2.5 text-sm">
      <span className="flex items-center gap-2 min-w-0">
        <CheckCircle className={cn('h-3.5 w-3.5 shrink-0', config.color)} />
        <span className="text-xs text-foreground truncate">{activity.text}</span>
      </span>
      <Badge variant="soft" tone={config.tone} className="shrink-0 text-[10px] px-1.5">
        {activity.date}
      </Badge>
    </li>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PerformanceCard({
  title,
  subtitle,
  metrics,
  progressLabel,
  progressValue,
  activities,
  primaryAction,
  secondaryAction,
  onPin,
  onShare,
  onSettings,
  onRemove,
  className,
}: PerformanceCardProps) {
  const hasActions = onPin || onShare || onSettings || onRemove;

  return (
    <Card className={cn('w-full', className)}>
      {/* Header */}
      <CardHeader className="pb-0">
        <CardTitle className="flex flex-col gap-0.5">
          <span className="text-base">{title}</span>
          {subtitle && (
            <span className="text-xs font-normal text-muted-foreground">
              {subtitle}
            </span>
          )}
        </CardTitle>
        {hasActions && (
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                {onSettings && (
                  <DropdownMenuItem onClick={onSettings}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                )}
                {onPin && (
                  <DropdownMenuItem onClick={onPin}>
                    <Pin className="h-4 w-4 mr-2" />
                    Fixar no Dashboard
                  </DropdownMenuItem>
                )}
                {onShare && (
                  <DropdownMenuItem onClick={onShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onRemove}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Remover
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-5">
        {/* Performance Metrics Grid */}
        <div>
          <div className="font-medium text-sm mb-3 text-muted-foreground">
            Desempenho
          </div>
          <div className="grid grid-cols-3 gap-3">
            {metrics.map((metric, index) => (
              <MetricItem key={index} metric={metric} />
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        {progressValue !== undefined && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-medium text-foreground">
                  {progressLabel || 'Progresso'}
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {progressValue}%
                </span>
              </div>
              <Progress
                value={progressValue}
                className={cn(
                  'h-2',
                  progressValue >= 80
                    ? '[&>div]:bg-emerald-500'
                    : progressValue >= 60
                      ? '[&>div]:bg-amber-500'
                      : '[&>div]:bg-destructive'
                )}
              />
            </div>
          </>
        )}

        {/* Recent Activity */}
        {activities && activities.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="font-medium text-sm text-foreground mb-2.5">
                Atividade Recente
              </div>
              <ul className="space-y-2">
                {activities.map((activity) => (
                  <ActivityListItem key={activity.id} activity={activity} />
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>

      {/* Footer */}
      {(primaryAction || secondaryAction) && (
        <CardFooter className="gap-2.5 border-t pt-4">
          {secondaryAction && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button className="flex-1" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

// ============================================================================
// Pre-configured Variants
// ============================================================================

interface AdvogadoPerformanceProps {
  nome: string;
  cargo?: string;
  baixasSemana: number;
  baixasMes: number;
  taxaCumprimentoPrazo: number;
  expedientesVencidos: number;
  trendSemana?: number;
  trendMes?: number;
  atividadesRecentes?: ActivityItem[];
  onVerRelatorio?: () => void;
  onAgendar?: () => void;
  className?: string;
}

export function AdvogadoPerformanceCard({
  nome,
  cargo,
  baixasSemana,
  baixasMes,
  taxaCumprimentoPrazo,
  expedientesVencidos,
  trendSemana,
  trendMes,
  atividadesRecentes,
  onVerRelatorio,
  onAgendar,
  className,
}: AdvogadoPerformanceProps) {
  const metrics: PerformanceMetric[] = [
    {
      label: 'Baixas Semana',
      value: baixasSemana,
      trend: trendSemana,
      trendDir: trendSemana !== undefined ? (trendSemana >= 0 ? 'up' : 'down') : undefined,
      icon: FileCheck,
    },
    {
      label: 'Baixas Mês',
      value: baixasMes,
      trend: trendMes,
      trendDir: trendMes !== undefined ? (trendMes >= 0 ? 'up' : 'down') : undefined,
      icon: Calendar,
    },
    {
      label: 'Vencidos',
      value: expedientesVencidos,
      icon: Clock,
    },
  ];

  return (
    <PerformanceCard
      title={nome}
      subtitle={cargo}
      metrics={metrics}
      progressLabel="Taxa de Cumprimento"
      progressValue={taxaCumprimentoPrazo}
      activities={atividadesRecentes}
      primaryAction={
        onVerRelatorio ? { label: 'Relatório Completo', onClick: onVerRelatorio } : undefined
      }
      secondaryAction={
        onAgendar ? { label: 'Agendar', onClick: onAgendar } : undefined
      }
      onPin={() => {}}
      onSettings={() => {}}
      className={className}
    />
  );
}

interface ProdutividadeCardProps {
  nomeUsuario: string;
  baixasHoje: number;
  baixasSemana: number;
  baixasMes: number;
  mediaDiaria: number;
  comparativoSemanaAnterior: number;
  metaMensal?: number;
  atividadesRecentes?: ActivityItem[];
  onVerDetalhes?: () => void;
  className?: string;
}

export function ProdutividadeCard({
  baixasHoje,
  baixasSemana,
  baixasMes,
  mediaDiaria,
  comparativoSemanaAnterior,
  metaMensal = 100,
  atividadesRecentes,
  onVerDetalhes,
  className,
}: ProdutividadeCardProps) {
  const progressValue = Math.min(100, Math.round((baixasMes / metaMensal) * 100));

  const metrics: PerformanceMetric[] = [
    {
      label: 'Hoje',
      value: baixasHoje,
      icon: Clock,
    },
    {
      label: 'Semana',
      value: baixasSemana,
      trend: comparativoSemanaAnterior,
      trendDir: comparativoSemanaAnterior >= 0 ? 'up' : 'down',
      icon: Calendar,
    },
    {
      label: 'Mês',
      value: baixasMes,
      icon: FileCheck,
    },
  ];

  return (
    <PerformanceCard
      title="Minha Produtividade"
      subtitle={`Média: ${mediaDiaria.toFixed(1)} baixas/dia`}
      metrics={metrics}
      progressLabel={`Meta Mensal (${baixasMes}/${metaMensal})`}
      progressValue={progressValue}
      activities={atividadesRecentes}
      primaryAction={
        onVerDetalhes ? { label: 'Ver Detalhes', onClick: onVerDetalhes } : undefined
      }
      onSettings={() => {}}
      className={className}
    />
  );
}
