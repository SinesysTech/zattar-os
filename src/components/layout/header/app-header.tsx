"use client"

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import Search from "@/components/layout/header/search"
import { AiSphere } from "@/components/layout/header/ai-sphere"
import Notifications from "@/components/layout/header/notifications"
import { HeaderUserMenu } from "@/components/layout/header/header-user-menu"
import { useChatContext } from "@copilotkit/react-ui"
import { cn } from "@/lib/utils"

export function AppHeader() {
  const { open, setOpen } = useChatContext()
  const { isScrolled } = useSidebar()

  return (
    <div
      className={cn(
        "flex h-14 items-center gap-2 px-4 w-full border-b",
        "transition-all duration-200 ease-linear",
        "group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
        isScrolled
          ? "backdrop-blur-md bg-card/80 border-border/50 shadow-sm"
          : "bg-card border-border"
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1 max-w-xl">
          <Search />
        </div>
        <Separator orientation="vertical" className="h-6" />
      </div>
      <div className="flex items-center gap-2">
        <AiSphere onClick={() => setOpen(!open)} />
        <Notifications />
        <Separator orientation="vertical" className="h-6" />
        <HeaderUserMenu />
      </div>
    </div>
  )
}
