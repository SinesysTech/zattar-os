import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        // Shadcn base variants
        default:     "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:   "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive: "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:     "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:       "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link:        "text-primary underline-offset-4 hover:underline",
        // Semantic status variants — solid tone by default
        success: "bg-success text-success-foreground [a]:hover:bg-success/80",
        warning: "bg-warning text-warning-foreground [a]:hover:bg-warning/80",
        info:    "bg-info text-info-foreground [a]:hover:bg-info/80",
        neutral: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        accent:  "bg-highlight text-highlight-foreground [a]:hover:bg-highlight/80",
      },
      tone: {
        solid: "",
        soft:  "",
      },
      size: {
        xs: "h-4 px-1.5 py-0 text-[10px]",
        sm: "",
        md: "h-6 px-3 py-0.5 text-sm",
      },
    },
    compoundVariants: [
      // tone=solid: destructive base is soft — solid overrides to filled
      { variant: "destructive", tone: "solid", className: "bg-destructive text-destructive-foreground dark:bg-destructive [a]:hover:bg-destructive/80" },
      // tone=soft: semantic variants override to light-bg + colored text
      { variant: "success",     tone: "soft", className: "bg-success/10  text-success  dark:bg-success/15  [a]:hover:bg-success/15"   },
      { variant: "warning",     tone: "soft", className: "bg-warning/15  text-warning  dark:bg-warning/15  [a]:hover:bg-warning/20"   },
      { variant: "info",        tone: "soft", className: "bg-info/10     text-info     dark:bg-info/15     [a]:hover:bg-info/15"      },
      { variant: "neutral",     tone: "soft", className: "bg-muted       text-muted-foreground               [a]:hover:bg-muted/80"   },
      { variant: "accent",      tone: "soft", className: "bg-highlight/10 text-highlight dark:bg-highlight/15 [a]:hover:bg-highlight/15" },
      { variant: "default",     tone: "soft", className: "bg-primary/10  text-primary  dark:bg-primary/15  [a]:hover:bg-primary/15"   },
      { variant: "secondary",   tone: "soft", className: "bg-muted/50    text-muted-foreground               [a]:hover:bg-muted/70"   },
    ],
    defaultVariants: {
      variant: "default",
      tone: "solid",
      size: "sm",
    },
  }
)

function Badge({
  className,
  variant = "default",
  tone = "solid",
  size = "sm",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, tone, size }), className)}
      {...props}
    />
  )
}

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>
export type BadgeSize = NonNullable<VariantProps<typeof badgeVariants>["size"]>

export { Badge, badgeVariants }
