import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Servicos Trabalhistas | Zattar Advogados",
  description: "Calculadoras, geradores de documentos e diagnosticos trabalhistas gratuitos.",
}

export default function ServicosPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-headline font-bold text-lg tracking-tight">
            Zattar <span className="text-primary">Advogados</span>
          </Link>
          <Link
            href="/portal"
            className="text-xs font-bold uppercase tracking-widest bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Acessar Portal
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>

      {/* Simple footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Zattar Advogados. Todos os direitos reservados.</p>
          <p className="mt-2">As ferramentas tem carater informativo e nao substituem orientacao juridica profissional.</p>
        </div>
      </footer>
    </div>
  )
}
