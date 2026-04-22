/**
 * MarketingCard — card sólido para seções de marketing do website público.
 * ============================================================================
 * Criado em resposta ao bug estrutural do GlassPanel depth=2 em páginas
 * marketing:
 *
 *  - GlassPanel aplica `bg-transparent` como classe Tailwind utility, que
 *    ganha cascade sobre os overrides em @layer base → cards ficam com
 *    background transparente e captam luz das imagens atrás (efeito branco
 *    pálido quando backdrop-blur tira brilho da imagem);
 *
 *  - .website-root-scale é adicionada via useEffect (client-only) pelo
 *    WebsiteScaleProvider → em SSR não existe, overrides escopados não se
 *    aplicam no primeiro paint.
 *
 * Este componente aplica classes Tailwind diretas no JSX, que sempre ganham
 * cascade, e usa apenas tokens semânticos do DS (--primary, --primary-dim,
 * --surface-container) respeitando o Glass Briefing.
 *
 * Variantes:
 *  - `solid` (default): card sólido escuro com borda primary sutil, ideal
 *    para overlays sobre imagens claras.
 *  - `glass`: versão translúcida com backdrop-blur, para fundos homogêneos.
 * ============================================================================
 */

import * as React from "react";

import { cn } from "@/lib/utils";

export interface MarketingCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variante visual:
   * - solid: fundo sólido escuro (use sobre imagens ou contextos com luz variável)
   * - glass: fundo translúcido com blur (use sobre fundos escuros homogêneos)
   * - primary: card de destaque com tint primary (use para CTA em bento grids)
   */
  variant?: "solid" | "glass" | "primary";
  /** Tamanho do padding interno. Default: md. */
  padding?: "sm" | "md" | "lg";
}

const PADDING = {
  sm: "p-5",
  md: "p-6 md:p-7",
  lg: "p-7 md:p-8 lg:p-10",
} as const;

const VARIANT = {
  solid:
    // Fundo sólido escuro (~95% opaco) com tint primary sutil. O tint vem
    // do primary-dim (cor da logo) para reforçar identidade.
    "bg-[color-mix(in_oklch,var(--surface-container)_94%,var(--primary-dim)_6%)] " +
    "border border-[color-mix(in_oklch,var(--primary)_28%,transparent)] " +
    "shadow-[0_16px_40px_rgba(0,0,0,0.55),0_2px_0_color-mix(in_oklch,var(--primary)_10%,transparent)_inset] " +
    "backdrop-blur-sm",
  glass:
    "bg-[color-mix(in_oklch,var(--surface-container)_65%,transparent)] " +
    "border border-[color-mix(in_oklch,var(--primary)_18%,transparent)] " +
    "shadow-[0_8px_28px_rgba(0,0,0,0.4)] " +
    "backdrop-blur-xl backdrop-saturate-150",
  primary:
    // Card de destaque — fundo primary-dim escurecido para dar ênfase em
    // bento grids. Combina com text-white no conteúdo para contraste alto.
    "bg-[color-mix(in_oklch,var(--primary-dim)_85%,black_15%)] " +
    "border border-[color-mix(in_oklch,var(--primary)_30%,transparent)] " +
    "shadow-[0_16px_40px_color-mix(in_oklch,var(--primary-dim)_25%,transparent),inset_0_1px_0_color-mix(in_oklch,white_8%,transparent)] " +
    "hover:bg-[color-mix(in_oklch,var(--primary-dim)_90%,black_10%)]",
} as const;

export function MarketingCard({
  variant = "solid",
  padding = "md",
  className,
  children,
  ...rest
}: MarketingCardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-2xl md:rounded-3xl transition-all duration-300",
        PADDING[padding],
        VARIANT[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
