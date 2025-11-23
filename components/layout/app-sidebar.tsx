"use client"

import * as React from "react"
import {
  Calendar,
  FileText,
  FolderOpen,
  Handshake,
  LayoutDashboard,
  Scale,
  Users,
  UserCog,
  Database,
} from "lucide-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavProjects } from "@/components/layout/nav-projects"
import { NavUser } from "@/components/layout/nav-user"
import { TeamSwitcher } from "@/components/layout/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { createClient } from "@/app/_lib/supabase/client"

const teams = [
  {
    name: "Zattar Advogados",
    logo: Scale,
    plan: "by Sinesys",
    logoImageLight: "/logo-small-light.svg",
    logoImageDark: "/logo-small-dark.svg",
  },
]

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Partes",
    url: "/partes",
    icon: Users,
  },
  {
    title: "Contratos",
    url: "/contratos",
    icon: FileText,
  },
  {
    title: "Processos",
    url: "/processos",
    icon: Scale,
  },
  {
    title: "Audiências",
    url: "/audiencias",
    icon: Calendar,
  },
  {
    title: "Expedientes",
    url: "/expedientes",
    icon: FolderOpen,
  },
  {
    title: "Obrigações",
    url: "/acordos-condenacoes",
    icon: Handshake,
  },
]

const navAdmin = [
  {
    name: "Usuários",
    url: "/usuarios",
    icon: UserCog,
  },
  {
    name: "Captura",
    url: "/captura",
    icon: Database,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<{
    name: string
    email: string
    avatar: string
  } | null>(null)

  const hasLoadedRef = React.useRef(false)

  React.useEffect(() => {
    // Evitar múltiplas chamadas
    if (hasLoadedRef.current) {
      return
    }

    async function loadUser() {
      try {
        hasLoadedRef.current = true
        
        // Buscar perfil do usuário logado via API
        const response = await fetch('/api/perfil')

        if (!response.ok) {
          // Se não conseguir buscar via API, tentar usar dados do auth como fallback
          try {
            const supabase = createClient()
            const { data: { user: authUser } } = await supabase.auth.getUser()
            
            if (authUser) {
              setUser({
                name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Usuário",
                email: authUser.email || "",
                avatar: authUser.user_metadata?.avatar_url || "",
              })
            }
          } catch {
            // Ignorar erro do fallback
          }
          return
        }

        const data = await response.json()

        if (data.success && data.data) {
          const usuario = data.data
          setUser({
            name: usuario.nomeExibicao || usuario.nomeCompleto || "Usuário",
            email: usuario.emailCorporativo || usuario.emailPessoal || "",
            avatar: "",
          })
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error)
        hasLoadedRef.current = false // Permitir retry em caso de erro
      }
    }

    loadUser()
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={navAdmin} label="Administração" showActions={false} />
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <NavUser user={user} />
        ) : (
          <div className="px-2 py-2">
            <div className="h-10 w-full animate-pulse rounded-lg bg-sidebar-accent" />
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
