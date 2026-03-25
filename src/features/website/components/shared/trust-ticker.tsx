import { cn } from "@/lib/utils";

interface TrustTickerProps {
  /** Labels to display (e.g. company/partner names) */
  items: string[];
  /** Optional heading above the ticker */
  heading?: string;
  className?: string;
}

/**
 * Grayscale social-proof ticker — displays partner/certification names
 * in a low-opacity row that fades in on hover.
 */
export function TrustTicker({ items, heading, className }: TrustTickerProps) {
  return (
    <div className={cn("py-12", className)}>
      {heading && (
        <p className="text-center text-xs font-bold tracking-[0.25em] text-on-surface-variant/50 uppercase mb-8">
          {heading}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {items.map((item) => (
          <span
            key={item}
            className="text-sm font-mono font-bold tracking-widest text-on-surface-variant/30 uppercase transition-all duration-500 hover:text-primary/60"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
