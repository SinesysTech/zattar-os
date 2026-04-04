"use client";

interface ServiceIndexHeaderProps {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  description: string;
}

export function ServiceIndexHeader({
  eyebrow,
  title,
  titleHighlight,
  description,
}: ServiceIndexHeaderProps) {
  return (
    <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <span className="text-primary font-headline text-xs font-bold tracking-widest uppercase mb-4 block">
        {eyebrow}
      </span>
      <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tighter text-white mb-6">
        {title}{" "}
        <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-dim">
          {titleHighlight}
        </span>
      </h2>
      <p className="text-on-surface-variant text-lg max-w-2xl">
        {description}
      </p>
    </section>
  );
}
