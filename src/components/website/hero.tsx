import Link from "next/link";
import { Button } from "./ui/button";
import { BackgroundPattern } from "./ui/background-pattern";
import { Message, Search } from "@mynaui/icons-react";
import { getMeuProcessoUrl } from "@/lib/urls";
import { Shield, Award, Users, Scale } from "lucide-react";

// Badges de confiança
const trustBadges = [
  { icon: Shield, label: "OAB/MG" },
  { icon: Award, label: "15+ Anos" },
  { icon: Users, label: "2.500+ Clientes" },
  { icon: Scale, label: "Especialistas" },
];

const Hero = () => {
  return (
    <section
      id="inicio"
      className="relative min-h-[85vh] flex items-center justify-center bg-background pt-28 md:pt-32 pb-16"
    >
      <div className="absolute inset-0">
        <BackgroundPattern />
      </div>

      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Trust Badges - Above headline */}
          <div className="flex items-center justify-center gap-4 md:gap-6 flex-wrap mb-8">
            {trustBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <badge.icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{badge.label}</span>
              </div>
            ))}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.15] tracking-tight font-display">
            Uma vida digna se constrói sobre um{" "}
            <span className="text-primary">trabalho justo</span>.
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A legislação trabalhista estrutura as bases para essa relação. Atuamos com
            especialização e rigor técnico para orientar e garantir que os direitos que promovem o
            respeito e a equidade no ambiente de trabalho sejam efetivados.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Button asChild size="lg" className="rounded-full text-base min-h-12 px-8">
              <Link href={getMeuProcessoUrl()}>
                Consultar Processo <Search className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full text-base shadow-none min-h-12 px-8"
            >
              <Message className="h-5 w-5 mr-2" /> Agendar Consulta
            </Button>
          </div>

          {/* Social Proof Micro-stat */}
          <div className="mt-12 pt-8 border-t border-border/30">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">+ de R$ 50 milhões</span> recuperados
              para nossos clientes em ações trabalhistas
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
