"use client"

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import Search from "@/components/layout/search"
import { AiSphere } from "@/components/layout/ai-sphere"
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
      <div className="flex items-center gap-2 px-4 flex-1">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Search />
      </div>
      <div className="flex items-center">
        <AiSphere onClick={() => setOpen(!open)} />
      </div>
    </div>
  )
}
