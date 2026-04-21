import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";

export function Hero() {
  return (
    <section className="relative min-h-dvh flex items-center justify-center overflow-hidden">
      {/* Background CSS poster — sempre renderizado (no CLS, no extra bytes).
          Serve como fallback em mobile, com prefers-reduced-motion, e durante
          o carregamento do iframe Cloudflare em desktop. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-background"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 80% 60% at 70% 20%, color-mix(in oklch, var(--primary) 18%, transparent) 0%, transparent 60%)",
            "radial-gradient(ellipse 70% 50% at 20% 80%, color-mix(in oklch, var(--primary-dim) 14%, transparent) 0%, transparent 55%)",
            "radial-gradient(ellipse 100% 80% at 50% 50%, transparent 30%, color-mix(in oklch, var(--background) 80%, black) 100%)",
          ].join(", "),
        }}
      />

      {/* Video Background (Cloudflare Stream) — só em >=md e com motion-safe */}
      <div className="absolute inset-0 z-0 overflow-hidden hidden md:motion-safe:block">
        <iframe
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-none pointer-events-none"
          style={{
            width: "max(100%, 177.78vh)",
            height: "max(100%, 56.25vw)",
          }}
          src="https://customer-lvnfk43x7eec1csc.cloudflarestream.com/500dc4de24fbf5ec2457f4779c4faded/iframe?muted=true&loop=true&autoplay=true&controls=false"
          allow="autoplay; fullscreen"
          title="Vídeo ambiente do escritório Zattar Advogados"
          loading="lazy"
        />
      </div>

      {/* Dark Overlay for text contrast */}
      <div className="absolute inset-0 z-1 bg-background/60" />

      {/* Content */}
      <div className="container mx-auto px-5 sm:px-6 md:px-8 z-10 text-center relative pt-20 md:pt-0">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 backdrop-blur-sm mb-5 md:mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-primary motion-safe:animate-pulse" aria-hidden="true" />
          <Text variant="marketing-overline">
            A Nova Era da Advocacia Trabalhista
          </Text>
        </div>
        <Heading level="marketing-hero" className="mb-6 md:mb-8 mx-auto max-w-5xl">
          Justiça para{" "}
          <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
            quem trabalha.
          </span>
        </Heading>
        <Text variant="marketing-lead" className="max-w-2xl mx-auto mb-9 md:mb-12">
          Unimos tecnologia de ponta e expertise jurídica para garantir que seus
          direitos sejam respeitados com a velocidade que o mundo moderno exige.
        </Text>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button asChild size="lg" className="rounded-xl gap-2 group h-12 px-8 text-base">
            <Link href="/contato">
              Fale com um Especialista
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="marketing-outline"
            className="rounded-xl h-12 px-8 text-base"
          >
            <Link href="#solucoes">Nossas Soluções</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
