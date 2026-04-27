'use client';

/**
 * ExpedientesPulseStrip — KPI strip com 4 métricas operacionais
 * ============================================================================
 * Substitui os 5 ControlMetricCards por cards com AnimatedNumber,
 * barra de proporção e delta contextual.
 *
 * Inspiração: ProcessosPulseStrip + MissionKpiStrip
 * ============================================================================
 */

import { AlertTriangle, Clock, CalendarClock, UserX } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import {
  AnimatedNumber,
} from '@/app/(authenticated)/dashboard/widgets/primitives';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PulseMetric {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
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
      color: 'text-destructive',
      bgColor: 'bg-destructive',
      highlight: vencidos > 0,
    },
    {
      label: 'Hoje',
      value: hoje,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning',
    },
    {
      label: 'Próximos 3d',
      value: proximos,
      icon: CalendarClock,
      color: 'text-primary',
      bgColor: 'bg-primary',
    },
    {
      label: 'Sem dono',
      value: semDono,
      icon: UserX,
      color: 'text-warning',
      bgColor: 'bg-warning',
    },
  ];

  return (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 lg:grid-cols-4 gap-3")}>
      {metrics.map((metric) => {
        const pct = total > 0 ? Math.round((metric.value / total) * 100) : 0;
        const Icon = metric.icon;

        return (
          <GlassPanel
            key={metric.label}
            depth={metric.highlight ? 2 : 1}
            className={cn(
              /* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3.5 padding direcional sem Inset equiv. */ 'px-4 py-3.5',
              metric.highlight && metric.value > 0 && 'border-destructive/15',
            )}
          >
            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-start justify-between gap-2")}>
              <div className="min-w-0">
                <p className="text-meta-label truncate">
                  {metric.label}
                </p>
                <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-baseline gap-1.5 mt-1")}>
                  <p className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading>; leading-none sem token DS; tracking-tight sem token DS */ "text-kpi-value font-bold leading-none tracking-tight")}>
                    <AnimatedNumber
                      value={metric.value}
                      className={metric.highlight && metric.value > 0 ? 'text-destructive' : ''}
                    />
                  </p>
                </div>
              </div>
              <IconContainer size="md" className={cn(
                `${metric.bgColor}/8`,
                metric.highlight && metric.value > 0 && 'border border-destructive/20',
              )}>
                <Icon className={cn('size-4', `${metric.color}/60`)} />
              </IconContainer>
            </div>

            {/* Barra de proporção */}
            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mt-2.5 flex items-center gap-2")}>
              <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    `${metric.bgColor}/25`,
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-micro-badge tabular-nums text-muted-foreground/50 shrink-0">
                {pct}%
              </span>
            </div>
          </GlassPanel>
        );
      })}
    </div>
  );
}
