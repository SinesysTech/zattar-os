import {
  FileText,
  PiggyBank,
  Landmark,
  ShieldCheck,
  HeartPulse,
  Wallet,
  Bus,
  Briefcase,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

// --- DADOS ESTRUTURADOS ---
// O array de "features" agora contém os direitos trabalhistas,
// com títulos claros, descrições explicativas e ícones temáticos.

const direitosTrabalhistas = [
  {
    icon: Briefcase,
    title: "Carteira de Trabalho Assinada",
    description:
      "A garantia de um vínculo empregatício formal, que assegura o acesso a todos os outros direitos.",
  },
  {
    icon: Gift,
    title: "13º Salário",
    description:
      "Uma gratificação anual correspondente a 1/12 da remuneração por mês trabalhado no ano.",
  },
  {
    icon: PiggyBank,
    title: "Fundo de Garantia (FGTS)",
    description:
      "Uma reserva financeira depositada mensalmente pela empresa, protegendo você em caso de demissão.",
  },
  {
    icon: Landmark,
    title: "Férias Remuneradas + 1/3",
    description:
      "Direito a um período de descanso anual com um adicional de um terço sobre o seu salário.",
  },
  {
    icon: Wallet,
    title: "Pagamento Correto de Horas Extras",
    description:
      "Remuneração com acréscimo de no mínimo 50% para todo o tempo trabalhado além da jornada normal.",
  },
  {
    icon: HeartPulse,
    title: "Descanso Semanal Remunerado",
    description:
      "Um dia de folga por semana, preferencialmente aos domingos, sem prejuízo no seu salário.",
  },
  {
    icon: ShieldCheck,
    title: "Proteção Contra Assédio Moral",
    description:
      "Direito a um ambiente de trabalho respeitoso, livre de humilhações e situações constrangedoras.",
  },
  {
    icon: Bus,
    title: "Vale-Transporte",
    description:
      "O empregador deve adiantar o valor para o deslocamento entre sua casa e o trabalho.",
  },
  {
    icon: FileText,
    title: "Respeito à Convenção Coletiva",
    description:
      "As regras negociadas pelo sindicato da sua categoria, como piso salarial, devem ser cumpridas.",
  },
];

const FeaturesPage = () => {
  return (
    <section id="direitos-essenciais" className="bg-muted/30 text-foreground py-16 sm:py-24">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Título principal revisado para o contexto de direitos */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight max-w-4xl mx-auto font-display">
            Direitos Essenciais: A Base Para um Trabalho Justo e Digno
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-3xl mx-auto">
            A legislação brasileira estabelece uma série de garantias para proteger o trabalhador.
            Conheça algumas das principais:
          </p>
        </div>

        {/* Grid de features/direitos */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {direitosTrabalhistas.map((direito) => (
            <Link key={direito.title} href="#" className="h-full">
              {/* O Link pode levar para uma página detalhada sobre aquele direito */}
              <div className="flex flex-col h-full gap-4 p-6 rounded-xl border border-border/50 hover:border-border transition-colors bg-background/80 hover:bg-background">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <direito.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold tracking-tight text-lg block">
                      {direito.title}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {direito.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Parágrafo final revisado e posicionado após o grid */}
        <div className="mt-20 text-center max-w-4xl mx-auto">
          <p className="text-lg text-muted-foreground">
            Infelizmente, o desrespeito a esses e muitos outros direitos ainda é uma realidade. Se
            você acredita que sua dignidade ou seus direitos estão sendo violados, saiba que a
            Justiça do Trabalho existe para garantir o que é seu.
          </p>
          <Button size="lg" className="mt-8 rounded-full">
            Fale com um especialista
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesPage;
