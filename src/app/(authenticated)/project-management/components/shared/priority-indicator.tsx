import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  AlertTriangle,
} from "lucide-react";
import {
  PRIORIDADE_LABELS,
  type Prioridade,
} from "../../domain";
import { cn } from "@/lib/utils";
import { getSemanticBadgeVariant, type BadgeVisualVariant } from "@/lib/design-system";

const PRIORIDADE_ICONS: Record<Prioridade, React.ComponentType<{ className?: string }>> = {
  baixa: ArrowDown,
  media: ArrowRight,
  alta: ArrowUp,
  urgente: AlertTriangle,
};

/** Maps semantic badge variants to text color classes for non-badge usage */
const VARIANT_TEXT_COLORS: Record<BadgeVisualVariant, string> = {
  neutral: "text-muted-foreground",
  info: "text-info-foreground",
  success: "text-success-foreground",
  warning: "text-warning-foreground",
  destructive: "text-destructive",
  accent: "text-accent-foreground",
  secondary: "text-secondary-foreground",
  outline: "text-foreground",
  default: "text-foreground",
};

interface PriorityIndicatorProps {
  prioridade: Prioridade;
  showLabel?: boolean;
  className?: string;
}

export function PriorityIndicator({
  prioridade,
  showLabel = true,
  className,
}: PriorityIndicatorProps) {
  const Icon = PRIORIDADE_ICONS[prioridade];
  const variant = getSemanticBadgeVariant("priority", prioridade);
  const color = VARIANT_TEXT_COLORS[variant] ?? "text-foreground";

  return (
    <span className={cn("inline-flex items-center gap-1", color, className)}>
      <Icon className="size-4" />
      {showLabel && (
        <span className="text-sm">{PRIORIDADE_LABELS[prioridade]}</span>
      )}
    </span>
  );
}
