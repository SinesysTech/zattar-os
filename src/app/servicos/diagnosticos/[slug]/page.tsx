import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ServicosHero } from "../../_components/servicos-hero";

interface DiagnosticoMeta {
  loader: () => Promise<{ default: React.ComponentType }>;
  title: string;
  titleHighlight: string;
  description: string;
}

const DIAGNOSTICOS: Record<string, DiagnosticoMeta> = {
  "direitos-demissao": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/diagnosticos/direitos-demissao/page"
      ),
    title: "Direitos na",
    titleHighlight: "Demissão.",
    description:
      "Wizard interativo que analisa seu tipo de desligamento e identifica todos os direitos aplicáveis ao seu caso.",
  },
  "verificador-prazos": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/diagnosticos/verificador-prazos/page"
      ),
    title: "Verificador de",
    titleHighlight: "Prazos.",
    description:
      "Descubra se ainda está dentro do prazo legal para reclamar seus direitos trabalhistas na Justiça.",
  },
  "analise-jornada": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/diagnosticos/analise-jornada/page"
      ),
    title: "Análise de",
    titleHighlight: "Jornada.",
    description:
      "Detecte horas extras não pagas e intervalos suprimidos na sua jornada de trabalho.",
  },
  "elegibilidade-beneficios": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/diagnosticos/elegibilidade-beneficios/page"
      ),
    title: "Elegibilidade de",
    titleHighlight: "Benefícios.",
    description:
      "Verifique elegibilidade para seguro-desemprego, PIS/PASEP e saque do FGTS.",
  },
  "simulador-acao": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/diagnosticos/simulador-acao/page"
      ),
    title: "Simulador de",
    titleHighlight: "Ação.",
    description:
      "Estime o valor aproximado de uma reclamação trabalhista com base nas suas verbas.",
  },
};

export default async function DiagnosticoPublicoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = DIAGNOSTICOS[slug];
  if (!meta) notFound();

  const Component = dynamic(meta.loader);

  return (
    <>
      <ServicosHero
        eyebrow="Diagnóstico Trabalhista"
        title={meta.title}
        titleHighlight={meta.titleHighlight}
        description={meta.description}
        backHref="/servicos/diagnosticos"
        backLabel="Voltar para Diagnósticos"
      />
      <Component />
    </>
  );
}

export function generateStaticParams() {
  return Object.keys(DIAGNOSTICOS).map((slug) => ({ slug }));
}
