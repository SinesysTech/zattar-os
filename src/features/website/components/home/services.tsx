import Link from "next/link";
import { Gavel, Wallet, Stethoscope, ArrowRight } from "lucide-react";

export function Services() {
  return (
    <section id="solucoes" className="py-32 bg-surface">
      <div className="container mx-auto px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <span className="text-primary font-label text-sm font-bold uppercase tracking-widest">
              Especialidades
            </span>
            <h2 className="text-4xl md:text-6xl font-headline font-bold mt-4 tracking-tight">
              Soluções jurídicas de <span className="text-on-surface-variant">alta precisão.</span>
            </h2>
          </div>
          <p className="text-on-surface-variant text-lg max-w-sm">
            Focamos na resolução estratégica de conflitos trabalhistas utilizando análise de dados e inteligência jurídica.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Service 1 */}
          <div className="group p-10 rounded-2xl bg-surface-container border border-white/5 hover:border-primary/50 transition-all duration-500 flex flex-col items-start">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center mb-8 group-hover:scale-110 transition-transform text-primary">
              <Gavel className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4 font-headline">Demissão sem justa causa</h3>
            <p className="text-on-surface-variant mb-8 leading-relaxed flex-1">
              Proteção total dos seus direitos em rescisões contratuais inesperadas ou abusivas.
            </p>
            <Link href="/servicos/demissao" className="text-primary font-bold flex items-center gap-2 group/link mt-auto hover:text-primary-dim transition-colors">
              Saiba mais 
              <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Service 2 */}
          <div className="group p-10 rounded-2xl bg-surface-container border border-white/5 hover:border-primary/50 transition-all duration-500 flex flex-col items-start">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center mb-8 group-hover:scale-110 transition-transform text-primary">
              <Wallet className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4 font-headline">FGTS e Verbas</h3>
            <p className="text-on-surface-variant mb-8 leading-relaxed flex-1">
              Recuperação integral de depósitos de FGTS, horas extras e verbas rescisórias pendentes.
            </p>
            <Link href="/servicos/fgts" className="text-primary font-bold flex items-center gap-2 group/link mt-auto hover:text-primary-dim transition-colors">
              Saiba mais 
              <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Service 3 */}
          <div className="group p-10 rounded-2xl bg-surface-container border border-white/5 hover:border-primary/50 transition-all duration-500 flex flex-col items-start">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center mb-8 group-hover:scale-110 transition-transform text-primary">
              <Stethoscope className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4 font-headline">Acidentes de Trabalho</h3>
            <p className="text-on-surface-variant mb-8 leading-relaxed flex-1">
              Indenizações justas e suporte completo para doenças ocupacionais e acidentes laborais.
            </p>
            <Link href="/servicos/acidentes" className="text-primary font-bold flex items-center gap-2 group/link mt-auto hover:text-primary-dim transition-colors">
              Saiba mais 
              <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
