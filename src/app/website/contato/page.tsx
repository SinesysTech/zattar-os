import { WebsiteShell } from "@/app/website";
import { MapPin, Mail, Smartphone, Send, Instagram, Linkedin, MessageCircle } from "lucide-react";

export default function ContatoPage() {
  return (
    <WebsiteShell>
      
      <div className="pt-32 pb-24 overflow-hidden">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 mb-24 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <span className="inline-block text-primary font-bold text-sm tracking-widest uppercase mb-4 font-label">
                Contato
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold font-headline leading-tight tracking-tighter mb-6 shadow-[0_0_15px_rgb(var(--color-primary)/0.4)] hover:shadow-none transition-shadow">
                Conecte-se com o <br/>
                <span className="bg-linear-to-r from-primary to-primary-dim bg-clip-text text-transparent">
                  futuro da advocacia.
                </span>
              </h1>
            </div>
            <div className="lg:col-span-4 lg:pb-4">
              <p className="text-on-surface-variant text-lg font-body leading-relaxed">
                Estamos prontos para escalar suas operações jurídicas com inteligência de alta velocidade e precisão técnica.
              </p>
            </div>
          </div>
        </section>

        {/* Bento Contact Layout */}
        <section className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form Card */}
            <div className="lg:col-span-2 rounded-3xl p-10 bg-surface-variant/60 backdrop-blur-[20px] border border-white/5 shadow-2xl">
              <h3 className="text-2xl font-bold font-headline mb-8 flex items-center gap-3">
                <Send className="text-primary w-6 h-6" />
                Enviar Mensagem
              </h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Nome</label>
                    <input className="w-full bg-surface-container-high border-none rounded-lg p-4 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline outline-none" placeholder="Seu nome completo" type="text" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">E-mail</label>
                    <input className="w-full bg-surface-container-high border-none rounded-lg p-4 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline outline-none" placeholder="seu@email.com" type="email" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Assunto</label>
                  <input className="w-full bg-surface-container-high border-none rounded-lg p-4 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline outline-none" placeholder="Como podemos ajudar?" type="text" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant ml-1">Mensagem</label>
                  <textarea className="w-full bg-surface-container-high border-none rounded-lg p-4 text-on-surface focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-outline outline-none resize-none" placeholder="Descreva seu desafio jurídico..." rows={4}></textarea>
                </div>
                <a
                  href="mailto:contato@zattaradvogados.com?subject=Contato pelo site"
                  className="w-full block text-center py-5 bg-primary text-on-primary-fixed font-bold rounded-xl text-lg hover:bg-primary-container transition-all shadow-lg shadow-primary/10 active:scale-[0.98]"
                >
                  Enviar por E-mail
                </a>
              </form>
            </div>

            {/* Info Stack */}
            <div className="space-y-8">
              {/* Contact Info Card */}
              <div className="bg-surface-container rounded-3xl p-8 space-y-8 backdrop-blur-[20px] border border-white/5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-6">Informações</h4>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-on-surface font-semibold">Escritório</p>
                        <p className="text-on-surface-variant text-sm">Rua dos Inconfidentes, 911 — 7º andar<br/>Savassi · Belo Horizonte, MG · CEP 30140-120</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-on-surface font-semibold">E-mail</p>
                        <p className="text-on-surface-variant text-sm">contato@zattaradvogados.com</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-on-surface font-semibold">WhatsApp</p>
                        <p className="text-on-surface-variant text-sm">(31) 98438-2217</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Conectar</h4>
                  <div className="flex gap-4">
                    <a
                      className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all"
                      href="https://instagram.com/zattaradvogados"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a
                      className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all"
                      href="https://wa.me/5531984382217"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                    <a
                      className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/5 transition-all"
                      href="https://linkedin.com/company/zattaradvogados"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Map Section — Google Maps embed real do escritório */}
          <div className="mt-12 w-full h-125 relative rounded-3xl overflow-hidden border border-outline-variant/20">
            <iframe
              title="Mapa do escritório Zattar Advogados — Rua dos Inconfidentes, 911, Savassi, Belo Horizonte"
              src="https://www.google.com/maps?q=Rua+dos+Inconfidentes,+911,+Savassi,+Belo+Horizonte,+MG,+30140-120&output=embed"
              className="w-full h-full border-0 grayscale-40 contrast-[1.05]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      </div>

    </WebsiteShell>
  );
}
