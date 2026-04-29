'use client';

import { FileCheck2, Send, FilePlus2, ClipboardList } from 'lucide-react';
import {
  PulseKpiCard,
  PulseKpiGrid,
} from '@/components/shared/pulse-kpi-card';
import { AnimatedNumber } from '@/app/(authenticated)/dashboard/widgets/primitives';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContratosPulseStripProps {
  assinadosNaoDistribuidos: number;
  distribuidosMes: number;
  assinadosMes: number;
  emContratacao: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ContratosPulseStrip({
  assinadosNaoDistribuidos,
  distribuidosMes,
  assinadosMes,
  emContratacao,
}: ContratosPulseStripProps) {
  return (
    <PulseKpiGrid>
      {/* ── Assinados não distribuídos ─────────────────────────── */}
      <PulseKpiCard
        label="Assinados não distribuídos"
        icon={FileCheck2}
        iconColor="text-primary/60"
        iconBg="bg-primary/8"
      >
        <AnimatedNumber value={assinadosNaoDistribuidos} />
      </PulseKpiCard>

      {/* ── Distribuídos esse mês ──────────────────────────────── */}
      <PulseKpiCard
        label="Distribuídos esse mês"
        icon={Send}
        iconColor="text-success/60"
        iconBg="bg-success/8"
      >
        <AnimatedNumber value={distribuidosMes} />
      </PulseKpiCard>

      {/* ── Assinados esse mês ─────────────────────────────────── */}
      <PulseKpiCard
        label="Assinados esse mês"
        icon={FilePlus2}
        iconColor="text-info/60"
        iconBg="bg-info/8"
      >
        <AnimatedNumber value={assinadosMes} />
      </PulseKpiCard>

      {/* ── Em contratação ─────────────────────────────────────── */}
      <PulseKpiCard
        label="Em contratação"
        icon={ClipboardList}
        iconColor="text-warning/60"
        iconBg="bg-warning/8"
      >
        <AnimatedNumber value={emContratacao} />
      </PulseKpiCard>
    </PulseKpiGrid>
  );
}
