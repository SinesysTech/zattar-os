"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Scale, ArrowUpRight, Globe, Lightbulb, ShieldCheck, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// Tipagem dos dados (sem testimonial)
type PilarDeAtuacao = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  principles: string[];
  image?: string;
};

// --- CONTEÚDO SEM A SEÇÃO DE DEPOIMENTOS ---
const pilaresDeAtuacao: PilarDeAtuacao[] = [
  {
    id: "nossa-causa",
    name: "Nossa Causa",
    description:
      "Acima de tudo, somos um escritório que atua na defesa dos trabalhadores. Atuamos com princípios claros, buscando na Justiça aquilo que é seu por direito contra os abusos que podem ocorrer no seu ambiente de trabalho. Nossa missão é ser a sua voz.",
    icon: Scale,
    color: "text-red-500",
    principles: [
      "Defesa intransigente dos direitos garantidos pela CLT.",
      "Atuação ética e focada nos interesses do trabalhador.",
      "Combate a todas as formas de assédio e dano moral.",
      "Buscamos a justiça como pilar para a dignidade no trabalho.",
    ],
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800",
  },
  {
    id: "vanguarda-apps",
    name: "Vanguarda em Apps",
    description:
      "Como parte central da nossa causa, somos referência na defesa dos trabalhadores de aplicativos. Mapeamos as novas formas de fraude e precarização para garantir que a tecnologia sirva ao progresso, e não para burlar direitos.",
    icon: ShieldCheck,
    color: "text-blue-500",
    principles: [
      "Análise profunda das dinâmicas de trabalho em plataformas digitais.",
      "Uso de tecnologia e inovação jurídica a favor do trabalhador.",
      "Construção de teses pioneiras para a proteção desta nova classe.",
      "Atuação como referência nacional na vanguarda do Direito do Trabalho.",
    ],
    image: "https://images.unsplash.com/photo-1629838422637-9b9998131805?q=80&w=800",
  },
  {
    id: "vinculo-empregaticio",
    name: "Vínculo Empregatício",
    description:
      "Nossa principal ferramenta jurídica é demonstrar a realidade da relação de trabalho. Provamos que os requisitos da CLT (pessoalidade, onerosidade, não eventualidade e subordinação) estão presentes e devem ser reconhecidos.",
    icon: Handshake,
    color: "text-indigo-500",
    principles: [
      "Análise aprofundada dos requisitos da CLT no seu caso concreto.",
      "Busca por direitos essenciais como Férias, 13º salário e FGTS.",
      "Utilização de provas digitais e da realidade dos fatos.",
      "Aplicação da jurisprudência mais atualizada sobre o tema.",
    ],
    image: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=800",
  },
  {
    id: "atuacao-completa",
    name: "Atuação Completa",
    description:
      "Sabemos que a vida do trabalhador tem múltiplos desafios. Por isso, oferecemos suporte em outras áreas do Direito Civil e cultivamos uma cultura de total transparência, honrando a confiança que você deposita em nós.",
    icon: Globe,
    color: "text-green-500",
    principles: [
      "Suporte em Direito Civil para um cuidado integral do cliente.",
      "Transparência total sobre cada andamento do processo.",
      "Responsabilidade e zelo pela confiança depositada.",
      "Comunicação clara, constante e humanizada.",
    ],
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=800",
  },
  {
    id: "consultoria-preventiva",
    name: "Consultoria Preventiva",
    description:
      "Acreditamos na construção de um futuro do trabalho mais justo. Por isso, prestamos consultoria para empresas com visão humanista que buscam construir ambientes saudáveis e respeitosos, alinhados com a legislação.",
    icon: Lightbulb,
    color: "text-orange-500",
    principles: [
      "Foco na construção de ambientes de trabalho positivos.",
      "Alinhamento das práticas da empresa com as leis trabalhistas.",
      "Visão humanista como pilar da gestão de pessoas.",
      "Redução de passivos trabalhistas através do respeito mútuo.",
    ],
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800",
  },
];

