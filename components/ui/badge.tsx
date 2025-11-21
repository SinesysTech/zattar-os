import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/app/_lib/utils";

type BadgeTone = "primary" | "neutral" | "info" | "success" | "warning" | "danger" | "muted";
type BadgeAppearance = "solid" | "soft" | "outline";
type LegacyVariant = "default" | "secondary" | "destructive" | "outline";

const toneStyles: Record<
  BadgeTone,
  {
    solid: string;
    soft: string;
    outline: string;
  }
> = {
  primary: {
    solid: "bg-primary text-primary-foreground border-primary/70 shadow-sm",
    soft: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-50",
    outline: "border-primary/60 text-primary bg-primary/5 dark:border-primary/50 dark:text-primary-100 dark:bg-primary/10",
  },
  neutral: {
    solid: "bg-muted text-foreground border-muted-foreground/10",
    soft: "bg-muted/70 text-foreground border-muted-foreground/10 dark:bg-muted/40 dark:text-muted-foreground",
    outline: "border-border text-foreground bg-transparent",
  },
  info: {
    solid: "bg-sky-600 text-sky-50 border-sky-700 shadow-sm dark:bg-sky-500 dark:border-sky-500",
    soft: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-100 dark:border-sky-800",
    outline: "border-sky-400 text-sky-700 bg-sky-50 dark:border-sky-500 dark:text-sky-100 dark:bg-sky-500/10",
  },
  success: {
    solid: "bg-emerald-600 text-emerald-50 border-emerald-700 shadow-sm dark:bg-emerald-500 dark:border-emerald-500",
    soft: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-800",
    outline: "border-emerald-400 text-emerald-700 bg-emerald-50 dark:border-emerald-500 dark:text-emerald-100 dark:bg-emerald-500/10",
  },
  warning: {
    solid: "bg-amber-500 text-amber-950 border-amber-600 shadow-sm dark:bg-amber-500 dark:text-amber-50 dark:border-amber-500",
    soft: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800",
    outline: "border-amber-400 text-amber-700 bg-amber-50 dark:border-amber-500 dark:text-amber-100 dark:bg-amber-500/10",
  },
  danger: {
    solid: "bg-destructive text-destructive-foreground border-destructive/70 shadow-sm",
    soft: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-100 dark:border-red-800",
    outline: "border-red-400 text-red-700 bg-red-50 dark:border-red-500 dark:text-red-100 dark:bg-red-500/10",
  },
  muted: {
    solid: "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700",
    soft: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-200 dark:border-slate-800",
    outline: "border-slate-300 text-slate-700 bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:bg-slate-800/40",
  },
};

const badgeVariants = cva(
  "inline-flex items-center gap-1 justify-center rounded-full border px-2 py-0.5 text-xs font-medium leading-normal transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 [&>svg]:size-3",
  {
    variants: {
      variant: {
        solid: "shadow-[0_1px_1px_rgba(0,0,0,0.05)]",
        soft: "",
        outline: "bg-transparent",
      },
      tone: {
        primary: "",
        neutral: "",
        info: "",
        success: "",
        warning: "",
        danger: "",
        muted: "",
      },
    },
    compoundVariants: Object.entries(toneStyles).flatMap(([tone, styles]) => [
      { tone, variant: "solid", class: styles.solid },
      { tone, variant: "soft", class: styles.soft },
      { tone, variant: "outline", class: styles.outline },
    ]),
    defaultVariants: {
      variant: "soft",
      tone: "neutral",
    },
  },
);

type BadgeVariants = VariantProps<typeof badgeVariants>;

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeAppearance | LegacyVariant;
  tone?: BadgeTone;
}

function normalizeTone(variant: BadgeProps["variant"], tone: BadgeProps["tone"]): BadgeVariants["tone"] {
  if (tone) return tone;
  const legacyTone: Record<LegacyVariant, BadgeTone> = {
    default: "primary",
    secondary: "neutral",
    destructive: "danger",
    outline: "neutral",
  };
  if (variant && variant in legacyTone) {
    return legacyTone[variant as LegacyVariant];
  }
  return "neutral";
}

function normalizeVariant(variant: BadgeProps["variant"]): BadgeVariants["variant"] {
  if (variant === "solid" || variant === "soft" || variant === "outline") {
    return variant;
  }
  if (variant === "outline") return "outline";
  if (variant === "default" || variant === "destructive") return "solid";
  return "soft";
}

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  const resolvedTone = normalizeTone(variant, tone);
  const resolvedVariant = normalizeVariant(variant);

  return <div className={cn(badgeVariants({ variant: resolvedVariant, tone: resolvedTone }), className)} {...props} />;
}

export { Badge, badgeVariants };
