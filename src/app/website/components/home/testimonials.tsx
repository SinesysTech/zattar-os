import { Star } from "lucide-react";

export function Testimonials() {
  return (
    <section className="py-32 bg-surface">
      <div className="container mx-auto px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-primary font-label text-sm font-bold uppercase tracking-widest">
            Feedback
          </span>
          <h2 className="text-4xl md:text-5xl font-headline font-bold mt-4">
            Confiança de quem já alcançou a justiça.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 p-10 rounded-xl flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow">
            <div>
              <div className="flex text-primary mb-6 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-lg italic text-on-surface mb-8 leading-relaxed">
                &quot;O atendimento foi excepcionalmente rápido. Consegui resolver meu problema com o FGTS em tempo recorde graças à plataforma digital deles.&quot;
              </p>
            </div>
            <div className="flex items-center gap-4 mt-auto">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-white/10 shrink-0" />
              <div>
                <p className="font-bold text-on-surface">Ricardo Santos</p>
                <p className="text-sm text-on-surface-variant">Engenheiro de Software</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 p-10 rounded-xl flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow">
            <div>
              <div className="flex text-primary mb-6 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-lg italic text-on-surface mb-8 leading-relaxed">
                &quot;Sentia-me desamparada após a demissão, mas a equipe do Magistrate foi humana e tecnicamente impecável no meu processo.&quot;
              </p>
            </div>
            <div className="flex items-center gap-4 mt-auto">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-white/10 shrink-0" />
              <div>
                <p className="font-bold text-on-surface">Mariana Costa</p>
                <p className="text-sm text-on-surface-variant">Gerente Comercial</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white/5 backdrop-blur-[20px] border border-white/10 p-10 rounded-xl flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow">
            <div>
              <div className="flex text-primary mb-6 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-lg italic text-on-surface mb-8 leading-relaxed">
                &quot;A tecnologia deles faz toda a diferença. Recebi notificações em cada etapa e nunca me senti no escuro sobre o andamento.&quot;
              </p>
            </div>
            <div className="flex items-center gap-4 mt-auto">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-white/10 shrink-0" />
              <div>
                <p className="font-bold text-on-surface">João Oliveira</p>
                <p className="text-sm text-on-surface-variant">Logística</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
