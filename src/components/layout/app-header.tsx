"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import Search from "@/components/layout/search"
import { AiSphere } from "@/components/layout/ai-sphere"
import { useChatContext } from "@copilotkit/react-ui"

export function AppHeader() {
  const { open, setOpen } = useChatContext()

  return (
    <div className="flex h-14 items-center gap-2 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-border bg-card w-full">
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
