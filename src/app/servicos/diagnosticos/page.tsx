import { ClipboardCheck, Clock, BarChart3, Award, Scale } from "lucide-react";
import { ServicosHero } from "../_components/servicos-hero";
import { ServicoWebCard } from "../_components/servico-web-card";

const diagnosticos = [
  {
    title: "Direitos na Demissão",
    description:
      "Wizard interativo que analisa seu tipo de desligamento e identifica todos os direitos aplicáveis.",
    href: "/servicos/diagnosticos/direitos-demissao",
    icon: ClipboardCheck,
  },
  {
    title: "Verificador de Prazos",
    description:
      "Verifique se ainda está dentro do prazo para reclamar seus direitos trabalhistas.",
    href: "/servicos/diagnosticos/verificador-prazos",
    icon: Clock,
  },
  {
    title: "Análise de Jornada",
    description:
      "Detecte horas extras não pagas e intervalos suprimidos na sua jornada de trabalho.",
    href: "/servicos/diagnosticos/analise-jornada",
    icon: BarChart3,
  },
  {
    title: "Elegibilidade de Benefícios",
    description:
      "Verifique elegibilidade para seguro-desemprego, PIS/PASEP e saque FGTS.",
    href: "/servicos/diagnosticos/elegibilidade-beneficios",
    icon: Award,
  },
  {
    title: "Simulador de Ação",
    description:
      "Estime o valor aproximado de uma reclamação trabalhista com base nas suas verbas.",
    href: "/servicos/diagnosticos/simulador-acao",
    icon: Scale,
  },
];

export default function DiagnosticosPublicIndex() {
  return (
    <>
      <ServicosHero
        eyebrow="Ferramentas de Análise"
        title="Diagnósticos"
        titleHighlight="Trabalhistas."
        description="Ferramentas interativas para analisar sua situação trabalhista. Identifique direitos, prazos e oportunidades."
        backHref="/servicos"
        backLabel="Voltar para Serviços"
      />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {diagnosticos.map((item) => (
          <ServicoWebCard
            key={item.href}
            title={item.title}
            description={item.description}
            href={item.href}
            icon={item.icon}
            cta="Iniciar análise"
          />
        ))}
      </section>
    </>
  );
}
