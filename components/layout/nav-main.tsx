"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

/**
 * Componente individual para item com subitens (collapsible)
 * Usa useId() para gerar IDs estáveis e evitar hydration mismatch
 */
function NavMainCollapsibleItem({
  item,
  isActive,
  hasActiveSubItem,
  pathname,
}: {
  item: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items: { title: string; url: string }[]
  }
  isActive: boolean
  hasActiveSubItem: boolean
  pathname: string
}) {
  const id = React.useId()

  return (
    <Collapsible
      asChild
      defaultOpen={item.isActive || hasActiveSubItem}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={isActive} aria-controls={id}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent id={id}>
          <SidebarMenuSub>
            {item.items.map((subItem) => {
              const isSubItemActive = pathname === subItem.url
              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                    <Link href={subItem.url}>
                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url

          // Se não houver subitens, renderiza como item simples
          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // Se houver subitens, renderiza como collapsible
          const hasActiveSubItem = item.items.some(subItem => pathname === subItem.url)

          return (
            <NavMainCollapsibleItem
              key={item.title}
              item={{ ...item, items: item.items }}
              isActive={isActive}
              hasActiveSubItem={hasActiveSubItem}
              pathname={pathname}
            />
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
