"use client";

import { PortalSidebar } from "./sidebar";
import { PortalHeader } from "./header";
import { PortalCopilotProvider } from "./portal-copilot-provider";
import { ReactNode } from "react";

interface PortalShellProps {
  children: ReactNode;
}

export function PortalShell({ children }: PortalShellProps) {
  return (
    <PortalCopilotProvider>
      <div className="min-h-screen bg-background text-foreground font-body selection:bg-primary/30">
        <PortalSidebar />
        <PortalHeader />
        <main className="lg:pl-72 pt-28 px-6 lg:pr-8 pb-12 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
        <footer className="lg:pl-72 border-t border-white/5 px-6 lg:pr-8 py-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Zattar Advogados. Todos os direitos reservados.</p>
            <div className="flex items-center gap-6">
              <a href="/termos" className="hover:text-primary transition-colors">
                Termos de Uso
              </a>
              <a href="/privacidade" className="hover:text-primary transition-colors">
                Política de Privacidade
              </a>
              <a href="/lgpd" className="hover:text-primary transition-colors">
                LGPD
              </a>
            </div>
          </div>
        </footer>
      </div>
    </PortalCopilotProvider>
  );
}
