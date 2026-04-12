/**
 * PrepProgress — Barra de progresso de preparacao
 * ============================================================================
 * Exibe o percentual de preparo de um evento com barra visual e label.
 * Cores semanticas: verde (>=80%), amarelo (>=40%), vermelho (<40%).
 * ============================================================================
 */

import { cn } from "@/lib/utils";

export interface PrepProgressProps {
  percent: number;
  /** Label opcional a esquerda */
  label?: string;
  /** Texto de itens pendentes */
  missing?: string;
  /** Tamanho: sm (inline), md (card) */
  size?: "sm" | "md";
  className?: string;
}

function progressColor(pct: number) {
  if (pct >= 80) return { bar: "bg-success", text: "text-success" };
  if (pct >= 40) return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-destructive", text: "text-destructive" };
}

export function PrepProgress({
  percent,
  label,
  missing,
  size = "sm",
  className,
}: PrepProgressProps) {
  const colors = progressColor(percent);

  return (
    <div className={cn("space-y-1", className)}>
      {/* Header: label + percentage */}
      {(label || size === "md") && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-[11px] text-muted-foreground/70 truncate">{label}</span>
          )}
          <span className={cn("text-[10px] font-mono font-semibold tabular-nums", colors.text)}>
            {percent}%
          </span>
        </div>
      )}

      {/* Bar */}
      <div className="flex items-center gap-2">
        {!label && size === "sm" && (
          <span className="text-[9px] text-muted-foreground/50">Preparo:</span>
        )}
        <div className="flex-1 h-1 rounded-full bg-muted/20 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", colors.bar)}
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
        {!label && size === "sm" && (
          <span className={cn("text-[9px] font-mono font-semibold tabular-nums", colors.text)}>
            {percent}%
          </span>
        )}
      </div>

      {/* Missing items */}
      {missing && (
        <p className="text-[9px] text-muted-foreground/40">Falta: {missing}</p>
      )}
    </div>
  );
}
