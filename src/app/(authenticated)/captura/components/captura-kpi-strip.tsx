'use client';

import { useMemo } from 'react';
import { PulseStrip } from '@/components/dashboard/pulse-strip';
import type { PulseItem } from '@/components/dashboard/pulse-strip';
import { Database, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

export interface CapturaKpiData {
  total: number;
  sucesso: number;
  emAndamento: number;
  falhas: number;
  taxaSucesso: number;
}

interface CapturaKpiStripProps {
  data: CapturaKpiData;
  isLoading?: boolean;
}

export function CapturaKpiStrip({ data, isLoading }: CapturaKpiStripProps) {
  const items = useMemo<PulseItem[]>(() => [
    {
      label: 'Total Capturas',
      total: data.total,
      delta: undefined,
      icon: Database,
      color: 'text-primary',
    },
    {
      label: 'Sucesso',
      total: data.taxaSucesso,
      delta: `${data.sucesso} ok`,
      icon: CheckCircle2,
      color: 'text-success',
    },
    {
      label: 'Em Andamento',
      total: data.emAndamento,
      delta: undefined,
      icon: Loader2,
      color: 'text-info',
    },
    {
      label: 'Falhas (7d)',
      total: data.falhas,
      delta: undefined,
      icon: AlertTriangle,
      color: 'text-destructive',
    },
  ], [data]);

  return <PulseStrip items={items} />;
}
