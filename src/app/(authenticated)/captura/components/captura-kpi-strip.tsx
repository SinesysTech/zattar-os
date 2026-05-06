'use client';

import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { Database, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { AnimatedNumber } from '@/app/(authenticated)/dashboard/widgets/primitives';
import { Text } from '@/components/ui/typography';

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
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 lg:grid-cols-4 gap-3")}>
      {/* Total Capturas */}
      <GlassPanel className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "px-4 py-3")}>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-start justify-between gap-2")}>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground/75 uppercase tracking-wider")}>
              Total Capturas
            </p>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-baseline gap-1.5 mt-1")}>
              <Text variant="kpi-value">
                <AnimatedNumber value={data.total} />
              </Text>
            </div>
          </div>
          <IconContainer size="md" className="bg-primary/8">
            <Database className="size-4 text-primary/70" />
          </IconContainer>
        </div>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mt-2.5 flex items-center gap-2")}>
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/25 transition-all duration-500"
              style={{ width: data.total > 0 ? '100%' : '0%' }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/70 shrink-0">total</span>
        </div>
      </GlassPanel>

      {/* Taxa de Sucesso */}
      <GlassPanel className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "px-4 py-3")}>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-start justify-between gap-2")}>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground/75 uppercase tracking-wider")}>
              Taxa de Sucesso
            </p>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-baseline gap-1.5 mt-1")}>
              <Text variant="kpi-value">
                <AnimatedNumber value={data.taxaSucesso} />
              </Text>
              <span className="text-[10px] text-muted-foreground/65">%</span>
            </div>
          </div>
          <IconContainer size="md" className="bg-success/8">
            <CheckCircle2 className="size-4 text-success/70" />
          </IconContainer>
        </div>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mt-2.5 flex items-center gap-2")}>
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-success/25 transition-all duration-500"
              style={{ width: `${data.taxaSucesso}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/70 shrink-0">
            {data.sucesso} ok
          </span>
        </div>
      </GlassPanel>

      {/* Em Andamento */}
      <GlassPanel className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "px-4 py-3")}>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-start justify-between gap-2")}>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground/75 uppercase tracking-wider")}>
              Em Andamento
            </p>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-baseline gap-1.5 mt-1")}>
              <Text variant="kpi-value">
                <AnimatedNumber value={data.emAndamento} />
              </Text>
            </div>
          </div>
          <IconContainer size="md" className="bg-info/8">
            <Loader2 className="size-4 text-info/70" />
          </IconContainer>
        </div>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mt-2.5 flex items-center gap-2")}>
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-info/25 transition-all duration-500"
              style={{ width: `${pctAndamento}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/70 shrink-0">
            {pctAndamento}%
          </span>
        </div>
      </GlassPanel>

      {/* Falhas */}
      <GlassPanel className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "px-4 py-3")}>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-start justify-between gap-2")}>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground/75 uppercase tracking-wider")}>
              Falhas (7d)
            </p>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-baseline gap-1.5 mt-1")}>
              <Text variant="kpi-value">
                <AnimatedNumber value={data.falhas} />
              </Text>
            </div>
          </div>
          <IconContainer size="md" className="bg-destructive/8">
            <AlertTriangle className="size-4 text-destructive/50" />
          </IconContainer>
        </div>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mt-2.5 flex items-center gap-2")}>
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-destructive/25 transition-all duration-500"
              style={{ width: `${pctFalhas}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/70 shrink-0">
            {pctFalhas}%
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}
