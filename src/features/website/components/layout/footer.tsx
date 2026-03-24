import Link from "next/link";
import Image from "next/image";
import { Share2, Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-white/5">
      <div className="max-w-7xl mx-auto px-8 py-16 flex flex-col md:flex-row justify-between items-start gap-12 md:gap-8">
        <div className="max-w-sm">
          <Link href="/" className="relative block w-40 md:w-48 h-8 md:h-10 mb-8 border-none outline-none">
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
          <p className="text-on-surface-variant font-sans text-sm antialiased leading-relaxed mb-8">
            Redefinindo os padrões da advocacia trabalhista no Brasil através de inovação, ética e resultados exponenciais.
          </p>
          <div className="flex gap-4">
            <Link
              href="#"
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-on-surface hover:bg-primary hover:border-primary hover:text-on-primary-fixed transition-all"
            >
              <Share2 className="w-4 h-4" />
            </Link>
            <Link
              href="#"
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-on-surface hover:bg-primary hover:border-primary hover:text-on-primary-fixed transition-all"
            >
              <Mail className="w-4 h-4" />
            </Link>
            <Link
              href="#"
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-on-surface hover:bg-primary hover:border-primary hover:text-on-primary-fixed transition-all"
            >
              <Phone className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 sm:gap-24">
          <div>
            <h5 className="text-on-surface font-bold mb-6">Links</h5>
            <ul className="space-y-4">
              <li>
                <Link href="#" className="text-on-surface-variant hover:text-primary underline decoration-2 underline-offset-4 transition-all font-sans text-sm">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="#" className="text-on-surface-variant hover:text-primary underline decoration-2 underline-offset-4 transition-all font-sans text-sm">
                  Termos de Serviço
                </Link>
              </li>
              <li>
                <Link href="#" className="text-on-surface-variant hover:text-primary underline decoration-2 underline-offset-4 transition-all font-sans text-sm">
                  Aviso Legal
                </Link>
              </li>
              <li>
                <Link href="#" className="text-on-surface-variant hover:text-primary underline decoration-2 underline-offset-4 transition-all font-sans text-sm">
                  Carreiras
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-on-surface font-bold mb-6">Contato</h5>
            <ul className="space-y-4 text-on-surface-variant font-sans text-sm">
              <li>Av. Paulista, 2000</li>
              <li>São Paulo - SP</li>
              <li>contato@zattaradvogados.com.br</li>
              <li>0800 123 4567</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 border-t border-white/5 text-center md:text-left">
        <p className="text-on-surface-variant font-sans text-sm">
          © {new Date().getFullYear()} Zattar Advogados. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
