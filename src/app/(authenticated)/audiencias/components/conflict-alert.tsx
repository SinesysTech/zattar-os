/**
 * ConflictAlert — Visualizador de conflitos entre audiencias
 * ============================================================================
 * Detecta sobreposicoes de horario e carga excessiva.
 * Mostra timeline visual do conflito e sugestoes de resolucao.
 * ============================================================================
 */

"use client";

import { useMemo } from "react";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { format, parseISO, differenceInMinutes, areIntervalsOverlapping } from "date-fns";
import { cn } from "@/lib/utils";
import { GlassPanel } from '@/components/shared/glass-panel';
import { Text } from "@/components/ui/typography";
import type { Audiencia } from "../domain";

export interface ConflictAlertProps {
  audiencias: Audiencia[];
  /** Media diaria para comparar carga */
  dailyAverage?: number;
  className?: string;
}

interface Conflict {
  type: "overlap" | "overload";
  audiencias: Audiencia[];
  overlapMinutes?: number;
  message: string;
  suggestion?: string;
}

function detectConflicts(audiencias: Audiencia[], dailyAverage = 2.5): Conflict[] {
  const conflicts: Conflict[] = [];
  const sorted = [...audiencias].sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));

  // Detect overlaps
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];

      try {
        const overlaps = areIntervalsOverlapping(
          { start: parseISO(a.dataInicio), end: parseISO(a.dataFim) },
          { start: parseISO(b.dataInicio), end: parseISO(b.dataFim) },
        );

        if (overlaps) {
          const overlapStart = parseISO(b.dataInicio);
          const overlapEnd = parseISO(a.dataFim) < parseISO(b.dataFim)
            ? parseISO(a.dataFim)
            : parseISO(b.dataFim);
          const overlapMinutes = differenceInMinutes(overlapEnd, overlapStart);

          conflicts.push({
            type: "overlap",
            audiencias: [a, b],
            overlapMinutes: Math.max(0, overlapMinutes),
            message: `Sobreposição de ${Math.max(0, overlapMinutes)}min`,
            suggestion: a.responsavelId === b.responsavelId
              ? "Considere redesignar uma das audiências"
              : undefined,
          });
        }
      } catch {
        // skip invalid dates
      }
    }
  }

  // Detect overload
  if (sorted.length > dailyAverage * 1.5) {
    conflicts.push({
      type: "overload",
      audiencias: sorted,
      message: `${sorted.length} audiências (média: ${dailyAverage.toFixed(1)}/dia)`,
      suggestion: "Dia sobrecarregado. Considere redistribuir",
    });
  }

  return conflicts;
}

function TimelineBar({ audiencia, maxEnd, minStart }: { audiencia: Audiencia; maxEnd: number; minStart: number }) {
  const start = parseISO(audiencia.dataInicio).getTime();
  const end = parseISO(audiencia.dataFim).getTime();
  const range = maxEnd - minStart || 1;

  const left = ((start - minStart) / range) * 100;
  const width = Math.max(((end - start) / range) * 100, 4);

  return (
    <div className="relative h-5 group">
      <div
        className="absolute top-0.5 h-3.5 rounded bg-primary/20 border border-primary/15 transition-all duration-200 hover:bg-primary/30 cursor-default"
        style={{ left: `${left}%`, width: `${width}%`, minWidth: 20 }}
      >
        <span className={cn(/* design-system-escape: pr-1.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "absolute left-1.5 top-1/2 -translate-y-1/2 text-micro-badge text-foreground/75 truncate max-w-full pr-1.5 font-medium")}>
          {format(parseISO(audiencia.dataInicio), "HH:mm")}
        </span>
      </div>
    </div>
  );
}

export function ConflictAlert({ audiencias, dailyAverage = 2.5, className }: ConflictAlertProps) {
  const conflicts = useMemo(() => detectConflicts(audiencias, dailyAverage), [audiencias, dailyAverage]);

  if (conflicts.length === 0) return null;

  return (
    <GlassPanel depth={1} className={cn("overflow-hidden", className)}>
      {/* Red accent bar */}
      <div className="h-px bg-linear-to-r from-transparent via-destructive/25 to-transparent" />

      <div className={cn("inset-card-compact")}>
        <div className={cn("flex items-center inline-tight mb-3")}>
          <AlertTriangle className="size-3 text-destructive/50" />
          <Text variant="caption" as="span" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-muted-foreground/75")}>
            {conflicts.length} {conflicts.length === 1 ? "alerta" : "alertas"}
          </Text>
        </div>

        <div className={cn("stack-medium")}>
          {conflicts.map((conflict, i) => {
            const allAudiencias = conflict.audiencias;
            const times = allAudiencias.flatMap((a) => [
              parseISO(a.dataInicio).getTime(),
              parseISO(a.dataFim).getTime(),
            ]);
            const minTime = Math.min(...times);
            const maxTime = Math.max(...times);

            return (
              <div key={i} className={cn("stack-snug")}>
                <div className={cn("flex items-center inline-tight")}>
                  {conflict.type === "overlap" ? (
                    <Clock className="size-2.5 text-destructive/40" />
                  ) : (
                    <AlertTriangle className="size-2.5 text-warning/40" />
                  )}
                  <span className={cn(
                    /* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-micro-caption font-medium",
                    conflict.type === "overlap" ? "text-destructive/60" : "text-warning/60",
                  )}>
                    {conflict.message}
                  </span>
                </div>

                {/* Timeline visualization */}
                {conflict.type === "overlap" && (
                  <div className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "px-2 py-1.5 rounded-lg bg-border/5")}>
                    {allAudiencias.map((a) => (
                      <TimelineBar key={a.id} audiencia={a} minStart={minTime} maxEnd={maxTime} />
                    ))}
                    {conflict.overlapMinutes && conflict.overlapMinutes > 0 && (
                      <div className={cn("flex items-center inline-micro mt-1")}>
                        <div className="flex-1 h-px bg-destructive/15" />
                        <span className={cn(/* design-system-escape: px-1 padding direcional sem Inset equiv. */ "text-micro-badge text-destructive/50 tabular-nums px-1")}>
                          ▲ {conflict.overlapMinutes}min sobreposição
                        </span>
                        <div className="flex-1 h-px bg-destructive/15" />
                      </div>
                    )}
                  </div>
                )}

                {conflict.suggestion && (
                  <div className={cn("flex items-center inline-micro ml-4")}>
                    <ArrowRight className="size-2 text-muted-foreground/65" />
                    <span className="text-micro-caption text-muted-foreground/75 italic">{conflict.suggestion}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
}
