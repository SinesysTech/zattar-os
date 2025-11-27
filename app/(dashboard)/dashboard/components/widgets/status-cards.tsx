'use client';

import { Scale, Calendar, FileCheck, Users, AlertTriangle } from 'lucide-react';
import { StatCard } from './stat-card';
import type {
  ProcessoResumo,
  AudienciasResumo,
  ExpedientesResumo,
  MetricasEscritorio,
} from '@/backend/types/dashboard/types';

// ============================================================================
// Status Cards para Usuário
// ============================================================================

interface UserStatusCardsProps {
  processos: ProcessoResumo;
  audiencias: AudienciasResumo;
  expedientes: ExpedientesResumo;
}

export function UserStatusCards({ processos, audiencias, expedientes }: UserStatusCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Processos Ativos"
        value={processos.ativos}
        description={`${processos.arquivados} arquivados`}
        icon={Scale}
        href="/processos"
        variant="default"
      />

      <StatCard
        title="Audiências Hoje"
        value={audiencias.hoje}
        description={`${audiencias.proximos7dias} nos próximos 7 dias`}
        icon={Calendar}
        href="/audiencias"
        variant={audiencias.hoje > 0 ? 'warning' : 'default'}
      />

      <StatCard
        title="Expedientes Pendentes"
        value={expedientes.total - expedientes.vencidos}
        description={
          expedientes.vencidos > 0
            ? `${expedientes.vencidos} vencido${expedientes.vencidos > 1 ? 's' : ''}`
            : 'Nenhum vencido'
        }
        icon={FileCheck}
        href="/expedientes"
        variant={expedientes.vencidos > 0 ? 'danger' : 'success'}
        trend={expedientes.vencidos > 0 ? 'down' : 'neutral'}
      />

      <StatCard
        title="Vence Hoje"
        value={expedientes.venceHoje}
        description={`${expedientes.venceAmanha} vencem amanhã`}
        icon={AlertTriangle}
        href="/expedientes"
        variant={expedientes.venceHoje > 0 ? 'warning' : 'success'}
      />
    </div>
  );
}

// ============================================================================
// Status Cards para Admin
// ============================================================================

interface AdminStatusCardsProps {
  metricas: MetricasEscritorio;
  expedientesVencidos: number;
}

export function AdminStatusCards({ metricas, expedientesVencidos }: AdminStatusCardsProps) {
  const comparativo = metricas.comparativoMesAnterior;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total de Processos"
        value={metricas.totalProcessos}
        change={comparativo.processos}
        changeLabel="vs mês anterior"
        trend={comparativo.processos > 0 ? 'up' : comparativo.processos < 0 ? 'down' : 'neutral'}
        icon={Scale}
        href="/processos"
        variant="default"
      />

      <StatCard
        title="Processos Ativos"
        value={metricas.processosAtivos}
        description={`${metricas.totalProcessos - metricas.processosAtivos} arquivados`}
        icon={Scale}
        href="/processos?status=ativo"
        variant="success"
      />

      <StatCard
        title="Audiências do Mês"
        value={metricas.audienciasMes}
        change={comparativo.audiencias}
        changeLabel="vs mês anterior"
        trend={comparativo.audiencias > 0 ? 'up' : comparativo.audiencias < 0 ? 'down' : 'neutral'}
        icon={Calendar}
        href="/audiencias"
        variant="info"
      />

      <StatCard
        title="Expedientes Pendentes"
        value={metricas.expedientesPendentes}
        description={
          expedientesVencidos > 0
            ? `${expedientesVencidos} vencido${expedientesVencidos > 1 ? 's' : ''}`
            : 'Nenhum vencido'
        }
        icon={FileCheck}
        href="/expedientes"
        variant={expedientesVencidos > 0 ? 'danger' : 'success'}
      />
    </div>
  );
}

// ============================================================================
// Cards de Info Geral Admin
// ============================================================================

interface AdminInfoCardsProps {
  metricas: MetricasEscritorio;
}

export function AdminInfoCards({ metricas }: AdminInfoCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Usuários Ativos"
        value={metricas.totalUsuarios}
        icon={Users}
        href="/configuracoes/usuarios"
        variant="info"
      />

      <StatCard
        title="Taxa de Resolução"
        value={`${metricas.taxaResolucao}%`}
        description="Expedientes resolvidos no prazo"
        icon={FileCheck}
        variant={metricas.taxaResolucao >= 80 ? 'success' : metricas.taxaResolucao >= 60 ? 'warning' : 'danger'}
      />

      <StatCard
        title="Expedientes Vencidos"
        value={metricas.expedientesVencidos}
        description="Requerem atenção imediata"
        icon={AlertTriangle}
        href="/expedientes?status=vencido"
        variant={metricas.expedientesVencidos > 0 ? 'danger' : 'success'}
      />
    </div>
  );
}
