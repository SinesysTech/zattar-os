'use client';

import { AlertTriangle, Clock, CalendarClock, UserX } from 'lucide-react';
import {
  PulseKpiCard,
  PulseKpiBar,
  PulseKpiGrid,
} from '@/components/shared/pulse-kpi-card';
import { AnimatedNumber } from '@/app/(authenticated)/dashboard/widgets/primitives';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PulseMetric {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBgBase: string;
  barColor: string;
  highlight?: boolean;
}

interface ExpedientesPulseStripProps {
  vencidos: number;
  hoje: number;
  proximos: number;
  semDono: number;
  total: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExpedientesPulseStrip({
  vencidos,
  hoje,
  proximos,
  semDono,
  total,
}: ExpedientesPulseStripProps) {
  const metrics: PulseMetric[] = [
    {
      label: 'Vencidos',
      value: vencidos,
      icon: AlertTriangle,
      iconColor: 'text-destructive/60',
      iconBgBase: 'bg-destructive',
      barColor: 'bg-destructive/25',
      highlight: vencidos > 0,
    },
    {
      label: 'Hoje',
      value: hoje,
      icon: Clock,
      iconColor: 'text-warning/60',
      iconBgBase: 'bg-warning',
      barColor: 'bg-warning/25',
    },
    {
      label: 'Próximos 3d',
      value: proximos,
      icon: CalendarClock,
      iconColor: 'text-primary/60',
      iconBgBase: 'bg-primary',
      barColor: 'bg-primary/25',
    },
    {
      label: 'Sem dono',
      value: semDono,
      icon: UserX,
      iconColor: 'text-warning/60',
      iconBgBase: 'bg-warning',
      barColor: 'bg-warning/25',
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
            iconHighlightBorder={isHighlighted ? 'border border-destructive/20' : undefined}
            highlight={isHighlighted}
            highlightBorderColor="border-destructive/15"
            footer={<PulseKpiBar pct={pct} color={metric.barColor} />}
          >
            <AnimatedNumber
              value={metric.value}
              className={isHighlighted ? 'text-destructive' : ''}
            />
          </PulseKpiCard>
        );
      })}
    </PulseKpiGrid>
  );
}
