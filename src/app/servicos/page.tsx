"use client";

import Link from "next/link";
import { Calculator, FileText, Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceIndexHeader } from "@/app/portal/feature/servicos";

const categories = [
  {
    title: "Calculadoras Trabalhistas",
    description:
      "10 calculadoras com tabelas INSS/IRRF progressivas atualizadas para 2026. Rescisao, salario liquido, horas extras, ferias e mais.",
    icon: Calculator,
    href: "/servicos/calculadoras",
    count: 10,
  },
  {
    title: "Geradores de Documentos",
    description:
      "5 geradores de documentos trabalhistas prontos para download. Carta de demissao, notificacao, acordo extrajudicial e mais.",
    icon: FileText,
    href: "/servicos/geradores",
    count: 5,
  },
  {
    title: "Diagnosticos Trabalhistas",
    description:
      "5 ferramentas de analise para identificar direitos, verificar prazos e simular acoes trabalhistas.",
    icon: Stethoscope,
    href: "/servicos/diagnosticos",
    count: 5,
  },
];

export default function ServicosPublicHub() {
  return (
    <>
      <ServiceIndexHeader
        eyebrow="Ferramentas Gratuitas"
        title="Servicos"
        titleHighlight="Trabalhistas."
        description="Acesse calculadoras, gere documentos e analise sua situacao trabalhista. Todas as ferramentas atualizadas com a legislacao 2026."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {categories.map((cat) => (
          <Link key={cat.href} href={cat.href} className="group block">
            <Card className="h-full bg-[#191919]/60 backdrop-blur-xl border-white/5 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 shadow-lg overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <cat.icon className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 rounded-full">
                    {cat.count} servicos
                  </span>
                </div>
                <h3 className="text-2xl font-bold font-headline text-white mb-3">
                  {cat.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {cat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
