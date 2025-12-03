'use client';

import { Scale, Calendar, FileCheck, AlertTriangle } from 'lucide-react';
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
// Status Cards para Admin (3 cards)
// ============================================================================

interface AdminStatusCardsProps {
  metricas: MetricasEscritorio;
  expedientesVencidos: number;
}

export function AdminStatusCards({ metricas, expedientesVencidos }: AdminStatusCardsProps) {
  const comparativo = metricas.comparativoMesAnterior;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Card 1: Processos Ativos (contagem única) */}
      <StatCard
        title="Processos Ativos"
        value={metricas.processosAtivosUnicos}
        description={`${metricas.totalProcessos - metricas.processosAtivosUnicos} arquivados`}
        icon={Scale}
        href="/processos"
        variant="default"
      />

      {/* Card 2: Audiências do Mês */}
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

      {/* Card 3: Expedientes Vencidos */}
      <StatCard
        title="Expedientes Vencidos"
        value={expedientesVencidos}
        description={expedientesVencidos > 0 ? 'Requerem atenção' : 'Tudo em dia'}
        icon={AlertTriangle}
        href="/expedientes?status=vencido"
        variant={expedientesVencidos > 0 ? 'danger' : 'success'}
      />
    </div>
  );
}
