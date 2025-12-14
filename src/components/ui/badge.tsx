import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Variantes visuais do Badge.
 *
 * @ai-context Use getSemanticBadgeVariant() de @/lib/design-system para determinar
 * a variante correta baseada no domínio (tribunal, status, etc).
 *
 * Variantes disponíveis:
 * - default: Cor primária do tema
 * - secondary: Cor secundária neutra
 * - destructive: Vermelho para erros/perigo
 * - outline: Apenas borda, sem fundo
 * - success: Verde para sucesso/ativo
 * - warning: Âmbar para alertas/pendente
 * - info: Azul para informações
 * - neutral: Cinza para estados neutros/arquivado
 * - accent: Laranja vibrante para destaque
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary [a&]:hover:bg-primary/20",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-red-500/15 text-red-700 dark:text-red-400 [a&]:hover:bg-red-500/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "text-foreground border-border [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        warning:
          "bg-amber-500/15 text-amber-700 dark:text-amber-400",
        info:
          "bg-blue-500/15 text-blue-700 dark:text-blue-400",
        neutral:
          "bg-slate-500/15 text-slate-700 dark:text-slate-400",
        accent:
          "bg-orange-500/15 text-orange-700 dark:text-orange-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
