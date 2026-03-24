import { HorasExtrasCalculator } from "@/features/calculadoras";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cálculo de Horas Extras - Magistrate AI",
  description: "Faça o cálculo de suas horas extras",
};

export default function HorasExtrasPage() {
  return (
    <div className="w-full">
      <HorasExtrasCalculator />
    </div>
  );
}
