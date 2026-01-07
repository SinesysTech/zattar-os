"use client"

import * as React from "react"
import {
  Bell,
  Bot,
  Calendar,
  BookOpen,
  FileText,
  FolderOpen,
  Handshake,
  LayoutDashboard,
  Microscope,
  Scale,
  Users,
  Database,
  FileEdit,
  MessageSquare,
  Wallet,
  PenTool,
  UsersRound,
  CheckSquare,
  Columns3,
  StickyNote,
  ListTodo,
} from "lucide-react"

import { NavMain } from "@/components/layout/sidebar/nav-main"
import { NavProjects } from "@/components/layout/sidebar/nav-projects"
import { NavUser } from "@/components/layout/sidebar/nav-user"
import { SidebarLogo } from "@/components/layout/sidebar/sidebar-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { useMinhasPermissoes } from "@/features/usuarios"

// Nav Principal - Funcionalidades core do escritório
const navPrincipal = [
  {
    title: "Dashboard",
    url: "/app/dashboard",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Partes",
    url: "/app/partes",
    icon: Users,
  },
  {
    title: "Contratos",
    url: "/app/contratos",
    icon: FileText,
  },
  {
    title: "Processos",
    url: "/app/processos",
    icon: Scale,
  },
  {
    title: "Audiências",
    url: "/app/audiencias/semana",
    icon: Calendar,
  },
  {
    title: "Expedientes",
    url: "/app/expedientes",
    icon: FolderOpen,
  },
  {
    title: "Perícias",
    url: "/app/pericias",
    icon: Microscope,
  },
  {
    title: "Obrigações",
    url: "/app/acordos-condenacoes",
    icon: Handshake,
  },
  {
    title: "Equipe",
    url: "/app/usuarios",
    icon: UsersRound,
  },
]

// Nav Serviços - Ferramentas e utilitários
const navServicos = [
  {
    name: "Assistentes",
    url: "/app/assistentes",
    icon: Bot,
  },
  {
    name: "Assinatura Digital",
    url: "/app/assinatura-digital",
    icon: PenTool,
  },
  {
    name: "Chat",
    url: "/app/chat",
    icon: MessageSquare,
  },
  {
    name: "Documentos",
    url: "/app/documentos",
    icon: FileEdit,
  },
  {
    name: "Tarefas",
    url: "/app/tarefas",
    icon: CheckSquare,
  },
  {
    name: "Kanban",
    url: "/app/kanban",
    icon: Columns3,
  },
  {
    name: "Notas",
    url: "/app/notas",
    icon: StickyNote,
  },
  {
    name: "To-Do",
    url: "/app/todo",
    icon: ListTodo,
  },
  {
    name: "Diário Oficial",
    url: "/app/comunica-cnj",
    icon: Bell,
  },
  {
    name: "Pangea",
    url: "/app/pangea",
    icon: BookOpen,
  },
]

// Nav Gestão - Ferramentas administrativas (apenas super admin)
const navGestao = [
  {
    name: "Financeiro",
    url: "/app/financeiro",
    icon: Wallet,
  },
  {
    name: "Recursos Humanos",
    url: "/app/rh",
    icon: Users,
  },
  {
    name: "Captura",
    url: "/app/captura",
    icon: Database,
  },
]

// Função para gerar URL pública do avatar
function getAvatarPublicUrl(avatarPath: string | null | undefined): string {
  if (!avatarPath) return ""
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return ""
  return `${supabaseUrl}/storage/v1/object/public/avatar/${avatarPath}`
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<{
    name: string
    email: string
    avatar: string
  } | null>(null)

  const hasLoadedRef = React.useRef(false)
  const { isAuthenticated, logout } = useAuth()
  const { data: permissoesData, temPermissao, isLoading: loadingPermissoes } = useMinhasPermissoes()
  const canSeePangea = !loadingPermissoes && temPermissao("pangea", "listar")
  const isSuperAdmin = permissoesData?.isSuperAdmin || false

  const navServicosFiltrado = React.useMemo(() => {
    return navServicos.filter((item) => {
      if (item.url === "/app/pangea") {
        return canSeePangea
      }
      return true
    })
  }, [canSeePangea])

  React.useEffect(() => {
    // Se não estiver autenticado, não tentar carregar usuário
    if (!isAuthenticated) {
      setUser(null)
      return
    }

    // Evitar múltiplas chamadas
    if (hasLoadedRef.current) {
      return
    }

    async function loadUser() {
      try {
        hasLoadedRef.current = true

        // Buscar perfil do usuário logado via API
        const response = await fetch('/api/perfil', {
          credentials: 'include',
        })

        // Se receber 401 (não autenticado), fazer logout automático
        if (response.status === 401) {
          console.log('Sessão expirada detectada na sidebar, fazendo logout')
          hasLoadedRef.current = false
          setUser(null)
          await logout()
          return
        }

        if (!response.ok) {
          // Se não conseguir buscar via API, tentar usar dados do auth como fallback
          try {
            const supabase = createClient()
            const { data: { user: authUser }, error } = await supabase.auth.getUser()

            if (error || !authUser) {
              // Sessão inválida, fazer logout
              hasLoadedRef.current = false
              setUser(null)
              await logout()
              return
            }

            setUser({
              name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Usuário",
              email: authUser.email || "",
              avatar: authUser.user_metadata?.avatar_url || "",
            })
          } catch {
            // Ignorar erro do fallback, mas resetar flag para permitir retry
            hasLoadedRef.current = false
          }
          return
        }

        const data = await response.json()

        if (data.success && data.data) {
          const usuario = data.data
          setUser({
            name: usuario.nomeExibicao || usuario.nomeCompleto || "Usuário",
            email: usuario.emailCorporativo || usuario.emailPessoal || "",
            avatar: getAvatarPublicUrl(usuario.avatarUrl),
          })
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error)
        hasLoadedRef.current = false // Permitir retry em caso de erro

        // Se o erro for relacionado a autenticação, fazer logout
        if (error instanceof Error && error.message.includes('auth')) {
          await logout()
        }
      }
    }

    loadUser()
  }, [isAuthenticated, logout])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navPrincipal} />
        <NavProjects projects={navServicosFiltrado} label="Serviços" showActions={false} />
        {isSuperAdmin && (
          <NavProjects projects={navGestao} label="Gestão" showActions={false} />
        )}
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
