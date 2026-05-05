"use client"

import { useEffect } from "react"
import { DashboardLogoButton } from "@/components/layout/header/dashboard-logo-button"
import { ModulesMenuButton } from "@/components/layout/header/modules-menu-button"
import "@copilotkit/react-core/v2/styles.css"
import {
  CopilotKitProvider,
  CopilotChatConfigurationProvider,
  useCopilotChatConfiguration,
  CopilotSidebar,
} from "@copilotkit/react-core/v2"
import { CopilotGlobalActions } from "@/lib/copilotkit/components/copilot-global-actions"
import { PageSearchProvider } from "@/contexts/page-search-context"
import { useUser } from "@/providers/user-provider"
import { useBreakpointBelow } from "@/hooks/use-breakpoint"
import { cn } from "@/lib/utils"

const SIDEBAR_WIDTH = 480

// ─── Pedrinho Header Toggle ─────────────────────────────────────────────

function PedrinhoHeaderToggle() {
  const config = useCopilotChatConfiguration()

  return (
    <button
      onClick={() => config?.setModalOpen(!config.isModalOpen)}
      className={cn(
        "pedrinho-header-toggle group/pedrinho relative flex items-center justify-center",
        "size-9 rounded-xl cursor-pointer",
        "bg-card/80 border border-border",
        "hover:bg-primary/8 hover:border-primary/25",
        "hover:shadow-[0_0_16px_oklch(var(--primary)/0.12)]",
        "active:scale-95",
        "transition-all duration-200 ease-out"
      )}
      title="Pedrinho · Clique para abrir assistente"
    >
      <div className="absolute inset-0 rounded-xl bg-primary/6 opacity-0 group-hover/pedrinho:opacity-100 transition-opacity duration-300" />
      <span className="relative flex items-center justify-center">
        <span className="flex gap-1.5">
          <span className="size-1.5 rounded-full bg-primary/70 group-hover/pedrinho:bg-primary transition-colors duration-200" />
          <span className="size-1.5 rounded-full bg-primary/70 group-hover/pedrinho:bg-primary transition-colors duration-200" />
        </span>
      </span>
    </button>
  )
}

// ─── Dashboard Header ────────────────────────────────────────────────────

function DashboardHeader() {
  return (
    <div className="relative flex h-16 shrink-0 items-center px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-2 z-40">
      <ModulesMenuButton />
      <div className="absolute left-1/2 -translate-x-1/2">
        <DashboardLogoButton />
      </div>
      <div className="ml-auto">
        <PedrinhoHeaderToggle />
      </div>
    </div>
  )
}

// ─── Dashboard Layout ────────────────────────────────────────────────────

function DashboardLayout({ children, userId }: { children: React.ReactNode; userId: string }) {
  const config = useCopilotChatConfiguration()
  const isSidebarOpen = config?.isModalOpen ?? false
  const isMobile = useBreakpointBelow('md')

  // Cmd+J to toggle sidebar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'j') {
        e.preventDefault()
        config?.setModalOpen(!config.isModalOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [config])

  return (
    <>
      <div
        className={cn(
          "fixed top-0 bottom-0 left-0 flex flex-col bg-background canvas-dots",
          "transition-[right] duration-300 ease-out"
        )}
        style={{ right: isSidebarOpen && !isMobile ? `${SIDEBAR_WIDTH}px` : 0 }}
      >
        <DashboardHeader />
        <div
          id="portal-content"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth gap-6 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 pb-8 scrollbar-macos"
        >
          {children}
        </div>
      </div>

      <CopilotSidebar
        defaultOpen={false}
        width={SIDEBAR_WIDTH}
        toggleButton={{ style: { display: 'none' } }}
        threadId={`user-${userId}`}
        labels={{
          modalHeaderTitle: 'Pedrinho',
          welcomeMessageText: 'Olá! Como posso ajudar?',
          chatInputPlaceholder: 'Mensagem...',
        }}
        messageView={{
          className: 'gap-3 p-4',
          assistantMessage:
            'bg-muted/40 text-foreground/85 rounded-[14px] border border-border/10 text-[13px] leading-[1.6] px-4 py-3 dark:bg-primary/4 dark:border-primary/6',
          userMessage:
            'bg-primary/7 text-foreground/90 rounded-[14px] rounded-br-[6px] border border-primary/10 text-[13px] leading-[1.6] px-3.5 py-2.5',
        }}
        suggestionView={{
          container: 'gap-2 px-4 pb-2',
          suggestion:
            'rounded-lg border-border/30 bg-muted/50 dark:bg-foreground/5 text-foreground/70 text-[11px] font-medium hover:bg-muted/70 dark:hover:bg-foreground/10 hover:text-foreground/90',
        }}
      />
    </>
  )
}

// ─── Root ────────────────────────────────────────────────────────────────

export default function CopilotDashboard({ children }: { children: React.ReactNode }) {
  const { id: userId } = useUser()

  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      onError={(event) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[CopilotKit ${event.code}]`, event.error.message)
        }
      }}
    >
      <CopilotGlobalActions />
      <CopilotChatConfigurationProvider isModalDefaultOpen={false}>
        <PageSearchProvider>
          <DashboardLayout userId={String(userId ?? '')}>
            {children}
          </DashboardLayout>
        </PageSearchProvider>
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  )
}
