/**
 * LoadHeatmap — Distribuicao e carga de audiencias
 * ============================================================================
 * Painel lateral com:
 * - Distribuicao por tipo de audiencia (horizontal bars)
 * - Carga por advogado/responsavel (barras + contagem)
 * ============================================================================
 */

"use client";

import { useMemo } from "react";
import { BarChart3, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from '@/components/shared/glass-panel';
import { Text } from "@/components/ui/typography";
import type { Audiencia } from "../domain";

export interface LoadHeatmapProps {
  audiencias: Audiencia[];
  /** Map de responsavelId -> nome */
  responsavelNomes?: Map<number, string>;
  className?: string;
}

interface TypeDistribution {
  tipo: string;
  count: number;
  percent: number;
}

interface ResponsavelLoad {
  id: number;
  nome: string;
  count: number;
  percent: number;
}

export function LoadHeatmap({ audiencias, responsavelNomes, className }: LoadHeatmapProps) {
  // Type distribution
  const typeDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    audiencias.forEach((a) => {
      const tipo = a.tipoDescricao || "Não definido";
      counts.set(tipo, (counts.get(tipo) || 0) + 1);
    });

    const total = audiencias.length || 1;
    return Array.from(counts.entries())
      .map(([tipo, count]): TypeDistribution => ({
        tipo,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [audiencias]);

  // Responsavel load
  const responsavelLoad = useMemo(() => {
    const counts = new Map<number, number>();
    audiencias.forEach((a) => {
      if (a.responsavelId) {
        counts.set(a.responsavelId, (counts.get(a.responsavelId) || 0) + 1);
      }
    });

    const maxCount = Math.max(...Array.from(counts.values()), 1);
    return Array.from(counts.entries())
      .map(([id, count]): ResponsavelLoad => ({
        id,
        nome: responsavelNomes?.get(id) || `#${id}`,
        count,
        percent: Math.round((count / maxCount) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [audiencias, responsavelNomes]);

  const semResponsavel = audiencias.filter((a) => !a.responsavelId).length;

  return (
    <div className={cn("stack-default", className)}>
      {/* Type Distribution */}
      <GlassPanel className={cn("inset-card-compact")}>
        <div className={cn("flex items-center inline-tight mb-3")}>
          <BarChart3 className="size-3 text-primary/65" />
          <Text variant="caption" as="span" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-muted-foreground/60")}>Distribuição por tipo</Text>
          <span className="text-micro-caption tabular-nums text-muted-foreground/60 ml-auto">{audiencias.length} total</span>
        </div>

        <div className={cn("stack-tight")}>
          {typeDistribution.map((item) => (
            <div key={item.tipo}>
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="text-micro-caption text-foreground/70 truncate max-w-[60%]">{item.tipo}</span>
                <div className={cn("flex items-baseline inline-snug")}>
                  <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-micro-caption font-bold tabular-nums")}>{item.count}</span>
                  <span className="text-micro-badge text-muted-foreground/55 tabular-nums">{item.percent}%</span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-border/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/30 transition-all duration-700"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Responsavel Load */}
      <GlassPanel className={cn("inset-card-compact")}>
        <div className={cn("flex items-center inline-tight mb-3")}>
          <Users className="size-3 text-primary/65" />
          <Text variant="caption" as="span" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-muted-foreground/60")}>Carga por advogado</Text>
        </div>

        <div className={cn("stack-tight")}>
          {responsavelLoad.map((item) => (
            <div key={item.id}>
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="text-micro-caption text-foreground/70 truncate max-w-[60%]">{item.nome}</span>
                <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-micro-caption font-bold tabular-nums")}>{item.count}</span>
              </div>
              <div className="h-1 rounded-full bg-border/8 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    item.percent > 80 ? "bg-destructive/40" : item.percent > 50 ? "bg-warning/40" : "bg-success/40",
                  )}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}

          {semResponsavel > 0 && (
            <div className={cn(/* design-system-escape: pt-1 padding direcional sem Inset equiv. */ "flex items-center justify-between pt-1 border-t border-border/8")}>
              <span className="text-micro-caption text-warning/60">Sem responsável</span>
              <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "text-micro-caption font-bold tabular-nums text-warning/60")}>{semResponsavel}</span>
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
