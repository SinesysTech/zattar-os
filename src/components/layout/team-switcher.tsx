"use client"

import * as React from "react"
import Image from "next/image"
import { useTheme } from "next-themes"

import {
  SidebarMenu,
  SidebarMenuButton,
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
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!activeTeam) {
    return null
  }

  const currentTheme = theme === "system" ? systemTheme : theme
  const isDark = currentTheme === "dark"
  const logoSrc = mounted && activeTeam.logoImageLight && activeTeam.logoImageDark
    ? (isDark ? activeTeam.logoImageDark : activeTeam.logoImageLight)
    : null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
          <div className="bg-white text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg shadow-md group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:mx-auto">
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={activeTeam.name}
                width={16}
                height={16}
                className="size-4 object-contain"
                priority
              />
            ) : (
              <activeTeam.logo className="size-4" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">{activeTeam.name}</span>
            <span className="truncate text-[10px] italic">{activeTeam.plan}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
