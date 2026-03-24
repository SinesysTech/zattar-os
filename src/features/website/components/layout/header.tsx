import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl rounded-full border border-white/5 bg-surface-container-highest/60 backdrop-blur-xl flex justify-between items-center px-8 py-3 z-50 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      <Link href="/" className="relative w-48 md:w-64 h-10 md:h-12 flex border-none outline-none">
        <Image
          src="/logos/logomarca-light.svg"
          alt="Logo Zattar Advogados"
          fill
          className="object-contain object-left dark:hidden"
          priority
        />
        <Image
          src="/logos/logomarca-dark.svg"
          alt="Logo Zattar Advogados"
          fill
          className="object-contain object-left hidden dark:block"
          priority
        />
      </Link>
      
      <div className="hidden md:flex gap-8 items-center">
        <Link
          href="#solucoes"
          className="text-primary font-bold transition-colors duration-300 font-headline tracking-tight hover:text-primary-dim"
        >
          Soluções
        </Link>
        <Link
          href="/expertise"
          className="text-on-surface-variant hover:text-primary-dim transition-colors duration-300 font-headline tracking-tight"
        >
          Especialidades
        </Link>
        <Link
          href="/insights"
          className="text-on-surface-variant hover:text-primary-dim transition-colors duration-300 font-headline tracking-tight"
        >
          Insights
        </Link>
        <Link
          href="/contato"
          className="text-on-surface-variant hover:text-primary-dim transition-colors duration-300 font-headline tracking-tight"
        >
          Contato
        </Link>
      </div>

      <Link
        href="/portal"
        className="bg-primary text-on-primary-fixed px-6 py-2 rounded-full font-bold scale-95 active:scale-90 hover:bg-primary-container transition-transform"
      >
        Acessar Portal
      </Link>
    </nav>
  );
}
