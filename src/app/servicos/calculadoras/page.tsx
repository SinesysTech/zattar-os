"use client";

import { ServiceIndexHeader, ServiceCard } from "@/app/portal/feature/servicos";
import {
  Scale,
  DollarSign,
  Clock,
  Calendar,
  Shield,
  Moon,
  AlertTriangle,
  Landmark,
  TrendingUp,
} from "lucide-react";

export default function CalculadorasPublicIndex() {
  return (
    <>
      <ServiceIndexHeader
        eyebrow="Ferramentas Juridicas"
        title="Calculadoras"
        titleHighlight="Trabalhistas."
        description="Selecione a ferramenta de calculo desejada. Todas atualizadas com a legislacao CLT 2026 e tabelas progressivas de INSS/IRRF."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <ServiceCard
          title="Rescisao"
          description="Calculo completo de rescisao trabalhista com todas as verbas por tipo de desligamento."
          href="/servicos/calculadoras/rescisao"
          icon={Scale}
        />
        <ServiceCard
          title="Salario Liquido"
          description="Salario liquido com INSS e IRRF progressivos, adicionais e deducoes."
          href="/servicos/calculadoras/salario-liquido"
          icon={DollarSign}
        />
        <ServiceCard
          title="Horas Extras"
          description="Horas extras 50% e 100% com DSR e reflexos em ferias, 13o e FGTS."
          href="/servicos/calculadoras/horas-extras"
          icon={Clock}
        />
        <ServiceCard
          title="Ferias"
          description="Ferias com abono pecuniario, reducao por faltas e tributacao progressiva."
          href="/servicos/calculadoras/ferias"
          icon={Calendar}
        />
        <ServiceCard
          title="13o Salario"
          description="Gratificacao natalina com 1a e 2a parcela e deducoes progressivas."
          href="/servicos/calculadoras/13-salario"
          icon={DollarSign}
        />
        <ServiceCard
          title="Seguro-Desemprego"
          description="Elegibilidade, valor das parcelas e quantidade de beneficios."
          href="/servicos/calculadoras/seguro-desemprego"
          icon={Shield}
        />
        <ServiceCard
          title="Adicional Noturno"
          description="Adicional de 20% com hora ficta reduzida para trabalho urbano e rural."
          href="/servicos/calculadoras/adicional-noturno"
          icon={Moon}
        />
        <ServiceCard
          title="Insalubridade / Periculosidade"
          description="Adicionais de insalubridade (10-40%) e periculosidade (30%)."
          href="/servicos/calculadoras/insalubridade-periculosidade"
          icon={AlertTriangle}
        />
        <ServiceCard
          title="FGTS Acumulado"
          description="Estimativa de saldo FGTS acumulado com depositos e rendimento."
          href="/servicos/calculadoras/fgts-acumulado"
          icon={Landmark}
        />
        <ServiceCard
          title="Correcao Monetaria"
          description="Atualizacao de valores com IPCA-E e Selic conforme ADC 58/STF."
          href="/servicos/calculadoras/correcao-monetaria"
          icon={TrendingUp}
        />
      </div>
    </>
  );
}
