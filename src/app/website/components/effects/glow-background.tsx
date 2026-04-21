import { cn } from "@/lib/utils";

interface GlowBackgroundProps {
  /**
   * Preset layout:
   * - 'hero': 2 orbs grandes em cantos opostos (full-bleed)
   * - 'section': 2 orbs médios laterais (ambient glow em seção)
   * - 'accent-top-right': 1 orb compacto offset no topo-direita (decoração pontual)
   */
  variant?: "hero" | "section" | "accent-top-right";
  className?: string;
}

/**
 * Decorative background glow orbs used in hero sections and feature areas.
 * Always positioned absolutely — wrap parent in `relative overflow-hidden`.
 *
 * Use esta API em vez de criar orbs inline (`absolute … blur-3xl bg-primary/X`)
 * para manter o efeito centralizado no DS.
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

  if (variant === "accent-top-right") {
    return (
      <div className={cn("absolute inset-0 z-0 pointer-events-none", className)}>
        <div className="absolute -top-10 -right-10 w-32 md:w-48 h-32 md:h-48 bg-primary/20 rounded-full blur-3xl" />
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
