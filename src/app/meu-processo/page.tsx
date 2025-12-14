import { CpfHeroForm } from '@/features/portal-cliente/components/hero/cpf-hero-form';
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col h-screen md:overflow-x-auto overflow-x-hidden bg-background">
      {/* Header with logo */}
      <header className="w-full shrink-0 p-6 flex items-center justify-center md:justify-start md:px-12">
        <div className="w-10 h-10 flex items-center justify-center">
            <Image 
                src="/logo_pz.png" 
                alt="Logo Zattar Advogados" 
                width={40}
                height={40}
                className="h-10 w-auto object-contain" 
            />
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto">
          <CpfHeroForm />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="w-full py-6 shrink-0 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Zattar Advogados. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
