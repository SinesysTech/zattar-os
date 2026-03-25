import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

/**
 * Glassmorphic card with semi-transparent background and backdrop blur.
 * Uses the canonical glass-card CSS class from globals.css.
 */
export function GlassCard({ children, className, hover = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-8",
        hover && "purple-glow-hover cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
