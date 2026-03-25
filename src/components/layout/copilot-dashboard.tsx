"use client"

import Image from "next/image"
import Search from "@/components/layout/header/search"
import Notifications from "@/components/layout/header/notifications"
import { AiSphere } from "@/components/layout/header/ai-sphere"
import { AuthenticatorPopover } from "@/components/layout/header/authenticator-popover"
import { HeaderUserMenu } from "@/components/layout/header/header-user-menu"
import { Separator } from "@/components/ui/separator"
import { AppDock } from "@/components/layout/dock/app-dock"
import { CopilotKit } from "@copilotkit/react-core"
import "@copilotkit/react-ui/styles.css"
import { CopilotSidebar, useChatContext } from "@copilotkit/react-ui"
import { SYSTEM_PROMPT } from "@/lib/copilotkit/system-prompt"
import { cn } from "@/lib/utils"

function DashboardHeader() {
  const { open, setOpen } = useChatContext()

  return (
    <header
      className={cn(
        "flex h-16 mt-4 mx-4 shrink-0 items-center justify-between gap-4 px-6 transition-all duration-200 rounded-xl z-40 sticky top-4",
        "bg-surface-container-highest/60 backdrop-blur-xl border border-white/10 shadow-2xl font-headline font-medium"
      )}
    >
      <div className="flex items-center gap-3">
        <Image
          src="/logos/logo-small-dark.svg"
          alt="Zattar"
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
          priority
        />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <Search />
      </div>
      <div className="flex items-center gap-2">
        <AuthenticatorPopover />
        <Notifications />
        <AiSphere onClick={() => setOpen(!open)} size={30} />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <HeaderUserMenu />
      </div>
    </header>
  )
}

export default function CopilotDashboard({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" useSingleEndpoint>
      <CopilotSidebar
        defaultOpen={false}
        instructions={SYSTEM_PROMPT}
        labels={{
          title: "Pedrinho",
          initial: "Olá! Como posso ajudar você hoje?",
        }}
        Button={() => null}
      >
        <div className="h-svh min-h-svh overflow-hidden flex flex-col bg-background">
          <DashboardHeader />
          <div
            id="portal-content"
            className="flex min-h-0 flex-1 flex-col overflow-y-auto scroll-smooth gap-6 p-6 pb-24"
          >
            {children}
          </div>
          <AppDock />
        </div>
      </CopilotSidebar>
    </CopilotKit>
  )
}
