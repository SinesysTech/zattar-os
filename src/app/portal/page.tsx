import { CpfHeroForm } from './feature';
import Image from "next/image";
import { BackgroundPattern } from "@/components/website/ui/background-pattern";

export default function Home() {
  return (
    <div className="relative flex flex-col h-screen md:overflow-x-auto overflow-x-hidden bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <BackgroundPattern />
      </div>

      {/* Header with logo */}
      <header className="relative z-10 w-full shrink-0 p-4 flex items-center justify-center">
        <div className="relative w-50 md:w-[320px] h-12 md:h-16">
          <Image
            src="/logos/logomarca-light.svg"
            alt="Logo Zattar Advogados"
            fill
            className="object-contain object-center dark:hidden"
            priority
          />
          <Image
            src="/logos/logomarca-dark.svg"
            alt="Logo Zattar Advogados"
            fill
            className="object-contain object-center hidden dark:block"
            priority
          />
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-auto flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto">
          <CpfHeroForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 shrink-0 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Zattar Advogados. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
