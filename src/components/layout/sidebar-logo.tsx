"use client"

import * as React from "react"
import Image from "next/image"

import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function SidebarLogo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center justify-center px-4 py-1.5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
          {/* Logo completo - visível quando expandido */}
          <Image
            src="/logo-sidebar-header.png"
            alt="Zattar Advogados"
            width={160}
            height={80}
            className="h-auto w-full max-w-[140px] object-contain transition-all group-data-[collapsible=icon]:hidden"
            priority
          />
          {/* Logo pequeno (Z) - visível quando colapsado */}
          <Image
            src="/logo-small-white.svg"
            alt="Z"
            width={40}
            height={40}
            className="hidden h-10 w-10 object-contain transition-all group-data-[collapsible=icon]:block"
            priority
          />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
