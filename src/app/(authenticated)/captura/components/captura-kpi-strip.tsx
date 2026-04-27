'use client';

import { useMemo } from 'react';
import { Database, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { AnimatedNumber } from '@/app/(authenticated)/dashboard/widgets/primitives';

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

export function CapturaKpiStrip({ data }: CapturaKpiStripProps) {
  const pctAndamento = useMemo(
    () => (data.total > 0 ? Math.round((data.emAndamento / data.total) * 100) : 0),
    [data.emAndamento, data.total],
  );
  const pctFalhas = useMemo(
    () => (data.total > 0 ? Math.round((data.falhas / data.total) * 100) : 0),
    [data.falhas, data.total],
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Capturas */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Total Capturas
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={data.total} />
              </p>
            </div>
          </div>
          <IconContainer size="md" className="bg-primary/8">
            <Database className="size-4 text-primary/50" />
          </IconContainer>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/25 transition-all duration-500"
              style={{ width: data.total > 0 ? '100%' : '0%' }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">total</span>
        </div>
      </GlassPanel>

      {/* Taxa de Sucesso */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Taxa de Sucesso
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={data.taxaSucesso} />
              </p>
              <span className="text-[10px] text-muted-foreground/40">%</span>
            </div>
          </div>
          <IconContainer size="md" className="bg-success/8">
            <CheckCircle2 className="size-4 text-success/50" />
          </IconContainer>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-success/25 transition-all duration-500"
              style={{ width: `${data.taxaSucesso}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {data.sucesso} ok
          </span>
        </div>
      </GlassPanel>

      {/* Em Andamento */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Em Andamento
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={data.emAndamento} />
              </p>
            </div>
          </div>
          <IconContainer size="md" className="bg-info/8">
            <Loader2 className="size-4 text-info/50" />
          </IconContainer>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-info/25 transition-all duration-500"
              style={{ width: `${pctAndamento}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {pctAndamento}%
          </span>
        </div>
      </GlassPanel>

      {/* Falhas */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Falhas (7d)
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={data.falhas} />
              </p>
            </div>
          </div>
          <IconContainer size="md" className="bg-destructive/8">
            <AlertTriangle className="size-4 text-destructive/50" />
          </IconContainer>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-destructive/25 transition-all duration-500"
              style={{ width: `${pctFalhas}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {pctFalhas}%
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}
