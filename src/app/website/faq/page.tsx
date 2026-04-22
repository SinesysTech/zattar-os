import Link from "next/link";
import { Search, ArrowUpRight, Gavel, ArrowRight, Headset } from "lucide-react";

import { WebsiteShell, MarketingCard, TrustTicker } from "@/app/website";
import { Heading, Text } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { buildWebsiteMetadata } from "../_metadata/build-metadata";

export const metadata = buildWebsiteMetadata({
  title: "Perguntas Frequentes",
  description:
    "Respostas rápidas sobre processos trabalhistas, FGTS, acidentes de trabalho, prazos e atendimento digital.",
  path: "/faq",
});

interface FaqEntry {
  tag: string;
  question: string;
  answer: string;
}

const faqEntries: FaqEntry[] = [
  {
    tag: "Rescisão",
    question: "Como calcular minha rescisão?",
    answer:
      "O cálculo da rescisão depende do motivo do desligamento. No caso de demissão sem justa causa, você tem direito ao saldo de salário, aviso prévio, férias proporcionais + 1/3, 13º proporcional e multa de 40% do FGTS. Você pode utilizar nossa calculadora na área do cliente.",
  },
  {
    tag: "Direitos",
    question: "O que é rescisão indireta?",
    answer:
      'Conhecida como a "justa causa do empregador", ocorre quando a empresa comete faltas graves, como atraso recorrente de salários ou falta de depósitos de FGTS. Nesses casos, o trabalhador pode sair e receber todas as verbas como se tivesse sido demitido sem justa causa.',
  },
  {
    tag: "Processual",
    question: "Quais documentos preciso para um processo?",
    answer:
      "Essencialmente: CTPS (Carteira de Trabalho), holerites, extrato do FGTS, TRCT (Termo de Rescisão) e provas específicas do seu caso (mensagens de WhatsApp, e-mails ou fotos). Você pode subir todos esses arquivos de forma segura no cofre digital do Portal Zattar.",
  },
  {
    tag: "Segurança",
    question: "Meus dados estão seguros na plataforma?",
    answer:
      "Absolutamente. Utilizamos criptografia de ponta a ponta e estamos em total conformidade com a LGPD. Seus documentos são processados e armazenados em infraestrutura segura, restrita a você e aos sócios do caso.",
  },
];

const popularTopics = [
  "Horas Extras e Adicionais",
  "Assédio Moral no Trabalho",
  "Estabilidade Gestante",
  "Férias e Descanso Semanal",
];

