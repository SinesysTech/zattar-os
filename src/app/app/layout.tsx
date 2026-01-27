"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import Search from "@/components/layout/header/search"
import Notifications from "@/components/layout/header/notifications"
import { AiSphere } from "@/components/layout/header/ai-sphere"
import { ThemeCustomizerPanel } from "@/components/layout/header/theme-customizer/panel"
import { HeaderUserMenu } from "@/components/layout/header/header-user-menu"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { CopilotKit } from "@copilotkit/react-core"
import "@copilotkit/react-ui/styles.css"
import { CopilotSidebar, useChatContext } from "@copilotkit/react-ui"
import { SYSTEM_PROMPT } from "@/lib/copilotkit/system-prompt"
import { cn } from "@/lib/utils"

const AUTH_ROUTES = [
  "/app/login",
  "/app/sign-up",
  "/app/sign-up-success",
  "/app/forgot-password",
  "/app/update-password",
  "/app/confirm",
  "/app/error",
]

function DashboardHeader() {
  const { open, setOpen } = useChatContext()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const contentArea = document.getElementById("portal-content")
    if (!contentArea) return

    const handleScroll = () => {
      setIsScrolled(contentArea.scrollTop > 10)
    }

    contentArea.addEventListener("scroll", handleScroll)
    return () => contentArea.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between gap-4 px-4 transition-all duration-200",
        isScrolled
          ? "bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-background border-b border-border/30"
      )}
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 hover:bg-muted transition-colors" />
        <Separator orientation="vertical" className="h-5 bg-border/50" />
        <Search />
      </div>
      <div className="flex items-center gap-2">
        <ThemeCustomizerPanel />
        <Notifications />
        <AiSphere onClick={() => setOpen(!open)} />
        <Separator orientation="vertical" className="h-5 bg-border/50" />
        <HeaderUserMenu />
      </div>
    </header>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-screen overflow-hidden flex flex-col bg-muted/30">
        <DashboardHeader />
        <div
          id="portal-content"
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 scroll-smooth"
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTES.some(route => pathname?.startsWith(route))

  if (isAuthRoute) {
    return <div className="min-h-svh bg-background">{children}</div>
  }

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
        <DashboardContent>{children}</DashboardContent>
      </CopilotSidebar>
    </CopilotKit>
  )
}
