import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { CopilotProviderWrapper } from "@/lib/copilotkit/components"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Padding único do conteúdo do dashboard (controle centralizado aqui)
  const DASHBOARD_CONTENT_PADDING = "px-0 py-2 sm:px-1 sm:py-3 md:px-1 md:py-3"

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        
        <main className="flex flex-1 flex-col h-full overflow-hidden relative transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-full">
            <AppHeader />
            
            <div className={`flex-1 overflow-y-auto scrollbar-hide ${DASHBOARD_CONTENT_PADDING}`}>
              <div className="mx-auto h-full w-full max-w-none">
                <CopilotProviderWrapper>
                  {children}
                </CopilotProviderWrapper>
              </div>
            </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
