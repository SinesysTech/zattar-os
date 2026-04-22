import Image from "next/image";
import Link from "next/link";
import { Shield, Users, Search, ArrowRight, Atom, Scale } from "lucide-react";

import { WebsiteShell, MarketingCard } from "@/app/website";
import { Heading, Text } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { buildWebsiteMetadata } from "../_metadata/build-metadata";

export const metadata = buildWebsiteMetadata({
  title: "Especialidades",
  description:
    "Áreas de atuação: Direito Digital, Direito do Trabalho, LGPD, cibersegurança e regulação de IA com precisão jurídica e tecnológica.",
  path: "/expertise",
});

export default function ExpertisePage() {
  return (
    <WebsiteShell hideClosingCta>
      <div className="pt-32 pb-24">
        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 mb-24 md:mb-32 grid grid-cols-1 md:grid-cols-12 gap-8 items-center mt-12">
          <div className="md:col-span-7">
            <Text variant="marketing-overline" className="mb-5 block">
              Inteligência Jurídica Deep Tech
            </Text>
            <Heading level="marketing-hero" className="mb-7">
              Expertise Jurídica de{" "}
              <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
                Vanguarda.
              </span>
            </Heading>
            <Text variant="marketing-lead" className="max-w-xl">
              Combinamos a profundidade intelectual do direito tradicional com a
              agilidade algorítmica da próxima geração tecnológica. Proteção em
              alta velocidade.
            </Text>
          </div>
          <div className="md:col-span-5 relative mt-12 md:mt-0">
            <div
              aria-hidden="true"
              className="aspect-square rounded-full border border-primary/20 absolute -top-12 -right-12 w-full"
            />
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl z-10 border border-outline-variant/20 bg-surface-container">
              <Image
                src="/website/expertise/hero.jpg"
                alt="Estátua de justiça em vidro com reflexo tecnológico em close-up"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover grayscale hover:grayscale-0 transition-all duration-700 opacity-70"
              />
            </div>
          </div>
        </section>

        {/* ─── Specialization Areas (Bento) ─────────────────────────── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 mb-24 md:mb-32">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 md:mb-14 gap-6">
            <div className="max-w-2xl">
              <Text variant="marketing-overline" className="mb-3 block">
                Áreas de atuação
              </Text>
              <Heading level="marketing-section">Áreas de Especialização</Heading>
              <Text variant="marketing-lead" className="mt-4">
                Arquitetura jurídica desenhada para o ecossistema digital contemporâneo.
              </Text>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
            {/* Direito Digital — wide, image bg */}
            <MarketingCard
              variant="solid"
              padding="lg"
              className="md:col-span-8 overflow-hidden group relative flex flex-col justify-end min-h-96 md:min-h-104"
            >
              <div className="absolute inset-0 z-0">
                <Image
                  src="/website/expertise/profile-1.jpg"
                  alt="Visualização de dados futurística de cibersegurança"
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover opacity-25 motion-safe:group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-background/95 via-background/70 to-transparent" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-dim/25 text-primary ring-1 ring-primary/40 mb-5">
                  <Shield className="w-6 h-6" />
                </div>
                <Heading level="marketing-title" className="mb-3">
                  Direito Digital
                </Heading>
                <Text variant="marketing-lead" className="max-w-lg mb-5">
                  Navegação precisa por LGPD, cibersegurança e regulação de IA.
                  Protegemos seu IP e garantimos conformidade em infraestruturas
                  complexas.
                </Text>
                <ul className="flex flex-wrap gap-2">
                  {["LGPD", "Web3 & Smart Contracts", "Ciber-Litigância"].map(
                    (tag) => (
                      <li
                        key={tag}
                        className="px-3 py-1 rounded-full bg-surface-container-highest/80 border border-outline-variant/20 text-primary text-xs font-semibold"
                      >
                        {tag}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </MarketingCard>

            {/* Direito do Trabalho */}
            <MarketingCard
              variant="solid"
              padding="lg"
              className="md:col-span-4 group flex flex-col"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-dim/25 text-primary ring-1 ring-primary/40 mb-5">
                <Users className="w-6 h-6" />
              </div>
              <Heading level="card" as="h3" className="mb-3">
                Direito do Trabalho
              </Heading>
              <Text variant="caption" className="text-foreground/85 mb-6 leading-relaxed">
                Estratégias laborais para o trabalho remoto e a economia de
                plataformas. Gestão de risco para times globais e contratos de
                vesting.
              </Text>
              <div className="mt-auto pt-5 border-t border-outline-variant/20">
                <Text variant="marketing-overline">Foco em times híbridos</Text>
              </div>
            </MarketingCard>

            {/* Consultoria Preventiva — destaque primary */}
            <MarketingCard
              variant="primary"
              padding="lg"
              className="md:col-span-4 group flex flex-col"
            >
              {/* Ícone em glass-white é intencional aqui — o card tem fundo roxo
                  (primary-dim) próprio, então bg-white/15 cria contraste alto. */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/15 text-white ring-1 ring-white/25 mb-5">
                <Search className="w-6 h-6" />
              </div>
              <Heading level="card" as="h3" className="mb-3 text-white">
                Consultoria Preventiva
              </Heading>
              <Text variant="caption" className="text-white/85 mb-7 leading-relaxed">
                Inteligência antecipatória para evitar o contencioso. Auditamos
                processos internos com precisão cirúrgica antes que se tornem
                passivos.
              </Text>
              <Link
                href="/contato"
                className="group/cta mt-auto inline-flex items-center gap-2 text-white font-bold text-xs tracking-widest uppercase hover:gap-3 transition-all"
              >
                Saiba Mais
                <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-0.5 transition-transform" />
              </Link>
            </MarketingCard>

            {/* Fusões & Aquisições Tech — wide com imagem lateral */}
            <MarketingCard
              variant="solid"
              padding="lg"
              className="md:col-span-8 relative overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 h-full">
                <div className="flex flex-col justify-center relative z-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-dim/25 text-primary ring-1 ring-primary/40 mb-5">
                    <Scale className="w-6 h-6" />
                  </div>
                  <Heading level="card" as="h3" className="mb-3">
                    Fusões &amp; Aquisições Tech
                  </Heading>
                  <Text variant="caption" className="text-foreground/85 mb-5 leading-relaxed">
                    Due diligence automatizada e estruturação societária para
                    startups em rodadas de investimento (Series A–E).
                  </Text>
                  <div className="flex -space-x-2">
                    {["M&A", "EXIT", "IPO"].map((tag) => (
                      <div
                        key={tag}
                        className="w-10 h-10 rounded-full border-2 border-surface-container bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-foreground shadow-md"
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative hidden sm:block min-h-52 rounded-xl overflow-hidden">
                  <Image
                    src="/website/expertise/profile-2.jpg"
                    alt="Linhas arquitetônicas abstratas representando estruturação societária"
                    fill
                    sizes="(max-width: 768px) 100vw, 30vw"
                    className="object-cover opacity-50 grayscale mix-blend-screen"
                  />
                  <div className="absolute inset-0 bg-linear-to-l from-transparent to-surface-container/90" />
                </div>
              </div>
            </MarketingCard>
          </div>
        </section>

        {/* ─── Team ─────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 mb-24 md:mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 lg:gap-20 items-center">
            <div className="order-2 md:order-1">
              <Text variant="marketing-overline" className="mb-4 block">
                Nossa célula de elite
              </Text>
              <Heading level="marketing-section" className="mb-6">
                Advogados que codificam.
                <br />
                <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
                  Engenheiros que legislam.
                </span>
              </Heading>
              <Text variant="marketing-lead" className="mb-8">
                Quebramos os silos tradicionais. Nosso time é composto por
                profissionais híbridos que entendem tanto o Código Civil quanto
                o código fonte. Essa fusão nos permite criar soluções que não
                são apenas legalmente robustas, mas tecnicamente viáveis e
                escaláveis.
              </Text>

              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-dim/20 ring-1 ring-primary/30 shrink-0 mt-0.5">
                    <Atom className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <Heading level="subsection" as="h3" className="mb-1 text-foreground">
                      Célula de Engenharia Legal
                    </Heading>
                    <Text variant="caption" className="text-foreground/85">
                      Desenvolvimento de automações customizadas para fluxos de compliance.
                    </Text>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-dim/20 ring-1 ring-primary/30 shrink-0 mt-0.5">
                    <Scale className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <Heading level="subsection" as="h3" className="mb-1 text-foreground">
                      Conselho Consultivo Sênior
                    </Heading>
                    <Text variant="caption" className="text-foreground/85">
                      Doutores em Direito focados em estratégias de alto impacto jurídico.
                    </Text>
                  </div>
                </li>
              </ul>
            </div>

            <div className="order-1 md:order-2 grid grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-3 md:space-y-4 pt-10">
                <div className="relative aspect-3/4 rounded-2xl bg-surface-container overflow-hidden border border-outline-variant/20 grayscale hover:grayscale-0 transition-all duration-500">
                  <Image
                    src="/website/expertise/legal-professional.jpg"
                    alt="Profissional jurídico"
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-3/4 rounded-2xl bg-surface-container overflow-hidden border border-outline-variant/20 grayscale hover:grayscale-0 transition-all duration-500">
                  <Image
                    src="/website/expertise/tech-engineer.jpg"
                    alt="Engenheiro de tecnologia"
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="space-y-3 md:space-y-4">
                <div className="relative aspect-3/4 rounded-2xl bg-surface-container overflow-hidden border border-outline-variant/20 grayscale hover:grayscale-0 transition-all duration-500">
                  <Image
                    src="/website/expertise/legal-tech.jpg"
                    alt="Profissional de tecnologia jurídica"
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-3/4 rounded-2xl bg-surface-container overflow-hidden border border-outline-variant/20 grayscale hover:grayscale-0 transition-all duration-500">
                  <Image
                    src="/website/expertise/expert-counsel.jpg"
                    alt="Advogado especialista"
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CTA dedicado da página — substitui Zone 1 do Footer ─── */}
        <section className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8">
          <MarketingCard
            variant="solid"
            padding="lg"
            className="text-center relative overflow-hidden px-6 py-14 sm:py-16 md:py-20 lg:px-16"
          >
            <div
              aria-hidden="true"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-primary to-transparent"
            />
            <div
              aria-hidden="true"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-32 bg-primary-dim/12 blur-[120px] rounded-full pointer-events-none"
            />
            <div className="relative z-10 max-w-3xl mx-auto">
              <Heading level="marketing-section" className="mb-5 md:mb-6">
                Pronto para elevar seu{" "}
                <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
                  padrão jurídico?
                </span>
              </Heading>
              <Text variant="marketing-lead" className="mb-9 md:mb-10 max-w-xl mx-auto">
                Seu time merece a segurança de um magistrado com a velocidade de
                um processador.
              </Text>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl h-12 px-8 text-base gap-2 group"
                >
                  <Link href="/contato">
                    Agendar Consultoria
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="marketing-outline"
                  className="rounded-xl h-12 px-8 text-base"
                >
                  <Link href="/contato">Falar com Especialista</Link>
                </Button>
              </div>
            </div>
          </MarketingCard>
        </section>
      </div>
    </WebsiteShell>
  );
}
