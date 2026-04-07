import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ServicosHero } from "../../_components/servicos-hero";

interface CalculadoraMeta {
  loader: () => Promise<{ default: React.ComponentType }>;
  title: string;
  titleHighlight: string;
  description: string;
}

const CALCULADORAS: Record<string, CalculadoraMeta> = {
  rescisao: {
    loader: () =>
      import("@/app/portal/(dashboard)/servicos/calculadoras/rescisao/page"),
    title: "Cálculo de",
    titleHighlight: "Rescisão.",
    description:
      "Simule o cálculo completo da sua rescisão por tipo de desligamento, com todas as verbas e tributação progressiva atualizadas.",
  },
  "salario-liquido": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/calculadoras/salario-liquido/page"
      ),
    title: "Salário",
    titleHighlight: "Líquido.",
    description:
      "Calcule seu salário líquido aplicando INSS e IRRF progressivos, adicionais e deduções legais.",
  },
  "horas-extras": {
    loader: () =>
      import("@/app/portal/(dashboard)/servicos/calculadoras/horas-extras/page"),
    title: "Horas",
    titleHighlight: "Extras.",
    description:
      "Horas extras 50% e 100% com DSR e reflexos em férias, 13º salário e FGTS.",
  },
  ferias: {
    loader: () =>
      import("@/app/portal/(dashboard)/servicos/calculadoras/ferias/page"),
    title: "Cálculo de",
    titleHighlight: "Férias.",
    description:
      "Férias com abono pecuniário, redução por faltas e tributação progressiva.",
  },
  "13-salario": {
    loader: () =>
      import("@/app/portal/(dashboard)/servicos/calculadoras/13-salario/page"),
    title: "13º",
    titleHighlight: "Salário.",
    description:
      "Gratificação natalina com 1ª e 2ª parcela e deduções progressivas.",
  },
  "seguro-desemprego": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/calculadoras/seguro-desemprego/page"
      ),
    title: "Seguro-",
    titleHighlight: "Desemprego.",
    description:
      "Verifique elegibilidade, valor das parcelas e quantidade de benefícios.",
  },
  "adicional-noturno": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/calculadoras/adicional-noturno/page"
      ),
    title: "Adicional",
    titleHighlight: "Noturno.",
    description:
      "Adicional de 20% com hora ficta reduzida para trabalho urbano e rural.",
  },
  "insalubridade-periculosidade": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/calculadoras/insalubridade-periculosidade/page"
      ),
    title: "Insalubridade /",
    titleHighlight: "Periculosidade.",
    description:
      "Adicionais de insalubridade (10% a 40%) e periculosidade (30%).",
  },
  "fgts-acumulado": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/calculadoras/fgts-acumulado/page"
      ),
    title: "FGTS",
    titleHighlight: "Acumulado.",
    description:
      "Estimativa de saldo FGTS acumulado com depósitos mensais e rendimento.",
  },
  "correcao-monetaria": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/calculadoras/correcao-monetaria/page"
      ),
    title: "Correção",
    titleHighlight: "Monetária.",
    description:
      "Atualização de valores com IPCA-E e Selic conforme ADC 58/STF.",
  },
};

export default async function CalculadoraPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = CALCULADORAS[slug];
  if (!meta) notFound();

  const Component = dynamic(meta.loader);

  return (
    <>
      <ServicosHero
        eyebrow="Calculadora Trabalhista"
        title={meta.title}
        titleHighlight={meta.titleHighlight}
        description={meta.description}
        backHref="/servicos/calculadoras"
        backLabel="Voltar para Calculadoras"
      />
      <Component />
    </>
  );
}

export function generateStaticParams() {
  return Object.keys(CALCULADORAS).map((slug) => ({ slug }));
}
