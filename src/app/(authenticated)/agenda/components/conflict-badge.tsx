/**
 * ConflictBadge — Indicador visual de conflito de horario
 * ============================================================================
 * Badge flutuante que aparece sobre eventos sobrepostos no time grid.
 * ============================================================================
 */

import { TriangleAlert } from "lucide-react";
import { Text } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export interface ConflictBadgeProps {
  className?: string;
}

export function ConflictBadge({ className }: ConflictBadgeProps) {
  return (
    <div
      className={cn(
        /* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "inline-flex items-center inline-micro px-1.5 py-0.5 rounded",
        "bg-warning/20 border border-warning/30",
        className,
      )}
      role="status"
      aria-label="Conflito de horario detectado"
    >
      <TriangleAlert className="size-2.5 text-warning" />
      <Text variant="overline" as="span" className={cn( "text-[8px] font-bold text-warning")}>
        Conflito
      </Text>
    </div>
  );
}
