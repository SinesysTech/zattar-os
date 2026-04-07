import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { ServicosHero } from "../../_components/servicos-hero";

interface GeradorMeta {
  loader: () => Promise<{ default: React.ComponentType }>;
  title: string;
  titleHighlight: string;
  description: string;
}

const GERADORES: Record<string, GeradorMeta> = {
  "carta-demissao": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/geradores/carta-demissao/page"
      ),
    title: "Carta de",
    titleHighlight: "Demissão.",
    description:
      "Carta formal de pedido de demissão com opção de cumprimento ou dispensa do aviso prévio.",
  },
  "notificacao-extrajudicial": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/geradores/notificacao-extrajudicial/page"
      ),
    title: "Notificação",
    titleHighlight: "Extrajudicial.",
    description:
      "Notificação formal ao empregador sobre irregularidades trabalhistas — o primeiro passo antes de uma ação.",
  },
  "declaracao-hipossuficiencia": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/geradores/declaracao-hipossuficiencia/page"
      ),
    title: "Declaração de",
    titleHighlight: "Hipossuficiência.",
    description:
      "Declaração formal para solicitar justiça gratuita em ações trabalhistas.",
  },
  "acordo-extrajudicial": {
    loader: () =>
      import(
        "@/app/portal/(dashboard)/servicos/geradores/acordo-extrajudicial/page"
      ),
    title: "Acordo",
    titleHighlight: "Extrajudicial.",
    description:
      "Minuta de acordo extrajudicial (Art. 855-B CLT) pronta para homologação na Justiça do Trabalho.",
  },
  holerite: {
    loader: () =>
      import("@/app/portal/(dashboard)/servicos/geradores/holerite/page"),
    title: "Holerite",
    titleHighlight: "Personalizado.",
    description:
      "Recibo de pagamento detalhado com cálculo automático de INSS e IRRF progressivos.",
  },
};

export default async function GeradorPublicoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = GERADORES[slug];
  if (!meta) notFound();

  const Component = dynamic(meta.loader);

  return (
    <>
      <ServicosHero
        eyebrow="Gerador de Documento"
        title={meta.title}
        titleHighlight={meta.titleHighlight}
        description={meta.description}
        backHref="/servicos/geradores"
        backLabel="Voltar para Geradores"
      />
      <Component />
    </>
  );
}

export function generateStaticParams() {
  return Object.keys(GERADORES).map((slug) => ({ slug }));
}
