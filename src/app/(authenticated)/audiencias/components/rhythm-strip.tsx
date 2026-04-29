/**
 * RhythmStrip — Heatmap de carga de audiências (sidebar)
 * ============================================================================
 * Mostra um CalendarHeatmap com a distribuição de audiências nas últimas
 * 5 semanas, permitindo identificar padrões de sobrecarga.
 * ============================================================================
 */

'use client';

import { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { parseISO, startOfWeek, differenceInDays, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { CalendarHeatmap } from '@/app/(authenticated)/dashboard/widgets/primitives';
import { Text } from '@/components/ui/typography';
import type { Audiencia } from '../domain';

// ─── Types ────────────────────────────────────────────────────────────────

export interface RhythmStripProps {
  audiencias: Audiencia[];
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────

export function RhythmStrip({ audiencias, className }: RhythmStripProps) {
  const heatmapData = useMemo(() => {
    // Build 5x7 = 35 cells (5 weeks, 7 days each)
    const now = new Date();
    const weekStart = startOfWeek(subWeeks(now, 4), { locale: ptBR, weekStartsOn: 1 });
    const data = new Array(35).fill(0);

    audiencias.forEach((a) => {
      try {
        const d = parseISO(a.dataInicio);
        const dayOffset = differenceInDays(d, weekStart);
        if (dayOffset >= 0 && dayOffset < 35) {
          data[dayOffset]++;
        }
      } catch {
        // skip invalid dates
      }
    });

    return data;
  }, [audiencias]);

  const maxInDay = Math.max(...heatmapData, 1);
  const hasOverload = maxInDay >= 4;

  return (
    <GlassPanel className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ 'p-4', className)}>
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 mb-3")}>
        <Zap className="size-3 text-primary/65" />
        <Text variant="caption" as="span" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-muted-foreground/60")}>Ritmo de audiências</Text>
        {hasOverload && (
          <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; px-1.5 padding direcional sem Inset equiv. */ "text-micro-badge font-semibold px-1.5 py-px rounded-full bg-warning/10 text-warning ml-auto")}>
            Pico: {maxInDay}/dia
          </span>
        )}
      </div>
      <CalendarHeatmap data={heatmapData} colorScale={hasOverload ? 'warning' : 'primary'} />
      <div className="flex items-center justify-between mt-2">
        <span className="text-micro-badge text-muted-foreground/65">Menos</span>
        <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex gap-0.5")}>
          {['bg-border/10', 'bg-primary/15', 'bg-primary/30', 'bg-primary/50', 'bg-primary/80'].map((c, i) => (
            <div key={i} className={cn('size-2.5 rounded-xs', c)} />
          ))}
        </div>
        <span className="text-micro-badge text-muted-foreground/65">Mais</span>
      </div>
    </GlassPanel>
  );
}
