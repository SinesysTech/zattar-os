"use client"

import * as React from "react"
import {
  Calendar,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Scale,
  Users,
  UserCog,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/client"

const teams = [
  {
    name: "Zattar Advogados",
    logo: Scale,
    plan: "Enterprise",
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
    title: "Clientes",
    url: "/clientes",
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
]

const navAdmin = [
  {
    name: "Usuários",
    url: "/usuarios",
    icon: UserCog,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<{
    name: string
    email: string
    avatar: string
  } | null>(null)

  React.useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient()
        
        // Obter usuário autenticado do Supabase Auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          console.error("Erro ao obter usuário autenticado:", authError)
          return
        }

        // Buscar dados do usuário na tabela usuarios
        const { data: usuario, error: usuarioError } = await supabase
          .from("usuarios")
          .select("nome_exibicao, email_corporativo")
          .eq("auth_user_id", authUser.id)
          .single()

        if (usuarioError || !usuario) {
          // Se não encontrar na tabela usuarios, usar dados do auth
          setUser({
            name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Usuário",
            email: authUser.email || "",
            avatar: authUser.user_metadata?.avatar_url || "",
          })
          return
        }

        // Usar dados da tabela usuarios
        setUser({
          name: usuario.nome_exibicao,
          email: usuario.email_corporativo,
          avatar: authUser.user_metadata?.avatar_url || "",
        })
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error)
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
