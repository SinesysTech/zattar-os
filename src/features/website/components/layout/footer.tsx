import Link from "next/link";
import Image from "next/image";
import { Instagram, Linkedin, Facebook, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-white/5 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-24 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-12 lg:gap-8">

          {/* Brand & Social Column */}
          <div className="lg:col-span-4 pr-0 lg:pr-8">
            <Link href="/" className="relative block w-48 sm:w-56 md:w-64 h-10 sm:h-12 md:h-14 mb-6 md:mb-8 border-none outline-none">
              <Image
                src="/logos/logomarca-light.svg"
                alt="Logo Zattar Advogados"
                fill
                className="object-contain object-left dark:hidden"
              />
              <Image
                src="/logos/logomarca-dark.svg"
                alt="Logo Zattar Advogados"
                fill
                className="object-contain object-left hidden dark:block"
              />
            </Link>
            <p className="text-on-surface-variant font-sans text-sm antialiased leading-relaxed mb-6 md:mb-8 max-w-sm">
              Redefinindo os padrões da advocacia no Brasil através de inovação tecnológica, inteligência estratégica e precisão jurídica.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <a
                href="https://www.instagram.com/zattar.advogados/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-on-surface-variant hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all duration-300"
                aria-label="Instagram Zattar Advogados"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/zattaradvogados"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-on-surface-variant hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all duration-300"
                aria-label="LinkedIn Zattar Advogados"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/share/14Qyx3EPgxy/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-on-surface-variant hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all duration-300"
                aria-label="Facebook Zattar Advogados"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">

            {/* Site Institucional */}
            <div>
              <h5 className="text-on-surface font-bold font-headline mb-4 md:mb-6 tracking-wide text-sm md:text-base">Site Institucional</h5>
              <ul className="space-y-3 md:space-y-4">
                <li>
                  <Link href="/solucoes" className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-sans text-sm block w-fit">
                    Soluções
                  </Link>
                </li>
                <li>
                  <Link href="/expertise" className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-sans text-sm block w-fit">
                    Expertise
                  </Link>
                </li>
                <li>
                  <Link href="/servicos" className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-sans text-sm block w-fit">
                    Serviços
                  </Link>
                </li>
                <li>
                  <Link href="/insights" className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-sans text-sm block w-fit">
                    Insights
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-sans text-sm block w-fit">
                    Perguntas Frequentes
                  </Link>
                </li>
              </ul>
            </div>

            {/* Portal do Cliente */}
            <div>
              <h5 className="text-on-surface font-bold font-headline mb-4 md:mb-6 tracking-wide text-sm md:text-base">Portal do Cliente</h5>
              <ul className="space-y-3 md:space-y-4">
                <li>
                  <Link href="/portal" className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-sans text-sm block w-fit">
                    Acesso ao Portal
                  </Link>
                </li>
                <li>
                  <Link href="/portal/processos" className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-sans text-sm block w-fit">
                    Acompanhar Processos
                  </Link>
                </li>
                <li>
                  <Link href="/portal/financeiro" className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-sans text-sm block w-fit">
                    Gestão Financeira
                  </Link>
                </li>
                <li>
                  <Link href="/portal/contratos" className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-sans text-sm block w-fit">
                    Meus Contratos
                  </Link>
                </li>
                <li>
                  <Link href="/portal/calculadoras" className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-sans text-sm block w-fit">
                    Calculadoras
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contato Físico */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-1">
              <h5 className="text-on-surface font-bold font-headline mb-4 md:mb-6 tracking-wide text-sm md:text-base">Sede</h5>
              <ul className="space-y-4 md:space-y-5 text-on-surface-variant font-sans text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Rua dos Inconfidentes, 911 - 7º andar<br/>
                    Bairro Savassi, Belo Horizonte/MG<br/>
                    CEP: 30140-120
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary shrink-0" />
                  <a href="mailto:contato@zattaradvogados.com" className="hover:text-primary transition-colors break-all">
                    contato@zattaradvogados.com
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary shrink-0" />
                  <a href="tel:+553121152975" className="hover:text-primary transition-colors">
                    (31) 2115-2975
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Legals */}
      <div className="border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-8 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <p className="text-outline font-sans text-xs md:text-sm text-center md:text-left">
            © {new Date().getFullYear()} Zattar Advogados. Feito com dedicação pela Sinesys.
          </p>
          <div className="flex items-center gap-4 md:gap-6">
            <Link
              href="/politica-de-privacidade"
              className="text-outline hover:text-on-surface-variant transition-colors duration-200 font-sans text-xs md:text-sm"
            >
              Política de Privacidade
            </Link>
            <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
            <Link
              href="/termos-de-uso"
              className="text-outline hover:text-on-surface-variant transition-colors duration-200 font-sans text-xs md:text-sm"
            >
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
