/**
 * Services section — v2 asymmetrical image+text blocks with large overlay cards.
 * Three service blocks alternating image-left / text-left layout with
 * large overlay cards containing icon, title and description.
 */

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Gavel,
  Wallet,
  HeartPulse,
} from "lucide-react";

interface OverlayCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Position relative to the image */
  position: "bottom-right" | "bottom-left";
}

function OverlayCard({ icon, title, description, position }: OverlayCardProps) {
  const positionClasses =
    position === "bottom-right"
      ? "md:-bottom-6 md:-right-6"
      : "md:-bottom-6 md:-left-6";

  return (
    <div
      className={`relative md:absolute ${positionClasses} p-5 md:p-6 lg:p-10 bg-surface-container rounded-2xl border border-white/10 max-w-xs lg:max-w-sm -mt-8 mx-4 md:mt-0 md:mx-0`}
    >
      <span className="text-primary mb-2 md:mb-3 lg:mb-4 block">{icon}</span>
      <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-1.5 md:mb-2">{title}</h3>
      <p className="text-on-surface-variant text-sm">{description}</p>
    </div>
  );
}

interface ServiceBlockProps {
  /** "image-left" places the image in columns 1-7, text in 8-12. */
  layout: "image-left" | "text-left";
  imageSrc: string;
  imageAlt: string;
  overlayCard: React.ReactNode;
  label?: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  featured?: boolean;
}

function ServiceBlock({
  layout,
  imageSrc,
  imageAlt,
  overlayCard,
  label,
  title,
  description,
  href,
  ctaLabel,
  featured,
}: ServiceBlockProps) {
  const isImageLeft = layout === "image-left";

  return (
    <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center group">
      {/* Image column */}
      <div
        className={`md:col-span-7 relative ${isImageLeft ? "md:order-1" : "md:order-2"}`}
      >
        <div className="relative aspect-video rounded-2xl md:rounded-3xl overflow-hidden bg-surface-container border border-outline-variant/20">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 58vw"
            className="object-cover opacity-80 group-hover:opacity-100 motion-safe:group-hover:scale-105 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
        </div>
        {overlayCard}
      </div>

      {/* Text column */}
      <div
        className={`md:col-span-5 ${isImageLeft ? "md:order-2 md:pl-8 lg:pl-12" : "md:order-1 md:pr-8 lg:pr-12"}`}
      >
        {label && (
          <span className="text-primary-dim font-label text-xs font-bold uppercase tracking-widest mb-3 block">
            {label}
          </span>
        )}
        <h4 className={`font-headline font-extrabold tracking-tight mb-4 md:mb-6 ${featured ? "text-3xl sm:text-4xl md:text-5xl" : "text-2xl sm:text-3xl md:text-4xl"}`}>
          {title}
        </h4>
        <p className="text-on-surface-variant text-base md:text-lg leading-relaxed mb-6 md:mb-8">
          {description}
        </p>
        <Link
          href={href}
          className="inline-flex items-center gap-2 text-primary-dim font-bold text-base md:text-lg hover:gap-4 transition-all underline underline-offset-4 decoration-primary-dim/40 hover:decoration-primary-dim/80"
        >
          {ctaLabel}
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}

export function Services() {
  return (
    <section id="solucoes" className="py-16 sm:py-20 md:py-32 bg-background overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 md:px-8">
        {/* Section header */}
        <div className="max-w-4xl mb-12 sm:mb-16 md:mb-24">
          <span className="text-primary font-label text-sm font-bold uppercase tracking-widest">
            Especialidades
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-headline font-bold mt-3 md:mt-4 tracking-tighter leading-[1.05]">
            Soluções jurídicas de{" "}
            <br className="hidden sm:block" />
            <span className="text-on-surface-variant">
              alta precisão digital.
            </span>
          </h2>
        </div>

        {/* Service blocks */}
        <div className="space-y-16 sm:space-y-20 md:space-y-32">
          {/* Block 1 — Image Left (Demissão sem justa causa) */}
          <ServiceBlock
            layout="image-left"
            featured
            label="Principal"
            imageSrc="/website/home/services-demissao.jpg"
            imageAlt="Interface de dados de alta tecnologia com símbolos jurídicos e linhas brilhantes roxas"
            overlayCard={
              <OverlayCard
                icon={<Gavel className="w-10 h-10 lg:w-12 lg:h-12" />}
                title="Demissão sem justa causa"
                description="Proteção imediata e estratégica em rescisões abusivas com suporte digital."
                position="bottom-right"
              />
            }
            title="Defesa Assertiva."
            description="Utilizamos análise preditiva para identificar irregularidades em rescisões complexas, garantindo que nenhum direito seja negligenciado."
            href="/expertise"
            ctaLabel="Consultar caso"
          />

          {/* Block 2 — Text Left (FGTS e Verbas) */}
          <ServiceBlock
            layout="text-left"
            imageSrc="/website/home/services-fgts.jpg"
            imageAlt="Dados financeiros e símbolos de moeda digital em tela escura com destaques roxos"
            overlayCard={
              <OverlayCard
                icon={<Wallet className="w-10 h-10 lg:w-12 lg:h-12" />}
                title="FGTS e Verbas"
                description="Recuperação integral de horas extras e depósitos pendentes com auditoria digital."
                position="bottom-left"
              />
            }
            title="Recuperação de Ativos."
            description="Auditoria automatizada de FGTS e verbas rescisórias para identificar cada centavo devido pela contratante."
            href="/expertise"
            ctaLabel="Verificar depósitos"
          />

          {/* Block 3 — Image Left (Acidentes de Trabalho) */}
          <ServiceBlock
            layout="image-left"
            imageSrc="/website/home/services-acidentes.jpg"
            imageAlt="Visualização futurista de dados médicos e anatomia humana em display digital escuro"
            overlayCard={
              <OverlayCard
                icon={<HeartPulse className="w-10 h-10 lg:w-12 lg:h-12" />}
                title="Acidentes de Trabalho"
                description="Suporte jurídico-técnico completo para indenizações por doenças e acidentes laborais."
                position="bottom-right"
              />
            }
            title="Justiça Reparadora."
            description="Combinamos perícia especializada e tecnologia para construir casos sólidos de reparação em saúde do trabalhador."
            href="/expertise"
            ctaLabel="Relatar ocorrência"
          />
        </div>
      </div>
    </section>
  );
}
