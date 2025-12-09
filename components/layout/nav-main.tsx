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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

/**
 * Converte título para slug estável (usado como ID)
 */
const toSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

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
  const { isMobile, setOpenMobile, state, setOpen } = useSidebar()
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({})

  // Close mobile sidebar on navigation
  const handleNavigation = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }


  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url

          // Se não houver subitens, renderiza como item simples
          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                  <Link href={item.url} onClick={handleNavigation}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // Se houver subitens, renderiza como collapsible com ID estável
          const hasActiveSubItem = item.items.some(subItem => pathname === subItem.url)
          const stableId = `nav-${toSlug(item.title)}`
          const isOpen = openItems[item.title] ?? (item.isActive || hasActiveSubItem)

          return (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              onOpenChange={(open) => {
                setOpenItems(prev => ({ ...prev, [item.title]: open }))
                // Se estiver colapsada e tentando abrir, expandir sidebar
                if (open && state === 'collapsed') {
                  setOpen(true)
                }
              }}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger 
                  asChild 
                  aria-controls={stableId}
                >
                  <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent id={stableId}>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => {
                      const isSubItemActive = pathname === subItem.url
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isSubItemActive}>
                            <Link href={subItem.url} onClick={handleNavigation}>
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
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
