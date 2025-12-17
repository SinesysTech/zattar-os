"use client";

import DotPattern from "./dot-pattern";
import Particles from "./particles";
import { cn } from "@/lib/utils";

export const BackgroundPattern = () => {
  // Cores vibrantes que combinam com a paleta
  const vibrantColors = [
    "#FF6B35", // Laranja vibrante
    "#10B981", // Verde esmeralda/água
    "#06B6D4", // Ciano vibrante
    "#8B5CF6", // Roxo vibrante
  ];

  return (
    <>
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className={cn(
          "[mask-image:radial-gradient(ellipse,rgba(0,0,0,0.3)_30%,black_50%)]",
          "dark:fill-slate-700"
        )}
      />
      <Particles
        className="absolute inset-0"
        quantity={80}
        ease={80}
        colors={vibrantColors}
        size={0.6}
        refresh
      />
    </>
  );
};
