import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServicosHeroProps {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  description: string;
  /** Optional back-link above the kicker (e.g. "Voltar para Serviços"). */
  backHref?: string;
  backLabel?: string;
  className?: string;
}

/**
 * Editorial hero shared across /servicos pages.
 * Mirrors the website visual language: kicker + display title with gradient
 * highlight + description + ambient radial glow. Meant to sit at the top of
 * every services page for a coherent rhythm with the rest of the site.
 */
export function ServicosHero({
  eyebrow,
  title,
  titleHighlight,
  description,
  backHref,
  backLabel,
  className,
}: ServicosHeroProps) {
  return (
    <section
      className={cn(
        "relative mb-16 sm:mb-20 overflow-hidden",
        className
      )}
    >
      {/* Ambient radial glow */}
      <div
        aria-hidden
        className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-[radial-gradient(circle_at_center,rgb(var(--color-primary)/0.08)_0%,transparent_70%)] pointer-events-none"
      />

      <div className="relative z-10 max-w-4xl">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-headline text-sm tracking-tight mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {backLabel ?? "Voltar"}
          </Link>
        )}

        <span className="inline-block text-primary font-headline font-bold text-xs tracking-[0.2em] uppercase mb-4">
          {eyebrow}
        </span>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-headline font-extrabold tracking-tighter leading-[0.95] mb-6 text-on-surface">
          {title}{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-dim">
            {titleHighlight}
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-on-surface-variant font-body leading-relaxed max-w-2xl">
          {description}
        </p>
      </div>
    </section>
  );
}
