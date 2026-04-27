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
    <GlassPanel className={cn(/* design-system-escape: px-5 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "px-5 py-3")}>
      <div className={cn(/* design-system-escape: gap-6 → migrar para <Inline gap="loose"> */ "flex items-center gap-6 overflow-x-auto")}>
        {/* Total */}
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 shrink-0")}>
          <FileSignature className="size-4 text-muted-foreground/55" />
          <div>
            <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/60 uppercase tracking-wider")}>
              Total
            </p>
            <p className={cn(/* design-system-escape: text-lg → migrar para <Text variant="body-lg">; font-bold → className de <Text>/<Heading> */ "font-display text-lg font-bold tabular-nums")}>
              <AnimatedNumber value={stats.total} />
            </p>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Taxa Conclusão */}
        <div className="shrink-0">
          <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/60 uppercase tracking-wider")}>
            Taxa Conclusão
          </p>
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
            <ProgressRing
              percent={stats.taxaConclusao}
              size={32}
              color="var(--success)"
            />
            <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; font-bold → className de <Text>/<Heading> */ "text-xs font-bold text-success/70")}>
              {stats.taxaConclusao}%
            </span>
          </div>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Tempo Médio */}
        <div className="shrink-0">
          <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/60 uppercase tracking-wider")}>
            Tempo Médio
          </p>
          <p className={cn(/* design-system-escape: text-base → migrar para <Text variant="body">; font-bold → className de <Text>/<Heading> */ "font-display text-base font-bold tabular-nums")}>
            {stats.tempoMedio}d
          </p>
          <p className="text-[9px] text-muted-foreground/55">para conclusão</p>
        </div>

        <div className="w-px h-8 bg-border/10 shrink-0" />

        {/* Tendência */}
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3 shrink-0")}>
          <div>
            <p className={cn(/* design-system-escape: tracking-wider sem token DS */ "text-[9px] text-muted-foreground/60 uppercase tracking-wider")}>
              Tendência 6m
            </p>
            <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; font-semibold → className de <Text>/<Heading> */ "text-xs font-semibold text-success/60")}>
              {trendDelta >= 0 ? "+" : ""}
              {trendDelta} este mês
            </p>
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
