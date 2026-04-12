/**
 * ConflictBadge — Indicador visual de conflito de horario
 * ============================================================================
 * Badge flutuante que aparece sobre eventos sobrepostos no time grid.
 * ============================================================================
 */

import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConflictBadgeProps {
  className?: string;
}

export function ConflictBadge({ className }: ConflictBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded",
        "bg-warning/20 border border-warning/30",
        className,
      )}
      role="status"
      aria-label="Conflito de horario detectado"
    >
      <TriangleAlert className="size-2.5 text-warning" />
      <span className="text-[8px] font-bold text-warning uppercase tracking-wider">
        Conflito
      </span>
    </div>
  );
}
