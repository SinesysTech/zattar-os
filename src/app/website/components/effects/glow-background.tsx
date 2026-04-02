import { cn } from "@/lib/utils";

interface GlowBackgroundProps {
  /** Preset layout: 'hero' uses large offset orbs, 'section' uses smaller centered orbs */
  variant?: "hero" | "section";
  className?: string;
}

/**
 * Decorative background glow orbs used in hero sections and feature areas.
 * Always positioned absolutely — wrap parent in `relative overflow-hidden`.
 */
export function GlowBackground({ variant = "hero", className }: GlowBackgroundProps) {
  if (variant === "hero") {
    return (
      <div className={cn("absolute inset-0 z-0 pointer-events-none", className)}>
        <div className="absolute top-[-10%] right-[-10%] w-150 h-150 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-100 h-100 bg-primary-dim/10 rounded-full blur-[100px]" />
      </div>
    );
  }

  return (
    <div className={cn("absolute inset-0 z-0 pointer-events-none", className)}>
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-primary-dim/10 rounded-full blur-[100px]" />
    </div>
  );
}
