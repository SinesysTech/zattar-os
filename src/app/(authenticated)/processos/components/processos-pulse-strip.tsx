'use client';

import { Scale, Briefcase, Archive, CalendarClock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  PulseKpiCard,
  PulseKpiBar,
  PulseKpiGrid,
} from '@/components/shared/pulse-kpi-card';
import { AnimatedNumber } from '@/app/(authenticated)/dashboard/widgets/primitives';
import { cn } from '@/lib/utils';
import type { ProcessoStats } from '../types/estatisticas';

interface PulseMetric {
  label: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  iconBgBase: string;
  barColor: string;
  highlight?: boolean;
}

interface ProcessosPulseStripProps {
  stats: ProcessoStats;
}

export function ProcessosPulseStrip({ stats }: ProcessosPulseStripProps) {
  const total = stats.total;

  const metrics: PulseMetric[] = [
    {
      label: 'Acervo',
      value: stats.total,
      icon: Scale,
      iconColor: 'text-primary/60',
      iconBgBase: 'bg-primary',
      barColor: 'bg-primary/25',
    },
    {
      label: 'Em Curso',
      value: stats.emCurso,
      icon: Briefcase,
      iconColor: 'text-success/60',
      iconBgBase: 'bg-success',
      barColor: 'bg-success/25',
    },
    {
      label: 'Arquivados',
      value: stats.arquivados,
      icon: Archive,
      iconColor: 'text-muted-foreground/60',
      iconBgBase: 'bg-muted-foreground',
      barColor: 'bg-muted-foreground/25',
    },
    {
      label: 'Com Eventos',
      value: stats.comEventos,
      icon: CalendarClock,
      iconColor: 'text-warning/60',
      iconBgBase: 'bg-warning',
      barColor: 'bg-warning/25',
      highlight: stats.comEventos > 0,
    },
  ];

  return (
    <PulseKpiGrid>
      {metrics.map((metric) => {
        const pct = total > 0 ? Math.round((metric.value / total) * 100) : 0;
        const isHighlighted = Boolean(metric.highlight);

        return (
          <PulseKpiCard
            key={metric.label}
            label={metric.label}
            icon={metric.icon}
            iconColor={metric.iconColor}
            iconBg={cn(`${metric.iconBgBase}/8`)}
            iconHighlightBorder={isHighlighted ? 'border border-warning/20' : undefined}
            highlight={isHighlighted}
            highlightBorderColor="border-warning/15"
            footer={<PulseKpiBar pct={pct} color={metric.barColor} />}
          >
            <AnimatedNumber value={metric.value} />
          </PulseKpiCard>
        );
      })}
    </PulseKpiGrid>
  );
}
