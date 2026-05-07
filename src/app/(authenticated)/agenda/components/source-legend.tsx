/**
 * SourceLegend — Legenda de calendários com toggles de visibilidade
 * ============================================================================
 * Mostra cada fonte de eventos com cor, label e contagem, permitindo
 * ativar/desativar a exibição de cada fonte.
 * ============================================================================
 */

"use client";

import { Layers, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/shared/glass-panel";
import { SOURCE_CONFIGS, type AgendaSource } from "./mock-data";
import { Text } from '@/components/ui/typography';

export interface SourceLegendProps {
  /** Contagem de eventos por fonte */
  counts: Partial<Record<AgendaSource, number>>;
  /** Fontes atualmente ativas */
  activeSources: Set<AgendaSource>;
  onToggle: (source: AgendaSource) => void;
  className?: string;
}

const SOURCE_ORDER: AgendaSource[] = [
  "audiencias",
  "expedientes",
  "obrigacoes",
  "pericias",
  "prazos",
  "agenda",
];

function sourceColorToken(source: AgendaSource): { dot: string; border: string; bg: string } {
  const map: Record<AgendaSource, { dot: string; border: string; bg: string }> = {
    audiencias:  { dot: "bg-info",        border: "border-info",        bg: "bg-info/20" },
    expedientes: { dot: "bg-warning",     border: "border-warning",     bg: "bg-warning/20" },
    obrigacoes:  { dot: "bg-warning",     border: "border-warning",     bg: "bg-warning/20" },
    pericias:    { dot: "bg-primary",     border: "border-primary",     bg: "bg-primary/20" },
    prazos:      { dot: "bg-destructive", border: "border-destructive", bg: "bg-destructive/20" },
    agenda:      { dot: "bg-primary",     border: "border-primary",     bg: "bg-primary/20" },
  };
  return map[source];
}

export function SourceLegend({
  counts,
  activeSources,
  onToggle,
  className,
}: SourceLegendProps) {
  return (
    <GlassPanel className={cn("inset-card-compact", className)}>
      <div className={cn("flex items-center inline-tight mb-3")}>
        <Layers className="size-3.5 text-muted-foreground/55" />
        <Text variant="caption" weight="semibold" className="text-foreground">Calendários</Text>
      </div>
      <div className={cn("flex flex-col stack-snug")}>
        {SOURCE_ORDER.map((source) => {
          const cfg = SOURCE_CONFIGS[source];
          const colors = sourceColorToken(source);
          const active = activeSources.has(source);
          const count = counts[source] ?? 0;

          return (
            <label
              key={source}
              className={cn("flex items-center inline-tight-plus cursor-pointer group")}
              role="checkbox"
              aria-checked={active}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle(source); }}}
            >
              <div
                className={cn(
                  "size-3 rounded border-2 flex items-center justify-center transition-colors",
                  active ? cn(colors.border, colors.bg) : "border-border/30",
                )}
                onClick={() => onToggle(source)}
              >
                {active && <Check className={cn("size-2", colors.dot.replace("bg-", "text-"))} />}
              </div>
              <span
                className="text-[11px] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors flex-1"
                onClick={() => onToggle(source)}
              >
                {cfg.label}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground/35 tabular-nums">
                {count}
              </span>
            </label>
          );
        })}
      </div>
    </GlassPanel>
  );
}
