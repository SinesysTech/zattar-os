import Link from "next/link";
import { Calculator, FileText, Stethoscope, ArrowRight } from "lucide-react";
import { ServicosHero } from "./_components/servicos-hero";
import { ServicoWebCard } from "./_components/servico-web-card";

const categories = [
  {
    title: "Calculadoras",
    description:
      "10 calculadoras trabalhistas com tabelas INSS/IRRF progressivas atualizadas para 2026: rescisão, salário líquido, horas extras, férias e muito mais.",
    icon: Calculator,
    href: "/servicos/calculadoras",
    badge: "10 serviços",
  },
  {
    title: "Geradores de Documentos",
    description:
      "5 geradores de documentos trabalhistas prontos para download em PDF. Carta de demissão, notificação extrajudicial, acordo e outros modelos.",
    icon: FileText,
    href: "/servicos/geradores",
    badge: "5 serviços",
  },
  {
    title: "Diagnósticos",
    description:
      "5 ferramentas de análise para identificar direitos, verificar prazos, simular ações e auditar sua jornada de trabalho.",
    icon: Stethoscope,
    href: "/servicos/diagnosticos",
    badge: "5 serviços",
  },
];

export default function ServicosPublicHub() {
  return (
    <>
      <ServicosHero
        eyebrow="Ferramentas Gratuitas"
        title="Serviços"
        titleHighlight="Trabalhistas."
        description="Calculadoras, geradores de documentos e diagnósticos trabalhistas com inteligência artificial. Todas as ferramentas atualizadas com a legislação CLT 2026."
      />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {categories.map((cat) => (
          <ServicoWebCard
            key={cat.href}
            title={cat.title}
            description={cat.description}
            href={cat.href}
            icon={cat.icon}
            badge={cat.badge}
            cta="Acessar categoria"
          />
        ))}
      </section>

      {/* CTA final — alinhada ao estilo do CTA da página expertise/home */}
      <section className="mt-24">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-linear-to-br from-primary/10 to-surface-container/80 p-10 md:p-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(var(--color-primary)/0.05)_0%,transparent_70%)] pointer-events-none"
          />
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-block text-primary font-headline font-bold text-xs tracking-[0.2em] uppercase mb-4">
              Consultoria Especializada
            </span>
            <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-on-surface mb-6">
              Precisa de uma análise humana?
            </h2>
            <p className="text-lg text-on-surface-variant leading-relaxed mb-10">
              Nossas ferramentas são um excelente ponto de partida, mas cada
              caso tem nuances. Nossa equipe pode revisar seu caso com a
              profundidade que ele merece.
            </p>
            <Link
              href="/contato"
              className="inline-flex items-center gap-3 bg-primary text-on-primary-fixed px-8 py-4 rounded-2xl font-headline font-extrabold text-base hover:brightness-110 transition-all shadow-[0_10px_30px_rgb(var(--color-primary)/0.25)] hover:shadow-[0_15px_40px_rgb(var(--color-primary)/0.4)] active:scale-95"
            >
              Falar com Especialista
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
