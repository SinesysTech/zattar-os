import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EditorialHeaderProps {
  kicker: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Portal page editorial header — kicker + display title + optional description + action buttons.
 * Used at the top of every portal page (Dashboard, Financeiro, Agendamentos, etc.).
 */
export function EditorialHeader({
  kicker,
  title,
  description,
  actions,
  className,
}: EditorialHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6",
        className
      )}
    >
      <div className="max-w-2xl">
        <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase block mb-2">
          {kicker}
        </span>
        <h2 className="text-5xl font-extrabold font-headline tracking-tighter leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-on-surface-variant text-lg mt-4 max-w-lg">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-4 shrink-0">{actions}</div>}
    </div>
  );
}
