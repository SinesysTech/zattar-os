"use client";

import { cn } from '@/lib/utils';
import { FileSignature } from "lucide-react";
import {
  GlassPanel,
  ProgressRing,
  AnimatedNumber,
  Sparkline,
} from "@/app/(authenticated)/dashboard/widgets/primitives";
import type { DocumentosStats } from '@/shared/assinatura-digital/services/documentos.service';
import { Text } from '@/components/ui/typography';

interface SignatureStatsStripProps {
  stats: DocumentosStats;
}

export function SignatureStatsStrip({ stats }: SignatureStatsStripProps) {
  const trendDelta =
    stats.trendMensal.length >= 2
      ? stats.trendMensal[stats.trendMensal.length - 1] -
        stats.trendMensal[stats.trendMensal.length - 2]
      : 0;

  return (
    <GlassPanel className={cn("px-5 py-3")}>
      <div className={cn("flex items-center inline-loose overflow-x-auto")}>
        {/* Total */}
        <div className={cn("flex items-center inline-tight shrink-0")}>
          <FileSignature className="size-4 text-muted-foreground/55" />
          <div>
            <p className={cn("text-[9px] text-muted-foreground/60 uppercase tracking-wider")}>
              Total
            </p>
            <p className={cn( "font-display text-body-lg font-bold tabular-nums")}>
              <AnimatedNumber value={stats.total} />
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Taxa Conclusão */}
        <div className="shrink-0">
          <p className={cn("text-[9px] text-muted-foreground/60 uppercase tracking-wider")}>
            Taxa Conclusão
          </p>
          <div className={cn("flex items-center inline-tight")}>
            <ProgressRing
              percent={stats.taxaConclusao}
              size={32}
              color="var(--success)"
            />
            <Text variant="caption" className="font-bold text-success/70">
              {stats.taxaConclusao}%
            </Text>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Tempo Médio */}
        <div className="shrink-0">
          <p className={cn("text-[9px] text-muted-foreground/60 uppercase tracking-wider")}>
            Tempo Médio
          </p>
          <p className={cn( "font-display text-body font-bold tabular-nums")}>
            {stats.tempoMedio}d
          </p>
          <p className="text-[9px] text-muted-foreground/55">para conclusão</p>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Tendência */}
        <div className={cn("flex items-center inline-medium shrink-0")}>
          <div>
            <p className={cn("text-[9px] text-muted-foreground/60 uppercase tracking-wider")}>
              Tendência 6m
            </p>
            <Text variant="caption" className="font-semibold text-success/60">
              {trendDelta >= 0 ? "+" : ""}
              {trendDelta} este mês
            </Text>
          </div>
          <Sparkline
            data={stats.trendMensal}
            width={60}
            height={20}
            color="var(--success)"
          />
        </div>
      </div>
    </GlassPanel>
  );
}
