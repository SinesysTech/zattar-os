"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

// Tipagem para depoimentos
type Depoimento = {
  id: string;
  nome: string;
  cargo: string;
  empresa?: string;
  foto: string;
  texto: string;
  resultado?: string;
  estrelas: number;
};

// Dados dos depoimentos (placeholder - substituir por dados reais)
const depoimentos: Depoimento[] = [
  {
    id: "1",
    nome: "Maria Silva",
    cargo: "Ex-funcionaria",
    empresa: "Empresa de Tecnologia",
    foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&h=150&fit=crop",
    texto:
      "Apos anos trabalhando sem registro, finalmente tive meus direitos reconhecidos gracas ao trabalho incansavel da equipe Zattar. Recebi todas as verbas que me eram devidas e recuperei minha dignidade.",
    resultado: "Reconhecimento de vinculo + verbas rescisorias",
    estrelas: 5,
  },
  {
    id: "2",
    nome: "Carlos Oliveira",
    cargo: "Motorista de Aplicativo",
    foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&h=150&fit=crop",
    texto:
      "Eu nao acreditava que tinha direitos como motorista de app. A Zattar me mostrou que sim, e lutou por mim ate conseguirmos a vitoria. Profissionais serios e comprometidos.",
    resultado: "Reconhecimento de vinculo empregaticio",
    estrelas: 5,
  },
  {
    id: "3",
    nome: "Ana Paula Santos",
    cargo: "Auxiliar Administrativa",
    foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&h=150&fit=crop",
    texto:
      "Sofri assedio moral por meses e nao sabia como agir. O escritorio me acolheu, explicou cada passo e conseguimos uma indenizacao justa. Me senti amparada durante todo o processo.",
    resultado: "Indenizacao por danos morais",
    estrelas: 5,
  },
  {
    id: "4",
    nome: "Roberto Mendes",
    cargo: "Gerente de Operacoes",
    empresa: "Industria Metalurgica",
    foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&h=150&fit=crop",
    texto:
      "Fui demitido apos 15 anos de empresa sem receber corretamente. A equipe analisou tudo minuciosamente e identificou diferencas que eu nem imaginava. Excelente trabalho tecnico.",
    resultado: "Recuperacao de diferencas salariais e FGTS",
    estrelas: 5,
  },
];

// Metricas de confianca
const metricas = [
  { valor: "15+", label: "Anos de Experiencia" },
  { valor: "2.500+", label: "Casos Atendidos" },
  { valor: "95%", label: "Taxa de Sucesso" },
  { valor: "R$ 50M+", label: "Recuperados para Clientes" },
];

export default function Depoimentos() {
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const nextDepoimento = () => {
    setActiveIndex((prev) => (prev + 1) % depoimentos.length);
  };

  const prevDepoimento = () => {
    setActiveIndex((prev) => (prev - 1 + depoimentos.length) % depoimentos.length);
  };

  const currentDepoimento = depoimentos[activeIndex];

  return (
    <section id="depoimentos" className="py-16 sm:py-24 bg-muted">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="bg-primary/10 text-primary inline-block rounded-lg px-3 py-1 text-sm font-semibold mb-4">
            Depoimentos
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-display mb-6">
            Historias de Quem Confiou em Nos
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Cada cliente representa uma luta por justica. Veja o que dizem aqueles que confiaram no
            nosso trabalho.
          </p>
        </div>

        {/* Metricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {metricas.map((metrica, index) => (
            <motion.div
              key={metrica.label}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-xl bg-background border border-border/50"
            >
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">
                {metrica.valor}
              </div>
              <div className="text-sm text-muted-foreground">{metrica.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Carrossel de Depoimentos */}
        <div className="relative bg-background rounded-2xl border border-border/50 p-8 md:p-12 shadow-sm">
          {/* Quote Icon */}
          <div className="absolute top-6 left-6 md:top-8 md:left-8">
            <Quote className="h-10 w-10 text-primary/20" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentDepoimento.id}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12"
            >
              {/* Foto e Info */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left shrink-0">
                <div className="relative mb-4">
                  <Image
                    src={currentDepoimento.foto}
                    alt={`Foto de ${currentDepoimento.nome}`}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-primary/20"
                    width={128}
                    height={128}
                  />
                </div>
                <h3 className="font-semibold text-lg text-foreground">{currentDepoimento.nome}</h3>
                <p className="text-sm text-muted-foreground">{currentDepoimento.cargo}</p>
                {currentDepoimento.empresa && (
                  <p className="text-xs text-muted-foreground">{currentDepoimento.empresa}</p>
                )}

                {/* Estrelas */}
                <div className="flex gap-1 mt-3">
                  {Array.from({ length: currentDepoimento.estrelas }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-orange-400 text-orange-400" />
                  ))}
                </div>
              </div>

              {/* Texto do Depoimento */}
              <div className="flex-1">
                <blockquote className="text-lg md:text-xl text-foreground leading-relaxed mb-6">
                  &ldquo;{currentDepoimento.texto}&rdquo;
                </blockquote>

                {currentDepoimento.resultado && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Resultado: {currentDepoimento.resultado}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navegacao */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
            {/* Indicadores */}
            <div className="flex gap-2">
              {depoimentos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200 cursor-pointer",
                    index === activeIndex
                      ? "bg-primary w-6"
                      : "bg-border hover:bg-muted-foreground"
                  )}
                  aria-label={`Ver depoimento ${index + 1}`}
                />
              ))}
            </div>

            {/* Botoes de Navegacao */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevDepoimento}
                className="rounded-full"
                aria-label="Depoimento anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextDepoimento}
                className="rounded-full"
                aria-label="Proximo depoimento"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* CTA apos Social Proof */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Voce tambem merece ter seus direitos respeitados. Fale conosco e descubra como podemos
            ajudar.
          </p>
          <Button size="lg" className="rounded-full text-base">
            Agendar Consulta Gratuita
          </Button>
        </div>
      </div>
    </section>
  );
}
