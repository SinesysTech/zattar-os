"use client";

interface ResultRowProps {
  label: string;
  value: string;
  dimmed?: boolean;
  negative?: boolean;
}

export function ResultRow({
  label,
  value,
  dimmed = false,
  negative = false,
}: ResultRowProps) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span
        className={[
          "font-mono font-bold tabular-nums text-sm",
          dimmed
            ? "text-muted-foreground/30"
            : negative
              ? "text-portal-danger"
              : "text-foreground",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
