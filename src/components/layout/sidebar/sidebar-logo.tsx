"use client"

import { BrandMark } from "@/components/shared/brand-mark"
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function SidebarLogo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center justify-center px-4 py-1.5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
          <BrandMark
            variant="dark"
            size="custom"
            collapsible
            priority
            className="h-auto w-full max-w-35 transition-all"
          />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
