"use client"

import { type ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PortalAppSidebar } from "./portal-app-sidebar"
import { PortalHeader } from "./portal-header"

interface PortalShellProps {
  children: ReactNode
  clientName?: string
}

export function PortalShell({ children, clientName = "Cliente" }: PortalShellProps) {
  return (
    <SidebarProvider>
      <PortalAppSidebar clientName={clientName} />
      <SidebarInset>
        <PortalHeader clientName={clientName} />
        <ScrollArea data-sidebar="inset-content" className="flex-1">
          <div className="flex flex-col gap-8 px-4 md:px-8 lg:px-12 py-6 canvas-dots">
            {children}
          </div>
          {/* Footer */}
          <footer className="border-t border-border px-4 md:px-8 lg:px-12 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-portal-text-muted">
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
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  )
}
