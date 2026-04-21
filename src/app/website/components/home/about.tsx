import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export function About() {
  return (
    <section className="py-16 sm:py-20 md:py-32 bg-surface-container-low">
      <div className="container mx-auto px-5 sm:px-6 md:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 lg:gap-20 items-center">
          <div className="relative order-2 md:order-1">
            <div className="relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden z-10 shadow-2xl">
              <Image
                src="/website/home/about-team.jpg"
                alt="Equipe técnica trabalhando em escritório futurista escuro com monitores de dados"
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover opacity-85 hover:opacity-100 motion-safe:transition-all motion-safe:duration-700"
              />
            </div>
            <div className="absolute -top-10 -right-10 w-32 md:w-48 h-32 md:h-48 bg-primary/20 rounded-full blur-3xl z-0" />
          </div>

          <div className="order-1 md:order-2">
            <span className="text-primary font-label text-sm font-bold uppercase tracking-widest">
              A Revolução Jurídica
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-headline font-extrabold mt-4 md:mt-6 mb-6 md:mb-8 tracking-tighter leading-[1.05]">
              O Direito do Trabalho <br />
              <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
                reimaginado.
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-on-surface-variant mb-6 md:mb-8 leading-relaxed">
              Esqueça a burocracia lenta e o atendimento distante. Na Zattar Advogados, utilizamos automação inteligente para acelerar o protocolo de petições e análise de provas, mantendo você informado em tempo real.
            </p>

            <ul className="space-y-4 md:space-y-6 mb-8 md:mb-12">
              <li className="flex items-start gap-3 md:gap-4">
                <CheckCircle className="text-primary w-5 h-5 md:w-6 md:h-6 mt-1 shrink-0" />
                <div>
                  <h4 className="font-bold text-base md:text-lg text-on-surface">Transparência Digital</h4>
                  <p className="text-on-surface-variant text-sm md:text-base">Acompanhe seu caso através do nosso dashboard exclusivo.</p>
                </div>
              </li>
              <li className="flex items-start gap-3 md:gap-4">
                <CheckCircle className="text-primary w-5 h-5 md:w-6 md:h-6 mt-1 shrink-0" />
                <div>
                  <h4 className="font-bold text-base md:text-lg text-on-surface">Inteligência Preditiva</h4>
                  <p className="text-on-surface-variant text-sm md:text-base">Análise estatística de decisões para aumentar as chances de êxito.</p>
                </div>
              </li>
            </ul>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <Link
                href="/contato"
                className="bg-primary text-on-primary-fixed px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-sm sm:text-base hover:brightness-110 transition-all text-center"
              >
                Fale com um Especialista
              </Link>
              <Link
                href="/expertise"
                className="bg-on-surface text-surface-container-lowest px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-sm sm:text-base hover:bg-primary hover:text-on-primary transition-all text-center"
              >
                Conheça nossa Metodologia
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
