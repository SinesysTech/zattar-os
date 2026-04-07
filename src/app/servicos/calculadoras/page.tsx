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
import { ServicosHero } from "../_components/servicos-hero";
import { ServicoWebCard } from "../_components/servico-web-card";

const calculadoras = [
  {
    title: "Rescisão",
    description:
      "Cálculo completo de rescisão trabalhista com todas as verbas por tipo de desligamento.",
    href: "/servicos/calculadoras/rescisao",
    icon: Scale,
  },
  {
    title: "Salário Líquido",
    description:
      "Salário líquido com INSS e IRRF progressivos, adicionais e deduções.",
    href: "/servicos/calculadoras/salario-liquido",
    icon: DollarSign,
  },
  {
    title: "Horas Extras",
    description:
      "Horas extras 50% e 100% com DSR e reflexos em férias, 13º e FGTS.",
    href: "/servicos/calculadoras/horas-extras",
    icon: Clock,
  },
  {
    title: "Férias",
    description:
      "Férias com abono pecuniário, redução por faltas e tributação progressiva.",
    href: "/servicos/calculadoras/ferias",
    icon: Calendar,
  },
  {
    title: "13º Salário",
    description:
      "Gratificação natalina com 1ª e 2ª parcela e deduções progressivas.",
    href: "/servicos/calculadoras/13-salario",
    icon: DollarSign,
  },
  {
    title: "Seguro-Desemprego",
    description:
      "Elegibilidade, valor das parcelas e quantidade de benefícios.",
    href: "/servicos/calculadoras/seguro-desemprego",
    icon: Shield,
  },
  {
    title: "Adicional Noturno",
    description:
      "Adicional de 20% com hora ficta reduzida para trabalho urbano e rural.",
    href: "/servicos/calculadoras/adicional-noturno",
    icon: Moon,
  },
  {
    title: "Insalubridade / Periculosidade",
    description:
      "Adicionais de insalubridade (10-40%) e periculosidade (30%).",
    href: "/servicos/calculadoras/insalubridade-periculosidade",
    icon: AlertTriangle,
  },
  {
    title: "FGTS Acumulado",
    description:
      "Estimativa de saldo FGTS acumulado com depósitos e rendimento.",
    href: "/servicos/calculadoras/fgts-acumulado",
    icon: Landmark,
  },
  {
    title: "Correção Monetária",
    description:
      "Atualização de valores com IPCA-E e Selic conforme ADC 58/STF.",
    href: "/servicos/calculadoras/correcao-monetaria",
    icon: TrendingUp,
  },
];

export default function CalculadorasPublicIndex() {
  return (
    <>
      <ServicosHero
        eyebrow="Ferramentas Jurídicas"
        title="Calculadoras"
        titleHighlight="Trabalhistas."
        description="Selecione a ferramenta de cálculo desejada. Todas atualizadas com a legislação CLT 2026 e tabelas progressivas de INSS/IRRF."
        backHref="/servicos"
        backLabel="Voltar para Serviços"
      />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {calculadoras.map((calc) => (
          <ServicoWebCard
            key={calc.href}
            title={calc.title}
            description={calc.description}
            href={calc.href}
            icon={calc.icon}
            cta="Abrir calculadora"
          />
        ))}
      </section>
    </>
  );
}
