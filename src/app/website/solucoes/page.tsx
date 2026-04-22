import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  FileSearch,
  Terminal,
  LineChart,
  ChevronRight,
  Zap,
  ShieldCheck,
  Cpu,
  Lock,
  Network,
  Sparkles,
} from "lucide-react";

import { WebsiteShell, MarketingCard } from "@/app/website";
import { Heading, Text } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { buildWebsiteMetadata } from "../_metadata/build-metadata";

export const metadata = buildWebsiteMetadata({
  title: "Soluções",
  description:
    "Defesa assertiva, recuperação de ativos trabalhistas e justiça reparadora. Soluções jurídicas de alta precisão digital.",
  path: "/solucoes",
});

export default function SolucoesPage() {
  return (
    <WebsiteShell>
      <div className="pt-32 pb-24 overflow-hidden">
        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden mt-6">
          <div aria-hidden="true" className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-background to-background" />
            <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-primary-dim/10 rounded-full blur-[100px]" />
          </div>
          <div className="max-w-352 mx-auto px-5 sm:px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10 w-full">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <Text variant="marketing-overline" className="mb-5 block">
                Infraestrutura Jurídica Next-Gen
              </Text>
              <Heading level="marketing-hero" className="mb-7">
                Soluções Jurídicas Digitais.{" "}
                <br />
                <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
                  Inteligência que protege seu direito.
                </span>
              </Heading>
              <Text variant="marketing-lead" className="max-w-xl mb-9 md:mb-10">
                Aceleramos a entrega de justiça através de processamento de
                linguagem natural e análise preditiva. Onde a lei encontra a
                precisão algorítmica.
              </Text>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl h-12 px-8 text-base gap-2 group"
                >
                  <Link href="/contato">
                    Falar com Especialista
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="marketing-outline"
                  className="rounded-xl h-12 px-8 text-base"
                >
                  <Link href="/contato">Ver Demonstração</Link>
                </Button>
              </div>
            </div>
            <div className="lg:col-span-5 hidden lg:block relative">
              <div className="relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden bg-surface-container border border-outline-variant/20 shadow-2xl">
                <Image
                  src="/website/solucoes/hero.jpg"
                  alt="Conceito futurista de justiça com arquitetura digital"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover grayscale hover:grayscale-0 transition-all duration-700 opacity-60 hover:opacity-80"
                />
                <div className="absolute inset-0 bg-linear-to-tr from-primary/20 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Core Solutions — Bento ───────────────────────────────── */}
        <section className="max-w-352 mx-auto px-5 sm:px-6 md:px-10 py-24">
          <div className="mb-10 md:mb-14">
            <Text variant="marketing-overline" className="mb-3 block">
              Ecossistema
            </Text>
            <Heading level="marketing-section">Soluções Principais</Heading>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 *:motion-safe:hover:-translate-y-0.5 *:motion-safe:hover:shadow-[0_24px_60px_rgba(0,0,0,0.55)] *:transition-all *:duration-300">
            {/* Solution 1 — Large */}
            <MarketingCard
              variant="solid"
              padding="lg"
              className="md:col-span-2 group relative overflow-hidden flex flex-col justify-between min-h-80"
            >
              <div className="absolute top-0 right-0 p-8 pointer-events-none" aria-hidden="true">
                <Terminal className="text-primary w-24 h-24 opacity-10 group-hover:opacity-30 transition-opacity duration-500" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-dim/25 text-primary ring-1 ring-primary/40 mb-5">
                  <FileSearch className="w-6 h-6" />
                </div>
                <Heading level="section" as="h3" className="mb-3">
                  Auditoria Automatizada
                </Heading>
                <Text variant="caption" className="text-foreground/85 max-w-lg leading-relaxed">
                  Identificação instantânea de riscos contratuais e conformidade
                  regulatória. Nossa engine analisa milhares de páginas em
                  segundos, detectando anomalias que escapam ao olho humano.
                </Text>
              </div>
              <ul className="mt-8 flex flex-wrap gap-2 relative z-10">
                {["Processamento de Linguagem Natural", "Risk Score 99.9%"].map(
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
            </MarketingCard>

            {/* Solution 2 */}
            <MarketingCard variant="solid" padding="lg" className="group flex flex-col">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-dim/25 text-primary ring-1 ring-primary/40 mb-5">
                <LineChart className="w-6 h-6" />
              </div>
              <Heading level="section" as="h3" className="mb-3">
                Análise Preditiva de Riscos
              </Heading>
              <Text variant="caption" className="text-foreground/85 leading-relaxed">
                Modelagem estatística baseada em jurisprudência histórica para
                prever desfechos processuais com precisão cirúrgica.
              </Text>
              <Link
                href="/contato"
                className="mt-auto pt-6 inline-flex items-center gap-2 text-primary font-bold text-xs tracking-widest uppercase hover:gap-3 transition-all"
              >
                Explorar Motor
                <ChevronRight className="w-4 h-4" />
              </Link>
            </MarketingCard>

            {/* Solution 3 */}
            <MarketingCard variant="solid" padding="lg" className="group flex flex-col">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-dim/25 text-primary ring-1 ring-primary/40 mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <Heading level="section" as="h3" className="mb-3">
                Protocolo Acelerado
              </Heading>
              <Text variant="caption" className="text-foreground/85 leading-relaxed">
                Automação de peticionamento e gestão de prazos. Redução de 70%
                no tempo de resposta operacional em processos de massa.
              </Text>
              <Link
                href="/contato"
                className="mt-auto pt-6 inline-flex items-center gap-2 text-primary font-bold text-xs tracking-widest uppercase hover:gap-3 transition-all"
              >
                Ver Protocolo
                <ChevronRight className="w-4 h-4" />
              </Link>
            </MarketingCard>

            {/* Solution 4 — Long Row */}
            <MarketingCard
              variant="solid"
              padding="lg"
              className="md:col-span-2 group flex items-center gap-8 md:gap-12"
            >
              <div className="hidden md:block w-44 h-44 shrink-0">
                <div className="w-full h-full rounded-2xl bg-linear-to-br from-primary-dim to-surface-container-highest p-0.5">
                  <div className="w-full h-full bg-surface-container rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-20 h-20 text-primary opacity-80" />
                  </div>
                </div>
              </div>
              <div>
                <Heading level="section" as="h3" className="mb-3">
                  Escudo Digital Compliance
                </Heading>
                <Text variant="caption" className="text-foreground/85 leading-relaxed mb-5">
                  Monitoramento em tempo real de alterações legislativas que
                  impactam seu setor. Alertas proativos e geração automática de
                  aditivos contratuais para manter sua operação segura.
                </Text>
                <Link
                  href="/contato"
                  className="inline-flex items-center gap-2 text-primary font-bold text-xs tracking-widest uppercase hover:gap-3 transition-all"
                >
                  Ler documento técnico
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </MarketingCard>
          </div>
        </section>

        {/* ─── Tech Stack: Zattar Engine ────────────────────────────── */}
        <section className="relative overflow-hidden border-t border-outline-variant/20">
          <div aria-hidden="true" className="absolute inset-0 bg-surface-container-low opacity-50" />
          <div className="max-w-352 mx-auto px-5 sm:px-6 md:px-10 py-24 md:py-32 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
              <div>
                <Text variant="marketing-overline" className="mb-5 block">
                  A Infraestrutura
                </Text>
                <Heading level="marketing-section" className="mb-8">
                  Zattar Engine:{" "}
                  <br />
                  <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
                    O Núcleo Neural.
                  </span>
                </Heading>
                <ul className="space-y-7">
                  <li className="flex gap-6">
                    <div className="shrink-0 w-12 h-12 bg-primary-dim/20 ring-1 ring-primary/30 rounded-xl flex items-center justify-center text-primary">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <Heading level="subsection" as="h3" className="mb-1.5 text-foreground">
                        Processamento de Alta Velocidade
                      </Heading>
                      <Text variant="caption" className="text-foreground/85 leading-relaxed">
                        Arquitetura distribuída capaz de processar petições
                        complexas em milissegundos.
                      </Text>
                    </div>
                  </li>
                  <li className="flex gap-6">
                    <div className="shrink-0 w-12 h-12 bg-primary-dim/20 ring-1 ring-primary/30 rounded-xl flex items-center justify-center text-primary">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <Heading level="subsection" as="h3" className="mb-1.5 text-foreground">
                        Zero-Trust Security
                      </Heading>
                      <Text variant="caption" className="text-foreground/85 leading-relaxed">
                        Criptografia de ponta a ponta e anonimização de dados
                        sensíveis para total sigilo jurídico.
                      </Text>
                    </div>
                  </li>
                  <li className="flex gap-6">
                    <div className="shrink-0 w-12 h-12 bg-primary-dim/20 ring-1 ring-primary/30 rounded-xl flex items-center justify-center text-primary">
                      <Network className="w-6 h-6" />
                    </div>
                    <div>
                      <Heading level="subsection" as="h3" className="mb-1.5 text-foreground">
                        Integração Universal
                      </Heading>
                      <Text variant="caption" className="text-foreground/85 leading-relaxed">
                        Conectividade nativa com os principais sistemas de
                        tribunais e ERPs corporativos.
                      </Text>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="relative">
                <div className="relative w-full aspect-square flex items-center justify-center">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full border border-primary/20 motion-safe:animate-[spin_10s_linear_infinite] border-dashed"
                  />
                  <div aria-hidden="true" className="absolute inset-12 rounded-full border border-primary/10" />
                  <div aria-hidden="true" className="absolute inset-24 rounded-full border border-primary/5" />
                  <div className="w-64 h-64 bg-surface-container-highest/60 backdrop-blur-xl rounded-full border border-primary/20 flex flex-col items-center justify-center relative shadow-[0_0_80px_color-mix(in_oklch,var(--primary)_15%,transparent)] group hover:scale-105 transition-transform duration-700">
                    <Sparkles className="w-24 h-24 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute -top-4 right-0 bg-surface-container-highest px-4 py-2 rounded-lg border border-primary/30 shadow-xl">
                      <Text variant="micro-caption" className="text-foreground">
                        LATÊNCIA: 12ms
                      </Text>
                    </div>
                    <div className="absolute -bottom-8 left-0 bg-surface-container-highest px-4 py-2 rounded-lg border border-primary/30 shadow-xl">
                      <Text variant="micro-caption" className="text-foreground">
                        UPTIME: 99.99%
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </WebsiteShell>
  );
}
