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
      <span className="text-primary text-xs font-medium uppercase tracking-wider mb-3 block">
        {eyebrow}
      </span>
      <h2 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-foreground mb-4">
        {title}{" "}
        <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-dim">
          {titleHighlight}
        </span>
      </h2>
      <p className="text-portal-text-muted text-base max-w-2xl">
        {description}
      </p>
    </section>
  );
}
