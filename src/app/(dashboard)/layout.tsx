import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { CopilotProviderWrapper } from "@/lib/copilotkit/components"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        
        <main className="flex flex-1 flex-col h-full overflow-hidden relative transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-full">
            <AppHeader />
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
              <div className="mx-auto max-w-7xl h-full">
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
