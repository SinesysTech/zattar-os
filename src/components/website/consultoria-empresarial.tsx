"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { AreaChart, ArrowUpRight, Globe, Heart, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// Tipagem para os pilares da consultoria (sem testimonial)
type ConsultancyPillar = {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  principles: string[];
  image?: string;
};

// Dados dos pilares da consultoria preventiva (sem testimonial)
const consultancyPillars: ConsultancyPillar[] = [
  {
    id: "compliance",
    name: "Compliance Estratégico",
    description:
      "Transformamos a complexidade da legislação trabalhista em uma vantagem competitiva. Através de um parecer técnico personalizado, mergulhamos no seu ramo de negócio e nas especificidades de suas equipes para garantir total conformidade com a CLT, Normas Regulamentadoras e, crucialmente, com os Acordos e Convenções Coletivas. Nosso foco é a prevenção inteligente, construindo uma base jurídica sólida que protege sua empresa e ampara seus colaboradores.",
    icon: ShieldCheck,
    color: "text-blue-500",
    principles: [
      "Análise aprofundada do enquadramento sindical e setorial.",
      "Garantia de conformidade com Acordos e Convenções Coletivas (CCT/ACT).",
      "Mitigação proativa de riscos e prevenção de litígios.",
      "Tradução da legislação em planos de ação práticos e claros.",
    ],
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800",
  },
  {
    id: "diagnostico",
    name: "Diagnóstico Preciso e Contextualizado",
    description:
      "A teoria sem a prática é incompleta. Por isso, realizamos avaliações in loco em todo o Brasil. Esta imersão na realidade da sua empresa nos permite analisar as dinâmicas de trabalho, as condições do ambiente e a cultura organizacional de forma tangível. O resultado é um diagnóstico que vai além do papel, identificando riscos ocultos e oportunidades de melhoria que só a vivência presencial pode revelar.",
    icon: Globe,
    color: "text-green-500",
    principles: [
      "Imersão completa na rotina e no ambiente de trabalho da sua empresa.",
      "Análise detalhada das condições ergonômicas e de segurança.",
      "Identificação de gargalos operacionais e culturais com impacto jurídico.",
      "Recomendações baseadas na realidade observada, não em suposições.",
    ],
    image: "https://images.unsplash.com/photo-1581092921539-a0a4592a2a86?q=80&w=800",
  },
  {
    id: "cultura",
    name: "Cultura de Valorização e Produtividade",
    description:
      "Um ambiente de trabalho em conformidade é o ponto de partida, não a chegada. Apresentamos estratégias para fomentar uma cultura onde os funcionários se sentem mais felizes, saudáveis e engajados. Iniciativas como gestão de estresse, programas de salário indireto e acompanhamento de potencialidades individuais não são custos, mas investimentos que se revertem diretamente em maior produtividade e retenção de talentos.",
    icon: Heart,
    color: "text-red-500",
    principles: [
      "Fomento à saúde mental e ao equilíbrio vida-trabalho.",
      "Implementação de benefícios estratégicos (salário indireto).",
      "Desenvolvimento de planos de carreira e reconhecimento.",
      "Construção de um employer branding positivo e autêntico.",
    ],
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800",
  },
  {
    id: "risco",
    name: "Gestão de Risco e Inteligência Financeira",
    description:
      "A economia que ignora direitos trabalhistas é uma ilusão de curto prazo com um custo altíssimo. Dados da Justiça do Trabalho, que apontam para mais de R$ 39 bilhões pagos em condenações anuais, provam que o passivo trabalhista é um risco financeiro real. Nossa abordagem transforma o compliance em uma ferramenta de gestão de risco, protegendo o caixa da empresa e otimizando o retorno sobre o investimento (ROI) em boas práticas.",
    icon: AreaChart,
    color: "text-orange-500",
    principles: [
      "Análise de dados para projeção e redução do passivo trabalhista.",
      "Quantificação do Retorno sobre o Investimento (ROI) em compliance.",
      "Proteção do caixa da empresa contra custos processuais e condenações.",
      "Decisões baseadas em dados para uma gestão financeira mais segura.",
    ],
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800",
  },
];

