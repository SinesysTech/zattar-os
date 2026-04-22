import Link from "next/link";
import Image from "next/image";
import {
  Instagram,
  Linkedin,
  Facebook,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";

const siteLinks = [
  { href: "#solucoes", label: "Soluções" },
  { href: "/expertise", label: "Especialidades" },
  { href: "/servicos", label: "Serviços" },
  { href: "/insights", label: "Insights" },
  { href: "/faq", label: "Perguntas Frequentes" },
];

const portalLinks = [
  { href: "/portal", label: "Acesso ao Portal" },
  { href: "/login", label: "ZattarOS" },
  { href: "/contato", label: "Fale Conosco" },
];

const socialLinks = [
  {
    href: "https://www.instagram.com/zattar.advogados/",
    label: "Instagram Zattar Advogados",
    icon: Instagram,
  },
  {
    href: "https://www.linkedin.com/company/zattaradvogados",
    label: "LinkedIn Zattar Advogados",
    icon: Linkedin,
  },
  {
    href: "https://www.facebook.com/share/14Qyx3EPgxy/",
    label: "Facebook Zattar Advogados",
    icon: Facebook,
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* ─── Zona 1: Closing Statement ─── */}
      <div className="relative bg-surface-container-low border-t border-outline-variant/20">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-32 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Zona 1 — CTA final: escala 1.5x do bloco interno (py 64→96px desktop) */}
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Heading level="marketing-section" className="mb-4 md:mb-5">
              Pronto para defender{" "}
              <span className="bg-linear-to-br from-primary to-primary-dim bg-clip-text text-transparent">
                seus direitos?
              </span>
            </Heading>
            <Text variant="marketing-lead" className="mb-7 md:mb-9 max-w-xl mx-auto">
              Cada dia sem ação é um direito que pode prescrever. Fale com quem
              une tecnologia e experiência para acelerar sua causa.
            </Text>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="rounded-xl gap-2 group h-11 px-6 text-sm md:text-base"
              >
                <Link href="/contato">
                  Fale com um Especialista
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <a
                href="tel:+5531984382217"
                className="group/tel inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors font-bold text-sm md:text-base"
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/15 text-primary">
                  <Phone className="w-3.5 h-3.5" />
                </span>
                (31) 98438-2217
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Zona 2: Footer Principal — escala 0.75x da Zona 1 ─── */}
      <div className="bg-surface-container-lowest border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 py-10 sm:py-12 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 md:gap-10 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-4 pr-0 lg:pr-8">
              <Link
                href="/"
                className="relative block w-10 sm:w-11 md:w-12 h-10 sm:h-11 md:h-12 mb-4 md:mb-5 border-none outline-none"
              >
                <Image
                  src="/logos/Sem%20Fundo%20SVG/logo-z-light.svg"
                  alt="Logo Zattar Advogados"
                  fill
                  className="object-contain object-left dark:hidden"
                />
                <Image
                  src="/logos/Sem%20Fundo%20SVG/logo-z-dark.svg"
                  alt="Logo Zattar Advogados"
                  fill
                  className="object-contain object-left hidden dark:block"
                />
              </Link>
              <Text variant="caption" className="mb-5 max-w-xs">
                Tecnologia e estratégia jurídica a favor de quem trabalha.
                Advocacia trabalhista com precisão digital.
              </Text>
              <div className="flex gap-2.5">
                {socialLinks.map(({ href, label, icon: Icon }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-surface-container-highest/60 border border-outline-variant/20 flex items-center justify-center text-muted-foreground hover:bg-primary/20 hover:border-primary/30 hover:text-primary transition-all duration-200"
                    aria-label={label}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links + Contato — título widget (15px) → ícone 16px em container 32px */}
            <div className="lg:col-span-8 grid grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8">
              {/* Navegação */}
              <div className="lg:col-span-4">
                <Heading level="widget" as="h3" className="mb-3 md:mb-4 tracking-wide">
                  Navegação
                </Heading>
                <ul className="space-y-2.5">
                  {siteLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm block w-fit"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Portal */}
              <div className="lg:col-span-3">
                <Heading level="widget" as="h3" className="mb-3 md:mb-4 tracking-wide">
                  Portal
                </Heading>
                <ul className="space-y-2.5">
                  {portalLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm block w-fit"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contato — visualmente destacado */}
              <div className="col-span-2 lg:col-span-5">
                <Heading level="widget" as="h3" className="mb-3 md:mb-4 tracking-wide">
                  Contato
                </Heading>
                <div className="space-y-3 text-muted-foreground text-sm">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="leading-relaxed">
                      <span className="text-foreground font-medium block mb-0.5">
                        Belo Horizonte
                      </span>
                      Rua dos Inconfidentes, 911 — 7º andar
                      <br />
                      Savassi · CEP 30140-120
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <a
                      href="mailto:contato@zattaradvogados.com"
                      className="hover:text-primary transition-colors"
                    >
                      contato@zattaradvogados.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <a
                      href="tel:+5531984382217"
                      className="hover:text-primary transition-colors font-medium text-foreground"
                    >
                      (31) 98438-2217
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Zona 3: Bottom Bar — escala caption (13px), harmônica com o footer principal (14px) ─── */}
      <div className="border-t border-outline-variant/20 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 py-5 md:py-6 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <Text
            variant="caption"
            as="p"
            className="text-center md:text-left"
          >
            © {new Date().getFullYear()} Zattar Advogados · OAB/MG 128.404 · Feito com{" "}
            <Heart className="inline-block w-3.5 h-3.5 align-text-bottom text-destructive fill-destructive motion-safe:animate-pulse" aria-label="amor" />{" "}
            pela{" "}
            <a
              href="https://synthropic.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/90 hover:text-primary transition-colors duration-200 underline underline-offset-2 decoration-outline-variant/40 hover:decoration-primary"
            >
              Synthropic
            </a>
          </Text>
          <div className="flex items-center gap-4 md:gap-5">
            <Link
              href="/politica-de-privacidade"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-[13px]"
            >
              Política de Privacidade
            </Link>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" aria-hidden="true" />
            <Link
              href="/termos-de-uso"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-[13px]"
            >
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
