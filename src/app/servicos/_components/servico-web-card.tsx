import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServicoWebCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Optional footer chip, e.g. "10 calculadoras" */
  badge?: string;
  /** Optional inline CTA label (default "Explorar") */
  cta?: string;
  className?: string;
}

/**
 * Website-style service card. Large rounded surface container with border
 * glow on hover, primary-tinted icon tile and an inline CTA row. Designed
 * to match the cards on /expertise and the website hero sections.
 */
export function ServicoWebCard({
  title,
  description,
  href,
  icon: Icon,
  badge,
  cta = "Explorar",
  className,
}: ServicoWebCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col h-full bg-surface-container rounded-3xl p-8 border border-white/5",
        "hover:border-primary/30 hover:bg-surface-container-high transition-all duration-500",
        "shadow-lg hover:shadow-[0_0_40px_rgb(var(--color-primary)/0.12)]",
        "overflow-hidden cursor-pointer",
        className
      )}
    >
      {/* Corner ambient glow */}
      <div
        aria-hidden
        className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      />

      <div className="relative z-10 flex items-start justify-between mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-inner shadow-primary/10">
          <Icon className="w-7 h-7" />
        </div>
        {badge && (
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">
            {badge}
          </span>
        )}
      </div>

      <h3 className="relative z-10 text-2xl font-headline font-extrabold tracking-tight text-on-surface mb-3">
        {title}
      </h3>

      <p className="relative z-10 text-on-surface-variant leading-relaxed mb-8 grow">
        {description}
      </p>

      <span className="relative z-10 inline-flex items-center gap-2 text-primary font-headline font-bold text-sm tracking-tight group-hover:gap-4 transition-all">
        {cta}
        <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
}
