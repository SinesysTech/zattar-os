/**
 * DeadlineSidebar — Widget lateral de prazos próximos
 * ============================================================================
 * Mostra countdown visual para prazos fatais e regulares com cores
 * de urgência escalantes (vermelho -> amarelo -> verde).
 * ============================================================================
 */

import { AlarmClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassPanel } from "@/components/shared/glass-panel";
import type { Deadline } from "./mock-data";
import { Text } from '@/components/ui/typography';

export interface DeadlineSidebarProps {
  deadlines: Deadline[];
  className?: string;
}

function urgencyClasses(daysLeft: number, fatal: boolean) {
  if (daysLeft <= 1 || fatal) {
    return {
      bg: "bg-destructive/[0.06]",
      border: "border-destructive/10",
      bar: "bg-destructive",
      label: "text-destructive",
    };
  }
  if (daysLeft <= 3) {
    return {
      bg: "bg-warning/[0.04]",
      border: "border-warning/8",
      bar: "bg-warning",
      label: "text-warning",
    };
  }
  return {
    bg: "bg-warning/[0.03]",
    border: "border-warning/6",
    bar: "bg-warning/70",
    label: "text-warning/70",
  };
}

function daysLabel(daysLeft: number): string {
  if (daysLeft <= 0) return "HOJE";
  if (daysLeft === 1) return "AMANHÃ";
  return `${daysLeft} DIAS`;
}

export function DeadlineSidebar({ deadlines, className }: DeadlineSidebarProps) {
  if (deadlines.length === 0) return null;

  return (
    <GlassPanel className={cn("inset-card-compact", className)}>
      <div className={cn("flex items-center inline-tight mb-3")}>
        <AlarmClock className="size-3.5 text-destructive" />
        <Text variant="caption" className="font-semibold text-foreground">Prazos Próximos</Text>
      </div>
      <div className={cn("flex flex-col stack-tight")}>
        {deadlines.map((dl) => {
          const u = urgencyClasses(dl.daysLeft, dl.fatal);
          return (
            <div
              key={dl.id}
              className={cn(
                /* design-system-escape: p-2 → usar <Inset> */ "flex items-center inline-tight p-2 rounded-lg border",
                u.bg,
                u.border,
              )}
            >
              <div className={cn("w-1 h-8 rounded-full shrink-0", u.bar)} />
              <div className="min-w-0">
                <div className={cn( "text-[10px] font-mono font-semibold", u.label)}>
                  {daysLabel(dl.daysLeft)}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {dl.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}
