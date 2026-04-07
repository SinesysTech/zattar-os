import { FileText, AlertOctagon, Scale, FileCheck, Receipt } from "lucide-react";
import { ServicosHero } from "../_components/servicos-hero";
import { ServicoWebCard } from "../_components/servico-web-card";

const geradores = [
  {
    title: "Carta de Demissão",
    description:
      "Carta formal de pedido de demissão com opção de cumprimento de aviso prévio.",
    href: "/servicos/geradores/carta-demissao",
    icon: FileText,
  },
  {
    title: "Notificação Extrajudicial",
    description:
      "Notificação formal ao empregador sobre irregularidades trabalhistas.",
    href: "/servicos/geradores/notificacao-extrajudicial",
    icon: AlertOctagon,
  },
  {
    title: "Declaração de Hipossuficiência",
    description:
      "Declaração para solicitar justiça gratuita em ações trabalhistas.",
    href: "/servicos/geradores/declaracao-hipossuficiencia",
    icon: FileCheck,
  },
  {
    title: "Acordo Extrajudicial",
    description:
      "Minuta de acordo extrajudicial (Art. 855-B CLT) para homologação.",
    href: "/servicos/geradores/acordo-extrajudicial",
    icon: Scale,
  },
  {
    title: "Holerite",
    description:
      "Recibo de pagamento detalhado com cálculo automático de INSS e IRRF.",
    href: "/servicos/geradores/holerite",
    icon: Receipt,
  },
];

export default function GeradoresPublicIndex() {
  return (
    <>
      <ServicosHero
        eyebrow="Documentos com IA"
        title="Geradores de"
        titleHighlight="Documentos."
        description="Gere documentos trabalhistas prontos para uso. Todos os modelos seguem as melhores práticas jurídicas e podem ser baixados em PDF."
        backHref="/servicos"
        backLabel="Voltar para Serviços"
      />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {geradores.map((item) => (
          <ServicoWebCard
            key={item.href}
            title={item.title}
            description={item.description}
            href={item.href}
            icon={item.icon}
            cta="Gerar documento"
          />
        ))}
      </section>
    </>
  );
}