export default function PreventiveConsultancySection() {
  const [activePillar, setActivePillar] = useState<string>(consultancyPillars[0].id);

  const currentPillar =
    consultancyPillars.find((pillar) => pillar.id === activePillar) || consultancyPillars[0];

  return (
    <section id="consultoria" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="mx-auto mb-16 max-w-4xl space-y-4 text-center">
          <div className="bg-primary/10 text-primary inline-block rounded-lg px-3 py-1 text-sm font-semibold">
            Nossa Metodologia
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground font-display">
            Nossos Pilares para um Ambiente de Trabalho Seguro e Produtivo
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Vamos além do compliance. Criamos ecossistemas corporativos onde a segurança jurídica, o
            bem-estar dos colaboradores e a performance financeira caminham juntos, transformando
            passivos em ativos estratégicos.
          </p>
        </div>

        <Tabs value={activePillar} onValueChange={setActivePillar} className="space-y-8">
          {/* Seleção de pilar - Abas para telas md+ e Dropdown para telas menores */}
          <div className="mb-8 flex justify-center">
            {/* Dropdown para telas pequenas */}
            <div className="w-full md:hidden">
              <Select value={activePillar} onValueChange={setActivePillar}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um pilar" />
                </SelectTrigger>
                <SelectContent>
                  {consultancyPillars.map((pillar) => (
                    <SelectItem key={pillar.id} value={pillar.id}>
                      <div className="flex items-center gap-2">
                        <pillar.icon className={cn("h-4 w-4", pillar.color)} />
                        <span>{pillar.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Abas para telas médias e maiores */}
            <TabsList className="hidden h-auto bg-muted/50 p-1 md:flex border border-border/50">
              {consultancyPillars.map((pillar) => (
                <TabsTrigger
                  key={pillar.id}
                  value={pillar.id}
                  className={cn(
                    "data-[state=active]:bg-background data-[state=active]:border-border border border-transparent gap-2",
                    "px-4 py-2"
                  )}
                >
                  <pillar.icon className={cn("h-4 w-4", pillar.color)} />
                  <span>{pillar.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Conteúdo do pilar */}
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Coluna da esquerda: Detalhes do pilar */}
            <div className="space-y-6">
              <div className="mb-6 flex items-center gap-4">
                <div className={cn("rounded-xl p-3", "bg-muted")}>
                  <currentPillar.icon className={cn("h-8 w-8", currentPillar.color)} />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-display">
                  {currentPillar.name}
                </h3>
              </div>

              <p className="text-muted-foreground text-lg leading-relaxed">
                {currentPillar.description}
              </p>

              <div className="space-y-4 pt-4">
                <h4 className="font-semibold text-foreground text-base sm:text-lg md:text-xl">
                  Princípios Chave:
                </h4>
                <ul className="space-y-3">
                  {currentPillar.principles.map((principle, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <ArrowUpRight
                        className={cn("mt-1 h-5 w-5 shrink-0", currentPillar.color)}
                      />
                      <span className="text-muted-foreground leading-relaxed">{principle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Coluna da direita: Imagem ou visual */}
            <div className="hidden lg:block">
              <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-border/20">
                {currentPillar.image ? (
                  <Image
                    src={currentPillar.image}
                    alt={`Imagem ilustrativa do pilar ${currentPillar.name} - ${currentPillar.description.substring(0, 100)}...`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-linear-to-br from-primary/5 to-primary/10">
                    <currentPillar.icon className={cn("h-16 w-16", currentPillar.color)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Tabs>

        {/* Call-to-action */}
        <div className="mt-20 text-center">
          <h3 className="text-xl font-semibold mb-4 text-foreground">
            Pronto para transformar a gestão trabalhista da sua empresa?
          </h3>
          <p className="text-muted-foreground mx-auto mb-6 max-w-2xl">
            Vamos construir juntos um ambiente de trabalho mais seguro, justo e produtivo.
          </p>
          <Button asChild size="lg" className="min-h-[48px] rounded-full px-8">
            <Link href="/contato">Agende uma Consulta Estrategica</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
