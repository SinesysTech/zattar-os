import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

type BadgeTone = "soft" | "solid";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      tone: {
        soft: "",
        solid: "",
      },
      variant: {
        default: "",
        secondary: "",
        warning: "",
        info: "",
        success: "",
        destructive: "",
        outline: "ring-1 ring-inset ring-border/40 text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        neutral: "",
        accent: "",
      },
    },
    // Compound variants — TODAS as classes usam tokens semânticos do design system.
    // Light/dark mode são tratados automaticamente pelos tokens em globals.css.
    compoundVariants: [
      // ─── Soft (low intensity) ────────────────────────────────────────────
      {
        tone: "soft",
        variant: "default",
        className: "bg-primary/15 text-primary",
      },
      {
        tone: "soft",
        variant: "secondary",
        className: "bg-muted text-muted-foreground",
      },
      {
        tone: "soft",
        variant: "success",
        className: "bg-success/15 text-success",
      },
      {
        tone: "soft",
        variant: "info",
        className: "bg-info/15 text-info",
      },
      {
        tone: "soft",
        variant: "warning",
        className: "bg-warning/15 text-warning",
      },
      {
        tone: "soft",
        variant: "destructive",
        className: "bg-destructive/15 text-destructive",
      },
      {
        tone: "soft",
        variant: "neutral",
        className: "bg-muted/60 text-muted-foreground",
      },
      {
        tone: "soft",
        variant: "accent",
        className: "bg-accent text-accent-foreground",
      },

      // ─── Solid (high intensity) ──────────────────────────────────────────
      {
        tone: "solid",
        variant: "default",
        className: "bg-primary text-primary-foreground",
      },
      {
        tone: "solid",
        variant: "secondary",
        className: "bg-secondary text-secondary-foreground",
      },
      {
        tone: "solid",
        variant: "success",
        className: "bg-success text-success-foreground",
      },
      {
        tone: "solid",
        variant: "info",
        className: "bg-info text-info-foreground",
      },
      {
        tone: "solid",
        variant: "warning",
        className: "bg-warning text-warning-foreground",
      },
      {
        tone: "solid",
        variant: "destructive",
        className: "bg-destructive text-destructive-foreground",
      },
      {
        tone: "solid",
        variant: "neutral",
        className: "bg-foreground text-background",
      },
      {
        tone: "solid",
        variant: "accent",
        className: "bg-accent text-accent-foreground",
      },
    ],
    defaultVariants: {
      tone: "solid",
      variant: "default",
    }
  }
);

function Badge({
  className,
  variant,
  tone,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> &
  { tone?: BadgeTone; asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant, tone }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
export type { BadgeTone };
