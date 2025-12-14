"use client"

import * as React from "react"
import Image from "next/image"

import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
    logoImageLight?: string
    logoImageDark?: string
  }[]
}) {
  const activeTeam = teams[0]

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex items-center justify-center px-4 py-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
          <Image
            src="/logo-sidebar-header.png"
            alt={activeTeam.name}
            width={160}
            height={80}
            className="h-auto w-full max-w-[140px] object-contain transition-all group-data-[collapsible=icon]:max-w-[32px]"
            priority
          />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
