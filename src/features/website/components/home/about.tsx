import { CheckCircle } from "lucide-react";

export function About() {
  return (
    <section className="py-32 bg-surface-container-low">
      <div className="container mx-auto px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div className="relative order-2 md:order-1">
            <div className="aspect-square rounded-3xl overflow-hidden relative z-10 shadow-2xl">
              <img
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                alt="Dynamic tech team working in a futuristic dark office"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4s68vvVIR2eH9z9YzLyHzYC86wmTsW9lCpLmnX19msfjKHu0ANV84BR2b6h1xJ6utqY5EOVMu_5_2m88XisLo8NhngBqnL3YOWe6u3UZPQSdxNkjnD9YLgQMRwpVjIKDi0pKonYT6ojwaEHb9by3w6eisSb9t5PtNIZ4Le86nwgKvSD4Jti802SOMNH5x48whGMzERpGgHAUGoPx-cv6EoIfGbN_N9q_PTAGyds9iFysoL089Sj_9ZIPBFIp2gkFDuPnC7kCxq5cH"
              />
            </div>
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl z-0" />
          </div>

          <div className="order-1 md:order-2">
            <span className="text-primary font-label text-sm font-bold uppercase tracking-widest">
              A Revolução Jurídica
            </span>
            <h2 className="text-5xl md:text-7xl font-headline font-extrabold mt-6 mb-8 tracking-tighter leading-tight">
              O Direito do Trabalho <br />
              <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
                reimaginado.
              </span>
            </h2>
            <p className="text-xl text-on-surface-variant mb-8 leading-relaxed">
              Esqueça a burocracia lenta e o atendimento distante. No Magistrate AI, utilizamos automação inteligente para acelerar o protocolo de petições e análise de provas, mantendo você informado em tempo real.
            </p>

            <ul className="space-y-6 mb-12">
              <li className="flex items-start gap-4">
                <CheckCircle className="text-primary w-6 h-6 mt-1 shrink-0" />
                <div>
                  <h4 className="font-bold text-lg text-on-surface">Transparência Digital</h4>
                  <p className="text-on-surface-variant">Acompanhe seu caso através do nosso dashboard exclusivo.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="text-primary w-6 h-6 mt-1 shrink-0" />
                <div>
                  <h4 className="font-bold text-lg text-on-surface">Inteligência Preditiva</h4>
                  <p className="text-on-surface-variant">Análise estatística de decisões para aumentar as chances de êxito.</p>
                </div>
              </li>
            </ul>

            <button className="bg-on-surface text-surface-container-lowest px-8 py-4 rounded-md font-bold hover:bg-primary hover:text-on-primary transition-all">
              Conheça nossa Metodologia
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
