import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { CopilotProviderWrapper } from "@/lib/copilotkit/components"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  /**
   * Padding único do conteúdo do dashboard (controle centralizado aqui)
   * 
   * IMPORTANTE: Este é o único lugar onde o padding do conteúdo principal deve ser definido.
   * Não adicione padding adicional em páginas individuais para evitar superposição.
   * 
   * Responsivo:
   * - Mobile: px-4 py-4 (padding adequado para telas pequenas)
   * - Small: px-4 py-6 (mais espaço vertical em telas médias)
   * - Medium+: px-6 py-6 (padding generoso para desktop)
   */
  const DASHBOARD_CONTENT_PADDING = "px-4 py-4 sm:px-4 sm:py-6 md:px-6 md:py-6"

  return (
    <SidebarProvider>
      <AppSidebar />
      <CopilotProviderWrapper>
        <SidebarInset>
          <div className="flex flex-col h-screen overflow-hidden min-h-0">
            <AppHeader />

            <ScrollArea
              data-sidebar="inset-content"
              className="flex-1"
            >
              <div className={`mx-auto h-full w-full max-w-full min-h-0 ${DASHBOARD_CONTENT_PADDING}`}>
                {children}
              </div>
            </ScrollArea>
          </div>
        </SidebarInset>
      </CopilotProviderWrapper>
    </SidebarProvider>
  )
}
