'use client';

import { Scale, Calendar, FileCheck, AlertTriangle, Clock, CheckCircle, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/app/_lib/utils/utils';
import { ProcessoResumo, AudienciasResumo, PendentesResumo } from '../types/dashboard.types';

// ============================================================================
// Card de Status Individual
// ============================================================================

interface StatusCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: typeof Scale;
  color: string;
  href?: string;
  trend?: {
    value: number;
    label: string;
  };
  alert?: boolean;
  className?: string;
}

export function StatusCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  href,
  trend,
  alert,
  className,
}: StatusCardProps) {
  const content = (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:shadow-md',
        href && 'cursor-pointer hover:border-primary/50',
        alert && 'border-destructive/50',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight">
              {value.toLocaleString('pt-BR')}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 pt-1">
                <TrendingUp
                  className={cn(
                    'h-3 w-3',
                    trend.value > 0 ? 'text-emerald-500' : 'text-red-500',
                    trend.value > 0 ? '' : 'rotate-180'
                  )}
                />
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.value > 0 ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'rounded-lg p-2.5',
              alert && 'animate-pulse'
            )}
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// ============================================================================
// Grid de Cards de Status - Usuário
// ============================================================================

interface UserStatusCardsProps {
  processos: ProcessoResumo;
  audiencias: AudienciasResumo;
  pendentes: PendentesResumo;
  className?: string;
}

export function UserStatusCards({
  processos,
  audiencias,
  pendentes,
  className,
}: UserStatusCardsProps) {
  const hasVencidos = pendentes.vencidos > 0;
  const hasHoje = pendentes.venceHoje > 0 || audiencias.hoje > 0;

  return (
    <div className={cn('grid gap-4 grid-cols-2 lg:grid-cols-4', className)}>
      <StatusCard
        title="Processos Ativos"
        value={processos.ativos}
        subtitle={`${processos.total} total`}
        icon={Scale}
        color="#3b82f6"
        href="/processos"
      />

      <StatusCard
        title="Audiências Hoje"
        value={audiencias.hoje}
        subtitle={`${audiencias.proximos7dias} nos próximos 7 dias`}
        icon={Calendar}
        color="#22c55e"
        href="/audiencias"
        alert={hasHoje}
      />

      <StatusCard
        title="Expedientes Vencendo"
        value={pendentes.venceHoje + pendentes.venceAmanha}
        subtitle={`Hoje: ${pendentes.venceHoje} | Amanhã: ${pendentes.venceAmanha}`}
        icon={Clock}
        color="#f59e0b"
        href="/expedientes"
        alert={pendentes.venceHoje > 0}
      />

      <StatusCard
        title="Expedientes Vencidos"
        value={pendentes.vencidos}
        subtitle={pendentes.vencidos > 0 ? 'Requer ação imediata' : 'Tudo em dia'}
        icon={AlertTriangle}
        color={hasVencidos ? '#ef4444' : '#22c55e'}
        href="/expedientes?status=vencido"
        alert={hasVencidos}
      />
    </div>
  );
}

// ============================================================================
// Grid de Cards de Status - Admin
// ============================================================================

interface AdminStatusCardsProps {
  totalProcessos: number;
  totalAudiencias: number;
  totalPendentes: number;
  totalUsuarios: number;
  processosAtivos: number;
  pendentesVencidos: number;
  comparativo?: {
    processos: number;
    audiencias: number;
    pendentes: number;
  };
  className?: string;
}

export function AdminStatusCards({
  totalProcessos,
  totalAudiencias,
  totalPendentes,
  totalUsuarios,
  processosAtivos,
  pendentesVencidos,
  comparativo,
  className,
}: AdminStatusCardsProps) {
  return (
    <div className={cn('grid gap-4 grid-cols-2 lg:grid-cols-4', className)}>
      <StatusCard
        title="Total Processos"
        value={totalProcessos}
        subtitle={`${processosAtivos} ativos`}
        icon={Scale}
        color="#3b82f6"
        href="/processos"
        trend={comparativo ? { value: comparativo.processos, label: 'vs mês anterior' } : undefined}
      />

      <StatusCard
        title="Total Audiências"
        value={totalAudiencias}
        subtitle="Este mês"
        icon={Calendar}
        color="#22c55e"
        href="/audiencias"
        trend={comparativo ? { value: comparativo.audiencias, label: 'vs mês anterior' } : undefined}
      />

      <StatusCard
        title="Expedientes Pendentes"
        value={totalPendentes}
        subtitle={pendentesVencidos > 0 ? `${pendentesVencidos} vencidos` : 'Nenhum vencido'}
        icon={FileCheck}
        color={pendentesVencidos > 0 ? '#f59e0b' : '#22c55e'}
        href="/expedientes"
        alert={pendentesVencidos > 0}
      />

      <StatusCard
        title="Usuários Ativos"
        value={totalUsuarios}
        subtitle="Advogados e assistentes"
        icon={Users}
        color="#8b5cf6"
        href="/usuarios"
      />
    </div>
  );
}