export default function FAQPage() {
  return (
    <WebsiteShell>
      <div className="pt-32 pb-24">
        {/* ─── Hero + Busca ─────────────────────────────────────────── */}
        <header className="max-w-6xl mx-auto px-5 sm:px-6 md:px-10 pt-12 pb-12 mt-6">
          <div className="inline-flex items-center mb-5">
            <Text
              variant="marketing-overline"
              className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1"
            >
              Central de Ajuda
            </Text>
          </div>
          <Heading level="marketing-hero" className="mb-6">
            Como podemos{" "}
            <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
              ajudar hoje?
            </span>
          </Heading>
          <Text variant="marketing-lead" className="max-w-2xl">
            Encontre respostas rápidas para suas dúvidas jurídicas ou navegue
            pelas categorias para entender seus direitos com clareza.
          </Text>

          {/* Barra de busca */}
          <div className="mt-10 md:mt-12 relative group max-w-4xl">
            <label htmlFor="faq-search" className="sr-only">
              Buscar na central de ajuda
            </label>
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="text-on-surface-variant group-focus-within:text-primary transition-colors w-5 h-5" />
            </div>
            <input
              id="faq-search"
              type="search"
              placeholder="Pesquisar por 'Rescisão', 'Pagamentos' ou 'Documentos'..."
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-2xl py-4 pl-14 pr-5 text-on-surface placeholder:text-on-surface-variant/60 focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.35)] outline-none"
            />
          </div>

          {/* Categorias */}
          <div className="flex flex-wrap gap-3 mt-8">
            <button
              type="button"
              className="cursor-pointer px-5 py-2 bg-primary text-on-primary font-semibold rounded-full text-sm border border-primary/30 shadow-[0_0_15px_color-mix(in_oklch,var(--primary)_20%,transparent)] hover:brightness-110 transition-all"
            >
              Direito Trabalhista
            </button>
            {["Uso da Plataforma", "Segurança e Dados", "Honorários & Custos"].map(
              (label) => (
                <button
                  key={label}
                  type="button"
                  className="cursor-pointer px-5 py-2 bg-surface-container-low text-on-surface-variant font-medium rounded-full text-sm border border-outline-variant/20 hover:bg-surface-container-highest hover:text-foreground transition-colors"
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </header>

        {/* ─── FAQ + Sidebar ─────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-5 sm:px-6 md:px-10 pb-24 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          <div className="md:col-span-8 space-y-5 md:space-y-6">
            {faqEntries.map((entry) => (
              <MarketingCard
                key={entry.question}
                variant="solid"
                padding="lg"
                className="group cursor-pointer hover:border-primary/40 transition-all"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <Text variant="marketing-overline" className="mb-2 block">
                      {entry.tag}
                    </Text>
                    <Heading
                      level="card"
                      as="h3"
                      className="group-hover:text-primary transition-colors"
                    >
                      {entry.question}
                    </Heading>
                  </div>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="text-primary-dim group-hover:rotate-45 group-hover:text-primary transition-all w-6 h-6 shrink-0 mt-1"
                  />
                </div>
                <Text variant="caption" className="text-foreground/80 leading-relaxed mt-5">
                  {entry.answer}
                </Text>
              </MarketingCard>
            ))}
          </div>

          <aside className="md:col-span-4 space-y-6 md:space-y-8">
            {/* Tech Feature Card — variant primary para destaque */}
            <MarketingCard
              variant="primary"
              padding="lg"
              className="overflow-hidden relative"
            >
              <div className="relative z-10">
                <Heading level="card" as="h4" className="mb-3 text-white">
                  Análise em Tempo Real
                </Heading>
                <Text variant="caption" className="text-white/85 leading-relaxed mb-5">
                  Acesse nossa plataforma para visualizar o status do seu
                  processo em tempo real, com explicações geradas para leigos.
                </Text>
                <Link
                  href="/portal"
                  className="inline-flex items-center gap-2 text-white font-bold text-xs tracking-widest uppercase hover:gap-3 transition-all"
                >
                  Acessar Portal
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div
                aria-hidden="true"
                className="absolute -bottom-10 -right-10 opacity-15 pointer-events-none"
              >
                <Gavel className="w-48 h-48 text-white" />
              </div>
            </MarketingCard>

            {/* Popular Topics */}
            <MarketingCard variant="solid" padding="lg">
              <Heading level="card" as="h4" className="mb-5">
                Tópicos Populares
              </Heading>
              <ul className="space-y-4">
                {popularTopics.map((topic) => (
                  <li key={topic}>
                    <button
                      type="button"
                      className="cursor-pointer w-full text-left flex items-center gap-3 text-foreground/75 hover:text-primary transition-colors group"
                    >
                      <span
                        aria-hidden="true"
                        className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors"
                      />
                      <Text variant="caption" className="text-inherit">
                        {topic}
                      </Text>
                    </button>
                  </li>
                ))}
              </ul>
            </MarketingCard>
          </aside>
        </section>

        {/* ─── Footer CTA ──────────────────────────────────────────────── */}
        <section className="bg-surface-container-low/60 py-24 md:py-32 border-y border-outline-variant/10 relative">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 md:px-10 text-center relative z-10">
            <div className="inline-flex items-center justify-center p-5 bg-primary/10 rounded-full mb-6 border border-primary/20 shadow-[0_0_30px_color-mix(in_oklch,var(--primary)_15%,transparent)]">
              <Headset className="text-primary w-8 h-8" />
            </div>
            <Heading level="marketing-section" className="mb-5">
              Ainda tem dúvidas?
            </Heading>
            <Text variant="marketing-lead" className="max-w-xl mx-auto mb-9 md:mb-10">
              Se você não encontrou o que procurava, nossos especialistas
              jurídicos estão prontos para analisar o seu caso em detalhes.
            </Text>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="rounded-xl h-12 px-8 text-base gap-2 group"
              >
                <Link href="/contato">
                  Falar com um especialista
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="marketing-outline"
                className="rounded-xl h-12 px-8 text-base"
              >
                <Link href="/portal">Acessar Portal do Cliente</Link>
              </Button>
            </div>
          </div>
        </section>

        <TrustTicker
          items={["PARTNER_A", "LEGAL_CLOUD", "TRUST_PROTOCOL"]}
          heading="Parceiros de Confiança"
        />
      </div>
    </WebsiteShell>
  );
}
