'use client';

import { useMemo } from 'react';
import {
  CalendarClock,
  Link2,
  AlertTriangle,
  Inbox,
  Unplug,
} from 'lucide-react';
import { PulseStrip, type PulseItem } from '@/components/dashboard/pulse-strip';
import type {
  ComunicacaoCNJEnriquecida,
  GazetteMetrics,
} from '@/app/(authenticated)/comunica-cnj/domain';

export interface CapturadasPulseStripProps {
  metricas: GazetteMetrics | null;
  comunicacoes: ComunicacaoCNJEnriquecida[];
}

/**
 * Tira horizontal de KPIs da página de gestão de capturadas.
 * Segue o padrão PulseStrip usado em Audiências/Expedientes/Processos —
 * 4 cards (não 5) por definição visual do design system.
 */
export function CapturadasPulseStrip({
  metricas,
  comunicacoes,
}: CapturadasPulseStripProps) {
  const items = useMemo<PulseItem[]>(() => {
    const total = metricas?.totalCapturadas ?? comunicacoes.length;
    const vinculados =
      metricas?.vinculados ??
      comunicacoes.filter((c) => c.statusVinculacao === 'vinculado').length;
    const orfaos =
      metricas?.orfaos ??
      comunicacoes.filter((c) => c.statusVinculacao === 'orfao').length;
    const prazosCriticos =
      metricas?.prazosCriticos ??
      comunicacoes.filter(
        (c) => c.diasParaPrazo !== null && c.diasParaPrazo <= 3,
      ).length;

    return [
      {
        label: 'Total capturadas',
        total,
        icon: Inbox,
        color: 'text-primary',
      },
      {
        label: 'Vinculadas',
        total: vinculados,
        icon: Link2,
        color: 'text-success',
      },
      {
        label: 'Órfãs',
        total: orfaos,
        icon: Unplug,
        color: 'text-warning',
      },
      {
        label: 'Prazos críticos',
        total: prazosCriticos,
        icon: AlertTriangle,
        color: 'text-destructive',
      },
    ];
  }, [metricas, comunicacoes]);

  return <PulseStrip items={items} />;
}

export const PUBLICACOES_HOJE_ICON = CalendarClock;
