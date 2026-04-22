import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bookmark, ExternalLink } from "lucide-react";

import { WebsiteShell, MarketingCard } from "@/app/website";
import { Heading, Text } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { buildWebsiteMetadata } from "../_metadata/build-metadata";

export const metadata = buildWebsiteMetadata({
  title: "Insights",
  description:
    "Artigos, análises e tendências do Direito do Trabalho com olhar tecnológico. Curadoria Zattar Advogados.",
  path: "/insights",
});

interface ArticleItem {
  category: string;
  title: string;
  description: string;
  image: string;
  alt: string;
}

const archiveArticles: ArticleItem[] = [
  {
    category: "Policy Review",
    title: "Privacidade de Dados no Ambiente Corporativo",
    description:
      "O monitoramento de produtividade e os limites éticos e legais da LGPD em regime de Home Office.",
    image: "/website/insights/article-1.jpg",
    alt: "Conexões de rede digital abstrata com nós brilhantes",
  },
  {
    category: "Contract Law",
    title: "Smart Contracts: Automação de Acordos",
    description:
      "Como o código autoexecutável está eliminando a necessidade de intermediários em Acordos de Confidencialidade (NDAs).",
    image: "/website/insights/article-2.jpg",
    alt: "Aperto de mão entre humano e robô",
  },
  {
    category: "Cybersecurity",
    title: "Responsabilidade Civil em Vazamentos de Dados",
    description:
      "O novo entendimento disciplinar do TST sobre danos morais em incidentes graves de segurança cibernética.",
    image: "/website/insights/article-3.jpg",
    alt: "Placa de circuito digital brilhando com luz violeta e azul",
  },
  {
    category: "Investimentos",
    title: "O Jurídico como Centro de Inteligência",
    description:
      "Transformando o compliance legal e passivos trabalhistas em diferencial competitivo para captação de VC.",
    image: "/website/insights/article-4.jpg",
    alt: "Formas cristalinas geométricas flutuantes com textura metálica",
  },
];

