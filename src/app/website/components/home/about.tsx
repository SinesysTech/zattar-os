import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { GlowBackground } from "../effects/glow-background";

export function About() {
  return (
    <section className="py-16 sm:py-20 md:py-32 bg-surface-container-low">
      <div className="container mx-auto px-5 sm:px-6 md:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 lg:gap-20 items-center">
          <div className="relative order-2 md:order-1">
            <div className="relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden z-10 shadow-2xl">
              <Image
                src="/website/home/about-team.jpg"
                alt="Equipe técnica trabalhando em escritório futurista escuro com monitores de dados"
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover opacity-85 hover:opacity-100 motion-safe:transition-all motion-safe:duration-700"
              />
            </div>
            <GlowBackground variant="accent-top-right" />
          </div>

          <div className="order-1 md:order-2">
            <Text variant="marketing-overline">A Revolução Jurídica</Text>
            <Heading level="marketing-section" className="mt-4 md:mt-6 mb-6 md:mb-8">
              O Direito do Trabalho <br />
              <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
                reimaginado.
              </span>
            </Heading>
            <Text variant="marketing-lead" className="mb-7 md:mb-9">
              Esqueça a burocracia lenta e o atendimento distante. Na Zattar Advogados, utilizamos automação inteligente para acelerar o protocolo de petições e análise de provas, mantendo você informado em tempo real.
            </Text>

            <ul className="space-y-5 md:space-y-6 mb-8 md:mb-12">
              <li className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 shrink-0 mt-0.5">
                  <CheckCircle className="text-primary w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <Heading level="subsection" as="h3" className="mb-1 text-foreground">
                    Transparência Digital
                  </Heading>
                  <Text variant="caption" className="text-foreground/85">
                    Acompanhe seu caso através do nosso dashboard exclusivo.
                  </Text>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 shrink-0 mt-0.5">
                  <CheckCircle className="text-primary w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <Heading level="subsection" as="h3" className="mb-1 text-foreground">
                    Inteligência Preditiva
                  </Heading>
                  <Text variant="caption" className="text-foreground/85">
                    Análise estatística de decisões para aumentar as chances de êxito.
                  </Text>
                </div>
              </li>
            </ul>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <Button asChild size="lg" className="rounded-xl h-12 px-8 text-base">
                <Link href="/contato">Fale com um Especialista</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="marketing-outline"
                className="rounded-xl h-12 px-8 text-base"
              >
                <Link href="/expertise">Conheça nossa Metodologia</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
