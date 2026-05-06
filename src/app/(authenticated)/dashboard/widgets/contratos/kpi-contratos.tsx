'use client';

/**
 * Widget: KPI de Contratos
 * ============================================================================
 * Exibe 4 métricas-chave da carteira de contratos em cards compactos:
 * - Assinados não distribuídos (total com status 'Contratado')
 * - Distribuídos esse mês
 * - Assinados esse mês
 * - Em contratação (total)
 *
 * Conectado via useDashboard() → data.contratos
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import { FileCheck2, Send, FilePlus2, ClipboardList } from 'lucide-react';
import { WidgetContainer, fmtNum } from '../primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard } from '../../hooks';
import type { LucideIcon } from 'lucide-react';

function KpiItem({
  label,
  value,
  sublabel,
  icon: Icon,
}: {
  label: string;
  value: number;
  sublabel?: string;
  icon: LucideIcon;
}) {
  return (
    <div className={cn("flex flex-col gap-2 p-3 rounded-xl bg-muted/40")}>
      <div className={cn("flex items-center justify-between")}>
        <span className={cn("text-overline text-muted-foreground/70 leading-tight")}>
          {label}
        </span>
        <Icon className="size-3.5 text-muted-foreground/50 shrink-0" />
      </div>
      <span className={cn("font-display text-2xl font-bold tabular-nums")}>
        {fmtNum(value)}
      </span>
      {sublabel && (
        <span className={cn("text-[9px] text-muted-foreground/50")}>
          {sublabel}
        </span>
      )}
    </div>
  );
}

export function WidgetKpiContratos() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  const contratos = data?.contratos;

  if (!contratos) return <WidgetSkeleton size="md" />;

  const countStatus = (status: string) =>
    contratos.porStatus.find(
      (s) => s.status.toLowerCase() === status.toLowerCase(),
    )?.count ?? 0;

  const emContratacao = countStatus('em contratação') || countStatus('em_contratacao');
  const contratadosNaoDistribuidos = countStatus('contratado');
  const assinadosMes = contratos.assinadosMes ?? 0;
  const distribuidosMes = contratos.distribuidosMes ?? 0;

  return (
    <WidgetContainer
      title="Contratos — Visão Geral"
      icon={FileCheck2}
      subtitle="Métricas-chave da carteira"
      depth={1}
      className="md:col-span-2"
    >
      <div className={cn("grid grid-cols-2 gap-2")}>
        <KpiItem
          label="Assinados não distribuídos"
          value={contratadosNaoDistribuidos}
          sublabel="Aguardando distribuição"
          icon={FileCheck2}
        />
        <KpiItem
          label="Distribuídos esse mês"
          value={distribuidosMes}
          icon={Send}
        />
        <KpiItem
          label="Assinados esse mês"
          value={assinadosMes}
          icon={FilePlus2}
        />
        <KpiItem
          label="Em contratação"
          value={emContratacao}
          sublabel="Aguardando assinatura"
          icon={ClipboardList}
        />
      </div>
    </WidgetContainer>
  );
}
