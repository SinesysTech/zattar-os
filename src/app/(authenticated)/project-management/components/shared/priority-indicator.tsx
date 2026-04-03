import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  AlertTriangle,
} from "lucide-react";
import {
  PRIORIDADE_LABELS,
  PRIORIDADE_COLORS,
  type Prioridade,
} from "../../lib/domain";
import { cn } from "@/lib/utils";

const PRIORIDADE_ICONS: Record<Prioridade, React.ComponentType<{ className?: string }>> = {
  baixa: ArrowDown,
  media: ArrowRight,
  alta: ArrowUp,
  urgente: AlertTriangle,
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
  const color = PRIORIDADE_COLORS[prioridade];

  return (
    <span className={cn("inline-flex items-center gap-1", color, className)}>
      <Icon className="size-4" />
      {showLabel && (
        <span className="text-sm">{PRIORIDADE_LABELS[prioridade]}</span>
      )}
    </span>
  );
}
