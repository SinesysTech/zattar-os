import { WebsiteShell } from "@/app/website";
import { MapPin, Mail, Smartphone, Send, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { Heading, Text } from "@/components/ui/typography";
import { GlassPanel } from "@/components/shared/glass-panel";
import { buildWebsiteMetadata } from "../_metadata/build-metadata";
import { ContactForm } from "./_components/contact-form";

export const metadata = buildWebsiteMetadata({
  title: "Contato",
  description:
    "Fale com especialistas em Direito do Trabalho. Belo Horizonte, atendimento digital, resposta rápida.",
  path: "/contato",
});

export default function ContatoPage() {
  return (
    <WebsiteShell>
      
      <div className="pt-32 pb-24 overflow-hidden">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 mb-24 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <Text variant="overline" className="text-primary mb-4 block">
                Contato
              </Text>
              <Heading level="marketing-hero">
                Conecte-se com o <br/>
                <span className="bg-linear-to-r from-primary to-primary-dim bg-clip-text text-transparent">
                  futuro da advocacia.
                </span>
              </Heading>
            </div>
            <div className="lg:col-span-4 lg:pb-4">
              <Text variant="marketing-lead">
                Estamos prontos para escalar suas operações jurídicas com inteligência de alta velocidade e precisão técnica.
              </Text>
            </div>
          </div>
        </section>

        {/* Bento Contact Layout */}
        <section className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form Card */}
            <GlassPanel depth={2} className="lg:col-span-2 p-10 shadow-2xl">
              <Heading level="card" as="h2" className="mb-8 flex items-center gap-3">
                <Send className="text-primary w-6 h-6" />
                Enviar Mensagem
              </Heading>
              <ContactForm />
            </GlassPanel>

            {/* Info Stack */}
            <div className="space-y-8">
              {/* Contact Info Card */}
              <GlassPanel depth={1} className="p-8 space-y-8">
                <div>
                  <Text variant="overline" className="text-primary mb-6 block">
                    Informações
                  </Text>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-foreground font-semibold">Escritório</p>
                        <Text variant="caption">Rua dos Inconfidentes, 911 — 7º andar<br/>Savassi · Belo Horizonte, MG · CEP 30140-120</Text>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-foreground font-semibold">E-mail</p>
                        <Text variant="caption">contato@zattaradvogados.com</Text>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-foreground font-semibold">WhatsApp</p>
                        <Text variant="caption">(31) 98438-2217</Text>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-outline-variant/20">
                  <Text variant="overline" className="text-primary mb-4 block">
                    Conectar
                  </Text>
                  <div className="flex gap-4">
                    <a
                      className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      href="https://instagram.com/zattaradvogados"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a
                      className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      href="https://wa.me/5531984382217"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                    <a
                      className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      href="https://linkedin.com/company/zattaradvogados"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </GlassPanel>

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
