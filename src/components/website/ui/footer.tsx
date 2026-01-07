// components/Footer.tsx

import React from "react";
import Link from "next/link";
import Image from "next/image";
// Certifique-se de que todos os ícones, incluindo FacebookIcon, estão sendo importados
import { BrandInstagram, BrandLinkedin, BrandFacebook } from "@mynaui/icons-react";

// --- Tipos para os dados ---
interface FooterLink {
  text: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

// --- Dados das seções de links adaptados para o escritório ---
const footerSections: FooterSection[] = [
  {
    title: "Institucional",
    links: [
      { text: "O Escritório", href: "/sobre" },
      { text: "Nossa Equipe", href: "/equipe" },
      { text: "Atuação", href: "/atuacao" },
      { text: "Contato", href: "/contato" },
    ],
  },
  {
    title: "Áreas de Atuação",
    links: [
      { text: "Direito do Trabalho", href: "/atuacao/trabalhista" },
      { text: "Consultoria Preventiva", href: "/atuacao/consultoria" },
      { text: "Trabalhadores de Apps", href: "/atuacao/apps" },
      { text: "Direito Civil", href: "/atuacao/civil" },
    ],
  },
  {
    title: "Conteúdo",
    links: [
      { text: "Blog e Artigos", href: "/blog" },
      { text: "Na Mídia", href: "/midia" },
      { text: "Perguntas Frequentes", href: "/faq" },
    ],
  },
];

// --- Subcomponente para a coluna de links (sem alterações) ---
const FooterLinkColumn: React.FC<FooterSection> = ({ title, links }) => (
  <div>
    <h3 className="mb-4 font-semibold uppercase tracking-wide text-foreground">{title}</h3>
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.text}>
          <Link
            href={link.href}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            {link.text}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

// --- Componente Principal do Rodapé ---
export const Footer: React.FC = () => {
  return (
    <footer className="bg-muted/60 border-t border-border/50">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl py-16">
        {/* Seção Superior: Logo, Contatos e Links */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          {/* Coluna 1: Logo, Contatos e Social */}
          <div className="lg:col-span-2">
            <Link aria-label="Logo Zattar Advogados" href="/" className="inline-block">
              <Image
                src="/logos/logomarca-light.svg"
                alt="Zattar Advogados"
                width={240}
                height={64}
                className="h-16 w-auto max-w-[240px] object-contain dark:hidden"
                priority={false}
                draggable={false}
              />
              <Image
                src="/logos/logomarca-dark.svg"
                alt="Zattar Advogados"
                width={240}
                height={64}
                className="h-16 w-auto max-w-[240px] object-contain hidden dark:block"
                priority={false}
                draggable={false}
              />
            </Link>

            <div className="mt-6 space-y-4 text-sm text-muted-foreground">
              <p className="leading-relaxed">
                Rua dos Inconfidentes, 911 - 7º andar <br />
                Bairro Savassi, Belo Horizonte/MG <br />
                CEP: 30140-120
              </p>
              <p className="leading-relaxed">
                <strong className="text-foreground">E-mail:</strong> contato@zattaradvogados.com{" "}
                <br />
                <strong className="text-foreground">Telefones:</strong> (31) 2115-2975
              </p>
            </div>

            <div className="mt-6 flex space-x-4">
              <a
                href="https://www.instagram.com/zattar.advogados/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram da Polastri e Zattar Advogados"
              >
                <BrandInstagram className="size-6" />
              </a>
              <a
                href="https://www.linkedin.com/company/zattaradvogados"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn da Polastri e Zattar Advogados"
              >
                <BrandLinkedin className="size-6" />
              </a>
              <a
                href="https://www.facebook.com/share/14Qyx3EPgxy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook da Polastri e Zattar Advogados"
              >
                <BrandFacebook className="size-6" />
              </a>
            </div>
          </div>

          {/* Colunas de Links (Renderizadas dinamicamente) */}
          {footerSections.map((section) => (
            <FooterLinkColumn key={section.title} title={section.title} links={section.links} />
          ))}
        </div>

        {/* Seção Inferior: Copyright e Links Legais */}
        <div className="mt-16 flex flex-col items-center justify-between border-t border-border/50 pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2025 Zattar Advogados. Feito com ❤️ pela Sinesys.
          </p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <Link
              href="/politica-de-privacidade"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              Política de Privacidade
            </Link>
            <Link
              href="/termos-de-uso"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
