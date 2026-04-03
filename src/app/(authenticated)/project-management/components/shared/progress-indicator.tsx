import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

function getIndicatorColor(value: number): string {
  if (value >= 100) return "bg-green-500";
  if (value >= 70) return "bg-blue-500";
  if (value >= 40) return "bg-yellow-500";
  return "bg-slate-400";
}

export function ProgressIndicator({
  value,
  showLabel = true,
  size = "sm",
  className,
}: ProgressIndicatorProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress
        value={clamped}
        className={cn("flex-1", size === "sm" ? "h-2" : "h-3")}
        indicatorColor={getIndicatorColor(clamped)}
      />
      {showLabel && (
        <span className="text-muted-foreground text-sm tabular-nums">
          {clamped}%
        </span>
      )}
    </div>
  );
}
