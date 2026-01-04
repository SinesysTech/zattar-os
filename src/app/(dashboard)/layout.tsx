"use client"

import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import Search from "@/components/layout/header/search"
import Notifications from "@/components/layout/header/notifications"
import { AiSphere } from "@/components/layout/header/ai-sphere"
import { ThemeCustomizerPanel } from "@/components/layout/header/theme-customizer/panel"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { CopilotKit } from "@copilotkit/react-core"
import "@copilotkit/react-ui/styles.css"
import { CopilotSidebar, useChatContext } from "@copilotkit/react-ui"
import { SYSTEM_PROMPT } from "@/lib/copilotkit/system-prompt"

function DashboardHeader() {
  const { open, setOpen } = useChatContext()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-card px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Search />
      </div>
      <div className="flex items-center gap-2">
        <ThemeCustomizerPanel />
        <Notifications />
        <AiSphere onClick={() => setOpen(!open)} />
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <CopilotSidebar
        defaultOpen={false}
        instructions={SYSTEM_PROMPT}
        labels={{
          title: "Pedrinho",
          initial: "Olá! Como posso ajudar você hoje?",
        }}
        Button={() => null}
      >
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="h-screen overflow-hidden flex flex-col">
            <DashboardHeader />
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </CopilotSidebar>
    </CopilotKit>
  )
}
