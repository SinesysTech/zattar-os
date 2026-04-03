import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Clock,
  Calculator,
  Umbrella,
  Gavel,
  Frown,
  SlidersHorizontal,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToolCard {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  colSpan: string;
  large?: boolean;
}

interface ServiceCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const toolCards: ToolCard[] = [
  {
    title: "Gerador de Contratos",
    description:
      "Crie contratos de trabalho, prestação de serviços e acordos extrajudiciais com modelos jurídicos validados pela equipe Zattar.",
    href: "/portal/contratos/gerador",
    icon: FileText,
    colSpan: "col-span-12 lg:col-span-8",
    large: true,
  },
  {
    title: "Horas Extras",
    description: "Calcule o valor correto das suas horas extras.",
    href: "/portal/calculadoras/horas-extras",
    icon: Clock,
    colSpan: "col-span-12 sm:col-span-6 lg:col-span-4",
  },
  {
    title: "13º Salário",
    description: "Simule o valor do seu décimo terceiro.",
    href: "/portal/calculadoras/13-salario",
    icon: Calculator,
    colSpan: "col-span-12 sm:col-span-6 lg:col-span-4",
  },
  {
    title: "Férias",
    description: "Calcule o valor das suas férias e abono pecuniário.",
    href: "/portal/calculadoras/ferias",
    icon: Umbrella,
    colSpan: "col-span-12 sm:col-span-6 lg:col-span-4",
  },
];

const serviceCards: ServiceCard[] = [
  {
    title: "Rescisão Indireta",
    description:
      "Quando o empregador descumpre suas obrigações contratuais, você tem direito à rescisão indireta — equivalente à demissão sem justa causa. Entenda como acionar esse direito.",
    icon: Gavel,
    href: "/expertise",
  },
  {
    title: "Danos Morais",
    description:
      "Assédio, humilhação e situações degradantes no ambiente de trabalho geram direito à indenização por danos morais. Saiba como identificar e comprovar a ocorrência.",
    icon: Frown,
    href: "/expertise",
  },
  {
    title: "Equiparação Salarial",
    description:
      "Funcionários que exercem a mesma função, com igual produtividade e perfeição técnica, têm direito ao mesmo salário. Veja como exigir a equiparação salarial.",
    icon: SlidersHorizontal,
    href: "/expertise",
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ToolBentoCard({ card }: { card: ToolCard }) {
  const Icon = card.icon;
  return (
    <Link
      href={card.href}
      className={`${card.colSpan} group`}
      aria-label={`Acessar ${card.title}`}
    >
      <Card className="h-full rounded-2xl p-6 flex flex-col gap-4 hover:border-border/80 hover:shadow-md transition-all duration-300 min-h-40">
        <div className="flex items-start justify-between gap-4">
          <div className="w-11 h-11 bg-primary/10 border border-primary/15 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/15 group-hover:scale-105 transition-all">
            <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <ArrowRight
            className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1 shrink-0"
            aria-hidden="true"
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <h3
            className={`font-extrabold font-headline tracking-tight text-foreground leading-snug ${
              card.large ? "text-xl" : "text-base"
            }`}
          >
            {card.title}
          </h3>
          <p
            className={`text-muted-foreground leading-relaxed ${
              card.large ? "text-sm" : "text-xs"
            }`}
          >
            {card.description}
          </p>
        </div>

        {card.large && (
          <span className="inline-flex items-center gap-1.5 text-primary text-sm font-bold group-hover:gap-2.5 transition-all mt-auto">
            Abrir Gerador
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </span>
        )}
      </Card>
    </Link>
  );
}

function ServiceLegalCard({ card }: { card: ServiceCard }) {
  const Icon = card.icon;
  return (
    <div className="col-span-12 md:col-span-4">
      <Card className="h-full rounded-2xl p-6 flex flex-col gap-5 hover:border-border/80 transition-all duration-300">
        <div className="w-12 h-12 bg-primary/10 border border-primary/15 rounded-xl flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <h3 className="text-xl font-extrabold font-headline tracking-tight text-foreground leading-snug">
            {card.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {card.description}
          </p>
        </div>

        <Link
          href={card.href}
          className="inline-flex items-center gap-1.5 text-primary text-sm font-bold hover:gap-3 transition-all mt-auto"
          aria-label={`Saiba mais sobre ${card.title}`}
        >
          Saiba mais
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default function ServicosPage() {
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Page Header                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-2">
          <span className="text-primary font-bold text-xs uppercase tracking-[0.2em]">
            SERVIÇOS
          </span>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-foreground">
            Serviços para o Trabalhador.
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Ferramentas e serviços jurídicos para garantir seus direitos trabalhistas.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Ferramentas de Inteligência                                          */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label="Ferramentas de Inteligência"
        className="animate-in fade-in slide-in-from-bottom-6 duration-600 delay-75"
      >
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">
          Ferramentas de Inteligência
        </h2>

        <div className="grid grid-cols-12 gap-6">
          {toolCards.map((card) => (
            <ToolBentoCard key={card.title} card={card} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Soluções Jurídicas                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label="Soluções Jurídicas"
        className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150"
      >
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">
          Soluções Jurídicas
        </h2>

        <div className="grid grid-cols-12 gap-6">
          {serviceCards.map((card) => (
            <ServiceLegalCard key={card.title} card={card} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA Section                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label="Dúvidas sobre seus direitos"
        className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200"
      >
        <Card className="relative overflow-hidden">
          <CardContent className="p-8">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              {/* Text */}
              <div className="flex flex-col gap-2 max-w-md">
                <h3 className="text-2xl font-extrabold font-headline tracking-tighter text-foreground">
                  Dúvidas sobre seus direitos?
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Nossa equipe de especialistas está pronta para analisar seu caso
                  e orientar você sobre os melhores caminhos jurídicos.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href="/contato"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-95"
                  aria-label="Consultar especialista"
                >
                  Consultar Especialista
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>

                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-transparent border border-border text-foreground px-6 py-3 rounded-xl font-bold text-sm hover:bg-muted transition-all active:scale-95"
                  aria-label="Falar com especialista no WhatsApp (abre em nova aba)"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
