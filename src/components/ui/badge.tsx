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
    compoundVariants: [
      // Soft (secondary style without outline)
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
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      },
      {
        tone: "soft",
        variant: "info",
        className: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      },
      {
        tone: "soft",
        variant: "warning",
        className: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
      },
      {
        tone: "soft",
        variant: "destructive",
        className: "bg-red-500/15 text-red-700 dark:text-red-400",
      },
      {
        tone: "soft",
        variant: "neutral",
        className: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
      },
      {
        tone: "soft",
        variant: "accent",
        className: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
      },

      // Solid (for primary states)
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
        className: "bg-emerald-600 text-white dark:bg-emerald-500",
      },
      {
        tone: "solid",
        variant: "info",
        className: "bg-sky-600 text-white dark:bg-sky-500",
      },
      {
        tone: "solid",
        variant: "warning",
        className: "bg-orange-600 text-white dark:bg-orange-500",
      },
      {
        tone: "solid",
        variant: "destructive",
        className: "bg-red-600 text-white dark:bg-red-500",
      },
      {
        tone: "solid",
        variant: "neutral",
        className: "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900",
      },
      {
        tone: "solid",
        variant: "accent",
        className: "bg-violet-600 text-white dark:bg-violet-500",
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
