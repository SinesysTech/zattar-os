import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-8 z-10 grid md:grid-cols-12 gap-12 items-center relative">
        <div className="md:col-span-7">
          <span className="inline-block px-4 py-1 rounded-full bg-surface-container-highest text-primary font-label text-xs font-bold uppercase tracking-widest mb-6">
            A Nova Era da Advocacia Trabalhista
          </span>
          <h1 className="text-6xl md:text-8xl font-extrabold font-headline leading-[0.95] tracking-tighter mb-8">
            Justiça para <br />
            <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
              quem trabalha.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-on-surface-variant max-w-xl mb-10 leading-relaxed">
            Unimos tecnologia de ponta e expertise jurídica para garantir que seus direitos sejam respeitados com a velocidade que o mundo moderno exige.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/contato"
              className="bg-primary text-on-primary-fixed px-10 py-5 rounded-md font-bold text-lg hover:bg-primary-container transition-all flex items-center justify-center gap-2 group"
            >
              Fale com um Especialista
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#solucoes"
              className="border border-outline-variant/40 px-10 py-5 rounded-md font-bold text-lg hover:bg-surface-container transition-all flex items-center justify-center"
            >
              Nossas Soluções
            </Link>
          </div>
        </div>

        <div className="md:col-span-5 relative hidden md:block mt-8 md:mt-0">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/5 relative z-10">
            {/* The image is currently hotlinked per prototype, ideally replaced with local next/image later */}
            <img
              className="w-full aspect-[4/5] object-cover grayscale hover:grayscale-0 transition-all duration-700"
              alt="Modern minimalist law office interior with glass walls, dark furniture, and cinematic ambient lighting in shades of purple and charcoal"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTLNIpMEgGuu9XgPyp1xnlW4DwtVv_l-r54oWPmzCH_YKWMllz4whxf-lxHDASUVmdFALibALdTRgjiDfHpD1uQt6eELK9PlT97ZoXSdXz2GPZDrElkNCA81kZs0j6nh3J1-wIM2rRLYRptfoL36-vgQGIIEgUnkrxxUMEBMhBXNRX5H-B0GVCI5pCoRsri9zWRGK_RtXoilhaoijkSef1FBuznIHKSQ_AZLlvl701DDN97G4DHpLeDGhnvXz53Ka4L8dui-81SXuO"
            />
          </div>
          
          <div className="absolute -bottom-6 -left-6 bg-surface-variant/60 backdrop-blur-[20px] border border-outline-variant/30 p-6 rounded-xl max-w-[240px] z-20 shadow-2xl">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Performance
              </div>
            </div>
            <p className="text-sm font-medium">
              Processos finalizados 40% mais rápido que a média nacional.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
