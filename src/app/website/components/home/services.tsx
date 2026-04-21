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
import { MarketingCard } from "../shared/marketing-card";
import { Heading, Text } from "@/components/ui/typography";

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
      ? "md:-bottom-8 md:-right-6 lg:-right-8"
      : "md:-bottom-8 md:-left-6 lg:-left-8";

  return (
    <MarketingCard
      variant="solid"
      padding="lg"
      className={`relative md:absolute ${positionClasses} max-w-xs lg:max-w-sm -mt-8 mx-4 md:mt-0 md:mx-0`}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-primary-dim/25 text-primary mb-4 ring-1 ring-primary/40">
        {icon}
      </div>
      <Heading level="card" as="h4" className="mb-2 text-foreground">
        {title}
      </Heading>
      <Text variant="caption" className="text-foreground/85">
        {description}
      </Text>
    </MarketingCard>
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
          <Text variant="marketing-overline" className="mb-4 block">
            {label}
          </Text>
        )}
        <Heading level="marketing-title" className="mb-5 md:mb-7">
          {title}
        </Heading>
        <Text variant="marketing-lead" className="mb-7 md:mb-9">
          {description}
        </Text>
        <Link
          href={href}
          className="group/cta inline-flex items-center gap-2 text-primary font-bold text-base md:text-lg hover:gap-3 transition-all"
        >
          <span className="underline decoration-primary/40 underline-offset-4 group-hover/cta:decoration-primary">
            {ctaLabel}
          </span>
          <ArrowRight className="w-5 h-5 group-hover/cta:translate-x-0.5 transition-transform" />
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
          <Text variant="marketing-overline">Especialidades</Text>
          <Heading level="marketing-section" className="mt-4 md:mt-5">
            Soluções jurídicas de{" "}
            <br className="hidden sm:block" />
            <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
              alta precisão digital.
            </span>
          </Heading>
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
