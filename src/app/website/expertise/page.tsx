import { WebsiteShell } from "@/app/website";
import Link from "next/link";
import { Shield, Users, Search, ArrowRight, Atom, Scale } from "lucide-react";
import { buildWebsiteMetadata } from "../_metadata/build-metadata";

export const metadata = buildWebsiteMetadata({
  title: "Especialidades",
  description:
    "Áreas de atuação: Direito Digital, Direito do Trabalho, LGPD, cibersegurança e regulação de IA com precisão jurídica e tecnológica.",
  path: "/expertise",
});


export default function ExpertisePage() {
  return (
    <WebsiteShell>

      <div className="pt-32 pb-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 mb-32 grid grid-cols-1 md:grid-cols-12 gap-8 items-center mt-12">
          <div className="md:col-span-7">
            <span className="inline-block py-1 px-3 rounded-full bg-surface-container-highest text-primary text-xs font-bold tracking-widest uppercase mb-6">
              Inteligência Jurídica Deep Tech
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold font-headline tracking-tighter leading-[0.9] mb-8">
              Expertise Jurídica de{" "}
              <span className="bg-linear-to-br from-primary-fixed-dim to-primary bg-clip-text text-transparent">
                Vanguarda.
              </span>
            </h1>
            <p className="text-xl text-on-surface-variant leading-relaxed max-w-xl">
              Combinamos a profundidade intelectual do direito tradicional com a agilidade algorítmica da próxima geração tecnológica. Proteção em alta velocidade.
            </p>
          </div>
          <div className="md:col-span-5 relative mt-12 md:mt-0">
            <div className="aspect-square rounded-full border border-primary/20 absolute -top-12 -right-12 w-full"></div>
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl relative z-10 border border-white/5 bg-surface-container">
              <img
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 opacity-60"
                alt="Estátua de justiça em vidro com reflexo tecnológico em close-up"
                src="/website/expertise/hero.jpg"
              />
            </div>
          </div>
        </section>

        {/* Specialization Areas: Bento Grid Layout */}
        <section className="max-w-7xl mx-auto px-8 mb-40">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-headline font-bold mb-4">Áreas de Especialização</h2>
              <p className="text-on-surface-variant">
                Arquitetura jurídica desenhada para o ecossistema digital contemporâneo.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-200">
            {/* Direito Digital */}
            <div className="md:col-span-8 bg-surface-container rounded-3xl overflow-hidden group relative flex flex-col justify-end p-10 border border-white/5">
              <div className="absolute inset-0 z-0">
                <img
                  className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-700"
                  alt="Visualização de dados futurística de cibersegurança"
                  src="/website/expertise/profile-1.jpg"
                />
              </div>
              <div className="relative z-10 w-full h-full flex flex-col justify-end">
                <div className="mb-4">
                  <Shield className="text-primary w-10 h-10" />
                </div>
                <h3 className="text-3xl font-bold mb-4 font-headline">Direito Digital</h3>
                <p className="text-on-surface-variant max-w-lg mb-6 leading-relaxed">
                  Navegação precisa por LGPD, cibersegurança e regulação de IA. Protegemos seu IP e garantimos conformidade em infraestruturas complexas.
                </p>
                <ul className="flex flex-wrap gap-2">
                  <li className="px-3 py-1 rounded-full bg-surface-container-highest text-primary text-xs font-semibold">LGPD</li>
                  <li className="px-3 py-1 rounded-full bg-surface-container-highest text-primary text-xs font-semibold">Web3 & Smart Contracts</li>
                  <li className="px-3 py-1 rounded-full bg-surface-container-highest text-primary text-xs font-semibold">Ciber-Litigância</li>
                </ul>
              </div>
            </div>

            {/* Direito do Trabalho */}
            <div className="md:col-span-4 bg-surface-container rounded-3xl overflow-hidden group relative flex flex-col p-10 border border-white/5">
              <div className="mb-8">
                <Users className="text-primary w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-headline">Direito do Trabalho</h3>
              <p className="text-on-surface-variant leading-relaxed mb-8">
                Estratégias laborais para o trabalho remoto e a economia de plataformas. Gestão de risco para times globais e contratos de vesting.
              </p>
              <div className="mt-auto pt-6 border-t border-white/5">
                <span className="text-primary text-sm font-bold tracking-widest uppercase">Foco em Times Híbridos</span>
              </div>
            </div>

            {/* Consultoria Preventiva */}
            <div className="md:col-span-4 bg-primary text-on-primary-fixed rounded-3xl flex flex-col p-10 group hover:bg-primary-container transition-colors duration-300 shadow-xl shadow-primary/10">
              <div className="mb-8">
                <Search className="w-10 h-10 opacity-90" />
              </div>
              <h3 className="text-2xl font-bold mb-4 font-headline">Consultoria Preventiva</h3>
              <p className="text-on-primary-fixed/80 leading-relaxed mb-8">
                Inteligência antecipatória para evitar o contencioso. Auditamos processos internos com precisão cirúrgica antes que se tornem passivos.
              </p>
              <Link href="/contato" className="mt-auto flex items-center gap-2 font-bold uppercase text-xs tracking-widest hover:pl-2 transition-all">
                Saiba Mais <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Expertise Adicional / Visual */}
            <div className="md:col-span-8 bg-surface-container-low rounded-3xl overflow-hidden p-10 border border-white/5 relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 h-full">
                <div className="flex flex-col justify-center relative z-10">
                  <h3 className="text-2xl font-bold mb-4 font-headline">Fusões & Aquisições Tech</h3>
                  <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                    Due diligence automatizada e estruturação societária para startups em rodadas de investimento (Series A-E).
                  </p>
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-surface-container bg-surface-variant flex items-center justify-center text-[10px] font-bold text-on-surface shadow-md">M&A</div>
                    <div className="w-10 h-10 rounded-full border-2 border-surface-container bg-surface-variant flex items-center justify-center text-[10px] font-bold text-on-surface shadow-md">EXIT</div>
                    <div className="w-10 h-10 rounded-full border-2 border-surface-container bg-surface-variant flex items-center justify-center text-[10px] font-bold text-on-surface shadow-md">IPO</div>
                  </div>
                </div>
                <div className="relative hidden sm:block h-full min-h-50">
                  <div className="absolute inset-0 bg-linear-to-t from-surface-container-low to-transparent z-10"></div>
                  <img
                    className="w-full h-full object-cover opacity-50 grayscale rounded-xl mix-blend-screen"
                    alt="Abstract architectural lines"
                    src="/website/expertise/profile-2.jpg"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Team Section */}
        <section className="max-w-7xl mx-auto px-8 mb-40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="order-2 md:order-1">
              <span className="text-primary font-bold text-xs tracking-[0.3em] uppercase mb-4 block">Nossa Célula de Elite</span>
              <h2 className="text-4xl md:text-5xl font-bold font-headline mb-8 leading-tight">Advogados que codificam.<br/>Engenheiros que legislam.</h2>
              <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">
                Quebramos os silos tradicionais. Nosso time é composto por profissionais híbridos que entendem tanto o Código Civil quanto o código fonte. Essa fusão nos permite criar soluções que não são apenas legalmente robustas, mas tecnicamente viáveis e escaláveis.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0">
                    <Atom className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-on-surface">Célula de Engenharia Legal</h4>
                    <p className="text-sm text-on-surface-variant">Desenvolvimento de automações customizadas para fluxos de compliance.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0">
                    <Scale className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-on-surface">Conselho Consultivo Sênior</h4>
                    <p className="text-sm text-on-surface-variant">Doutores em Direito focados em estratégias de alto impacto jurídico.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2 grid grid-cols-2 gap-4">
              <div className="space-y-4 pt-12">
                <div className="aspect-3/4 rounded-2xl bg-surface-container overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-white/5">
                  <img className="w-full h-full object-cover" alt="Profissional jurídico" src="/website/expertise/legal-professional.jpg"/>
                </div>
                <div className="aspect-3/4 rounded-2xl bg-surface-container overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-white/5">
                  <img className="w-full h-full object-cover" alt="Engenheiro de tecnologia" src="/website/expertise/tech-engineer.jpg"/>
                </div>
              </div>
              <div className="space-y-4">
                <div className="aspect-3/4 rounded-2xl bg-surface-container overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-white/5">
                  <img className="w-full h-full object-cover" alt="Profissional de tecnologia jurídica" src="/website/expertise/legal-tech.jpg"/>
                </div>
                <div className="aspect-3/4 rounded-2xl bg-surface-container overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-white/5">
                  <img className="w-full h-full object-cover" alt="Advogado especialista" src="/website/expertise/expert-counsel.jpg"/>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-8 mb-40">
          <div className="bg-surface-container rounded-3xl p-12 md:p-20 text-center relative overflow-hidden border border-white/5 shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-primary to-transparent"></div>
            <div className="relative z-10 w-full flex flex-col items-center">
              <h2 className="text-4xl md:text-6xl font-bold font-headline mb-8 leading-tight">Pronto para elevar seu<br/>padrão jurídico?</h2>
              <p className="text-on-surface-variant text-xl mb-12 max-w-2xl mx-auto">
                Seu time merece a segurança de um magistrado com a velocidade de um processador.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6 w-full max-w-md mx-auto">
                <Link href="/contato" className="bg-primary text-on-primary-fixed px-10 py-4 rounded-xl font-bold text-lg hover:bg-primary-container transition-all shadow-lg shadow-primary/20 active:scale-95 w-full sm:w-auto text-center">
                  Agendar Consultoria
                </Link>
                <Link href="/contato" className="border border-outline-variant/30 text-on-surface px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/5 transition-all w-full sm:w-auto text-center">
                  Falar com Especialista
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

    </WebsiteShell>
  );
}
