"use client";
import { cn } from "@/lib/utils";
import React from "react";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";
import { FilePenLine, Gavel, Handshake, ChevronsUp, Landmark } from "lucide-react";
import { motion } from "framer-motion";

// Componente gráfico para Petição Inicial
const PeticaoInicialGraphic = () => {
  const variants = {
    initial: {
      y: 0,
      opacity: 0.8,
    },
    animate: {
      y: -10,
      opacity: 1,
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="flex flex-1 w-full h-full min-h-24 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 flex-col space-y-2 p-4 rounded-lg"
    >
      <motion.div variants={variants} className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3 bg-white dark:bg-black/50 rounded-lg p-3 shadow-sm">
          <FilePenLine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div className="h-3 bg-blue-200 dark:bg-blue-800 rounded-full flex-1" />
        </div>
        <div className="bg-white dark:bg-black/50 rounded-lg p-3 shadow-sm">
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full" />
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente gráfico para Audiência
const AudienciaGraphic = () => {
  const variants = {
    initial: {
      scale: 1,
      rotate: 0,
    },
    animate: {
      scale: 1.05,
      rotate: 5,
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  };

  return (
    <motion.div className="flex flex-1 w-full h-full min-h-24 bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 flex-col justify-center items-center p-4 rounded-lg">
      <motion.div variants={variants} initial="initial" animate="animate" className="relative">
        <div className="bg-white dark:bg-black/50 rounded-full p-6 shadow-lg">
          <Gavel className="h-12 w-12 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 rounded-full animate-pulse" />
      </motion.div>
      <div className="mt-4 flex space-x-2">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-amber-400 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Componente gráfico para Conciliação
const ConciliacaoGraphic = () => {
  const handshakeVariants = {
    initial: {
      x: 0,
    },
    animate: {
      x: [0, 10, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
      },
    },
  };

  return (
    <motion.div className="flex flex-1 w-full h-full min-h-24 bg-linear-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 flex-col justify-center items-center p-4 rounded-lg">
      <motion.div
        variants={handshakeVariants}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-black/50 rounded-xl p-6 shadow-lg"
      >
        <Handshake className="h-12 w-12 text-green-600 dark:text-green-400" />
      </motion.div>
      <div className="mt-4 flex space-x-1">
        <div className="w-8 h-2 bg-green-300 dark:bg-green-700 rounded-full" />
        <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full" />
        <div className="w-8 h-2 bg-green-300 dark:bg-green-700 rounded-full" />
      </div>
    </motion.div>
  );
};

// Componente gráfico para Recurso
const RecursoGraphic = () => {
  const arrowVariants = {
    initial: {
      y: 0,
    },
    animate: {
      y: -20,
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  };

  return (
    <motion.div className="flex flex-1 w-full h-full min-h-24 bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 flex-col justify-center items-center p-4 rounded-lg">
      <motion.div
        variants={arrowVariants}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-black/50 rounded-lg p-4 shadow-lg"
      >
        <ChevronsUp className="h-12 w-12 text-purple-600 dark:text-purple-400" />
      </motion.div>
      <div className="mt-4 space-y-1">
        <div className="h-1 w-12 bg-purple-300 dark:bg-purple-700 rounded-full mx-auto" />
        <div className="h-1 w-8 bg-purple-400 dark:bg-purple-600 rounded-full mx-auto" />
        <div className="h-1 w-4 bg-purple-500 dark:bg-purple-500 rounded-full mx-auto" />
      </div>
    </motion.div>
  );
};

// Componente gráfico para Tribunais Superiores
const TribunaisSuperioresGraphic = () => {
  const buildingVariants = {
    initial: {
      scale: 1,
    },
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
      },
    },
  };

  return (
    <motion.div className="flex flex-1 w-full h-full min-h-24 bg-linear-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 flex-col justify-center items-center p-4 rounded-lg relative overflow-hidden">
      <motion.div
        variants={buildingVariants}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-black/50 rounded-lg p-6 shadow-lg relative z-10"
      >
        <Landmark className="h-12 w-12 text-red-600 dark:text-red-400" />
      </motion.div>

      {/* Elementos decorativos de colunas */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="w-2 bg-red-200 dark:bg-red-800"
            style={{ height: `${20 + i * 5}%` }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default function NovasEtapasProcessuais() {
  return (
    <section id="processo" className="bg-background text-foreground py-16 sm:py-24">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-display mb-6">
            Navegue Conosco por Todas as{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
              Etapas do Processo
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Defendemos seus direitos com estratégia e transparência em cada fase. Entenda como
            atuamos para garantir o melhor resultado para você.
          </p>
        </div>

        {/* BentoGrid */}
        <BentoGrid className="max-w-6xl mx-auto md:auto-rows-[20rem]">
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              className={cn("[&>p:text-lg]", item.className)}
              icon={item.icon}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}

const items = [
  {
    title: "Petição Inicial",
    description: (
      <span className="text-sm">
        É o pontapé inicial. Elaboramos um documento detalhado que conta a sua história, apresenta
        os fatos, as provas e fundamenta todos os seus direitos perante a Justiça.
      </span>
    ),
    header: <PeticaoInicialGraphic />,
    className: "md:col-span-2",
    icon: <FilePenLine className="h-4 w-4 text-blue-500" />,
  },
  {
    title: "Audiência",
    description: (
      <span className="text-sm">
        Momento central do processo, onde apresentamos as provas e argumentos ao juiz. Nossa atuação
        é estratégica para conduzir os depoimentos.
      </span>
    ),
    header: <AudienciaGraphic />,
    className: "md:col-span-1",
    icon: <Gavel className="h-4 w-4 text-amber-500" />,
  },
  {
    title: "Conciliação",
    description: (
      <span className="text-sm">
        Avaliamos propostas de acordo e negociamos ativamente para buscar uma solução justa e rápida
        que seja vantajosa para você.
      </span>
    ),
    header: <ConciliacaoGraphic />,
    className: "md:col-span-1",
    icon: <Handshake className="h-4 w-4 text-green-500" />,
  },
  {
    title: "Recurso para a Segunda Instância",
    description: (
      <span className="text-sm">
        Caso a decisão inicial não seja favorável, elaboramos um recurso técnico para que um grupo
        de juízes reavalie o seu caso.
      </span>
    ),
    header: <RecursoGraphic />,
    className: "md:col-span-1",
    icon: <ChevronsUp className="h-4 w-4 text-purple-500" />,
  },
  {
    title: "Recurso aos Tribunais Superiores",
    description: (
      <span className="text-sm">
        Para questões complexas que envolvem interpretação da lei federal, levamos o seu caso às
        mais altas cortes do país em Brasília.
      </span>
    ),
    header: <TribunaisSuperioresGraphic />,
    className: "md:col-span-1",
    icon: <Landmark className="h-4 w-4 text-red-500" />,
  },
];