export default function InsightsPage() {
  return (
    <WebsiteShell hideClosingCta>
      <div className="pt-32 pb-24">
        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <section className="max-w-352 mx-auto px-5 sm:px-6 md:px-10 mb-16 md:mb-24 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-8">
              <Text variant="marketing-overline" className="mb-5 block">
                Inteligência Editorial
              </Text>
              <Heading level="marketing-hero" className="mb-7">
                Insights e Tendências do{" "}
                <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
                  Direito do Amanhã.
                </span>
              </Heading>
              <Text variant="marketing-lead" className="max-w-2xl">
                Navegando na interseção entre tecnologia disruptiva e segurança
                jurídica para as equipes de alta performance da próxima década.
              </Text>
            </div>
            <div className="md:col-span-4 hidden md:flex justify-end">
              <div
                aria-hidden="true"
                className="w-full h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"
              />
            </div>
          </div>
        </section>

        {/* ─── Filter Chips ──────────────────────────────────────────── */}
        <section className="max-w-352 mx-auto px-5 sm:px-6 md:px-10 mb-12 md:mb-16">
          <div className="flex flex-wrap gap-3 items-center">
            <Text variant="caption" className="text-foreground/70 mr-2">
              Filtrar por:
            </Text>
            <button
              type="button"
              className="cursor-pointer bg-primary text-on-primary px-5 py-2 rounded-full text-sm font-semibold transition-colors hover:brightness-110 shadow-[0_0_15px_color-mix(in_oklch,var(--primary)_20%,transparent)]"
            >
              Todos os Recursos
            </button>
            {["Novas Leis", "Tecnologia no Judiciário", "Direitos do Trabalhador"].map(
              (label) => (
                <button
                  key={label}
                  type="button"
                  className="cursor-pointer bg-surface-container-highest text-primary px-5 py-2 rounded-full text-sm font-semibold border border-outline-variant/20 hover:bg-surface-container-highest/80 hover:border-primary/30 transition-colors"
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </section>

        {/* ─── Featured Bento Grid ──────────────────────────────────── */}
        <section className="max-w-352 mx-auto px-5 sm:px-6 md:px-10 mb-24 md:mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 *:motion-safe:hover:-translate-y-0.5 *:transition-all *:duration-300">
            {/* Main Featured Card */}
            <MarketingCard
              variant="solid"
              padding="lg"
              className="md:col-span-2 group relative overflow-hidden flex flex-col justify-end min-h-96 md:min-h-112"
            >
              <div className="absolute inset-0 z-0">
                <Image
                  src="/website/insights/hero.jpg"
                  alt="Edifício moderno de justiça com arquitetura em vidro refletindo luzes violeta"
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover opacity-30 motion-safe:group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-background/95 via-background/70 to-transparent" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5">
                  <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                    Relatório de Destaque
                  </span>
                  <Text variant="caption" className="text-foreground/70">
                    Leitura de 12 min
                  </Text>
                </div>
                <Heading level="marketing-title" as="h2" className="mb-4 group-hover:text-primary transition-colors">
                  O Impacto da IA Generativa em Processos Trabalhistas
                </Heading>
                <Text variant="marketing-lead" className="max-w-xl mb-7 line-clamp-2">
                  Uma análise profunda sobre como algoritmos estão moldando
                  novas jurisprudências e o que isso significa para o futuro das
                  relações de trabalho virtuais.
                </Text>
                <Link
                  href="/insights/tendencias"
                  className="inline-flex items-center gap-3 text-foreground font-bold hover:text-primary hover:gap-4 transition-all"
                >
                  Ler artigo completo
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </MarketingCard>

            {/* Secondary Featured */}
            <div className="flex flex-col gap-5 md:gap-6">
              <Link href="/insights/tendencias" className="flex-1 group">
                <MarketingCard variant="solid" padding="lg" className="h-full flex flex-col hover:border-primary/40 transition-all">
                  <Text variant="marketing-overline" className="mb-4 block">
                    Tecnologia
                  </Text>
                  <Heading level="card" as="h3" className="mb-3 group-hover:text-primary transition-colors">
                    Blockchain e a Prova Digital: O Fim da Contestação?
                  </Heading>
                  <Text variant="caption" className="text-foreground/85 leading-relaxed mb-6 grow">
                    Como redes descentralizadas estão garantindo a
                    imutabilidade de registros laborais e as recentes decisões
                    do TST sobre o tema.
                  </Text>
                  <div className="flex justify-between items-center mt-auto">
                    <Text variant="micro-caption" className="text-foreground/60">
                      Maio 24, 2024
                    </Text>
                    <Bookmark className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </MarketingCard>
              </Link>

              <Link href="/insights/tendencias" className="flex-1 group">
                <MarketingCard variant="solid" padding="lg" className="h-full flex flex-col hover:border-primary/40 transition-all">
                  <Text variant="marketing-overline" className="mb-4 block">
                    Novas Leis
                  </Text>
                  <Heading level="card" as="h3" className="mb-3 group-hover:text-primary transition-colors">
                    A Regulamentação do Trabalho Híbrido Transfronteiriço
                  </Heading>
                  <Text variant="caption" className="text-foreground/85 leading-relaxed mb-6 grow">
                    Desafios jurídicos de contratar talentos globais sob
                    diferentes jurisdições fiscais e como proteger contratos
                    internacionais.
                  </Text>
                  <div className="flex justify-between items-center mt-auto">
                    <Text variant="micro-caption" className="text-foreground/60">
                      Maio 22, 2024
                    </Text>
                    <Bookmark className="w-4 h-4 text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                </MarketingCard>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Editorial Archive ─────────────────────────────────────── */}
        <section className="bg-surface-container-low/50 py-24 md:py-32 border-y border-outline-variant/10">
          <div className="max-w-352 mx-auto px-5 sm:px-6 md:px-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 md:mb-16 gap-6">
              <div>
                <Text variant="marketing-overline" className="mb-3 block">
                  Análises Profundas
                </Text>
                <Heading level="marketing-section">Arquivos da Zattar</Heading>
              </div>
              <Link
                href="/insights/tendencias"
                className="text-foreground/70 hover:text-foreground transition-colors border-b border-foreground/30 hover:border-foreground/70 pb-1 inline-flex items-center gap-2 font-medium"
              >
                Ver todos os arquivos
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-14">
              {archiveArticles.map((article) => (
                <Link
                  key={article.title}
                  href="/insights/tendencias"
                  className="flex flex-col sm:flex-row gap-6 group"
                >
                  <div className="shrink-0 w-full sm:w-40 aspect-video sm:aspect-square rounded-2xl bg-surface-container-highest overflow-hidden relative border border-outline-variant/20">
                    <Image
                      src={article.image}
                      alt={article.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 160px"
                      className="object-cover opacity-60 group-hover:opacity-100 motion-safe:group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-linear-to-tr from-primary/10 to-transparent" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <Text variant="marketing-overline" className="mb-2 block">
                      {article.category}
                    </Text>
                    <Heading level="card" as="h4" className="mb-3 group-hover:text-primary transition-colors">
                      {article.title}
                    </Heading>
                    <Text variant="caption" className="text-foreground/75 leading-relaxed line-clamp-2">
                      {article.description}
                    </Text>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Newsletter ─────────────────────────────────────────────── */}
        <section className="max-w-352 mx-auto px-5 sm:px-6 md:px-10 pt-24">
          <MarketingCard
            variant="solid"
            padding="lg"
            className="relative overflow-hidden px-6 py-14 sm:py-16 md:py-20 lg:px-20"
          >
            <div
              aria-hidden="true"
              className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none"
            />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <Heading level="marketing-section" className="mb-5">
                  Fique por dentro das{" "}
                  <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
                    atualizações jurídicas.
                  </span>
                </Heading>
                <Text variant="marketing-lead" className="max-w-lg">
                  Junte-se a 15.000+ profissionais que recebem nossa curadoria
                  semanal sobre direito material, tecnologia e o futuro do
                  trabalho.
                </Text>
              </div>

              <form
                action="#"
                method="post"
                className="space-y-4 max-w-xl lg:ml-auto w-full"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Seu e-mail
                  </label>
                  <input
                    id="newsletter-email"
                    name="email"
                    type="email"
                    required
                    placeholder="Seu melhor e-mail"
                    className="grow bg-surface-container-high border border-outline-variant/20 focus:border-primary/50 rounded-xl px-5 py-3.5 text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary/50 outline-none transition-colors"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="rounded-xl h-12 px-6 text-base whitespace-nowrap"
                  >
                    Inscrever-se
                  </Button>
                </div>
                <Text variant="caption" className="text-foreground/70 leading-relaxed">
                  Ao se inscrever, você concorda com nossa{" "}
                  <Link
                    href="/politica-de-privacidade"
                    className="text-primary hover:underline font-medium"
                  >
                    Política de Privacidade
                  </Link>
                  . Sem spam, garantimos.
                </Text>
              </form>
            </div>
          </MarketingCard>
        </section>
      </div>
    </WebsiteShell>
  );
}