export default function AboutSectionCompanyValues() {
  const [activeValue, setActiveValue] = useState<string>(pilaresDeAtuacao[0].id);

  const currentValue =
    pilaresDeAtuacao.find((value) => value.id === activeValue) || pilaresDeAtuacao[0];

  return (
    <section id="quem-somos" className="py-16 sm:py-24 bg-muted">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* --- TÍTULOS PRINCIPAIS REVISADOS --- */}
        <div className="mx-auto mb-16 max-w-4xl space-y-4 text-center">
          <div className="bg-primary/10 text-primary inline-block rounded-lg px-3 py-1 text-sm font-semibold">
            Nossos Pilares de Atuação
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground font-display">
            Princípios que guiam nossa luta por justiça
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Nossos valores não são apenas palavras. São as diretrizes que definem cada estratégia em
            nossa missão pela dignidade de todos os trabalhadores.
          </p>
        </div>

        <Tabs value={activeValue} onValueChange={setActiveValue} className="space-y-8">
          {/* Seleção de abas (Tabs/Dropdown) */}
          <div className="mb-8 flex justify-center">
            {/* Dropdown para telas pequenas */}
            <div className="w-full md:hidden">
              <Select value={activeValue} onValueChange={setActiveValue}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um pilar" />
                </SelectTrigger>
                <SelectContent>
                  {pilaresDeAtuacao.map((value) => (
                    <SelectItem key={value.id} value={value.id}>
                      <div className="flex items-center gap-2">
                        <value.icon className={cn("h-4 w-4", value.color)} />
                        <span>{value.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabs para telas médias e grandes */}
            <TabsList className="hidden h-auto bg-background p-1 md:flex flex-wrap justify-center border border-border/50 shadow-sm">
              {pilaresDeAtuacao.map((value) => (
                <TabsTrigger
                  key={value.id}
                  value={value.id}
                  className={cn(
                    "data-[state=active]:bg-background gap-2",
                    "data-[state=active]:border-border border border-transparent"
                  )}
                >
                  <value.icon className={cn("h-4 w-4", value.color)} />
                  <span>{value.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Conteúdo da aba selecionada */}
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Coluna da Esquerda: Detalhes */}
            <div className="space-y-6">
              <div className="mb-6 flex items-center gap-4">
                <div className={cn("rounded-xl p-3", "bg-background shadow-sm")}>
                  <currentValue.icon className={cn("h-8 w-8", currentValue.color)} />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-display">
                  {currentValue.name}
                </h3>
              </div>

              <p className="text-muted-foreground text-lg leading-relaxed">
                {currentValue.description}
              </p>

              <div className="space-y-4 pt-4">
                <h4 className="font-semibold text-foreground text-base sm:text-lg md:text-xl">
                  Princípios-chave:
                </h4>
                <ul className="space-y-3">
                  {currentValue.principles.map((principle, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <ArrowUpRight
                        className={cn("mt-1 h-5 w-5 shrink-0", currentValue.color)}
                      />
                      <span className="text-muted-foreground leading-relaxed">{principle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Coluna da Direita: Imagem */}
            <div className="hidden lg:block">
              <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-border/20">
                {currentValue.image ? (
                  <Image
                    src={currentValue.image}
                    alt={`Imagem ilustrativa do pilar ${currentValue.name} - ${currentValue.description.substring(0, 100)}...`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-linear-to-br from-primary/5 to-primary/10">
                    <currentValue.icon className={cn("h-16 w-16", currentValue.color)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Tabs>

        {/* --- CHAMADA PARA AÇÃO (CTA) REVISADA --- */}
        <div className="mt-24 text-center">
          <p className="text-muted-foreground mx-auto mb-6 max-w-2xl text-lg">
            Seus direitos são a nossa prioridade. Se você se identifica com alguma dessas situações,
            estamos prontos para lutar por você.
          </p>
          <Button asChild size="lg" className="text-base min-h-[48px] rounded-full px-8">
            <Link href="/contato">
              Fale com um Especialista <ArrowUpRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
