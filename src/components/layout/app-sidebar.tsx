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
} from "lucide-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavProjects } from "@/components/layout/nav-projects"
import { NavUser } from "@/components/layout/nav-user"
import { SidebarLogo } from "@/components/layout/sidebar-logo"
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
    url: "/audiencias/semana",
    icon: Calendar,
  },
  {
    title: "Expedientes",
    url: "/expedientes",
    icon: FolderOpen,
  },
  {
    title: "Perícias",
    url: "/pericias",
    icon: Microscope,
  },
  {
    title: "Obrigações",
    url: "/acordos-condenacoes",
    icon: Handshake,
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: Wallet,
  },
  {
    title: "Equipe",
    url: "/usuarios",
    icon: UsersRound,
  },
]

// Nav Serviços - Ferramentas e utilitários
const navServicos = [
  {
    name: "Assistentes",
    url: "/assistentes",
    icon: Bot,
  },
  {
    name: "Assinatura Digital",
    url: "/assinatura-digital",
    icon: PenTool,
  },
  {
    name: "Chat",
    url: "/chat",
    icon: MessageSquare,
  },
  {
    name: "Documentos",
    url: "/documentos",
    icon: FileEdit,
  },
  {
    name: "Diário Oficial",
    url: "/comunica-cnj",
    icon: Bell,
  },
  {
    name: "Pangea",
    url: "/pangea",
    icon: BookOpen,
  },
  {
    name: "Captura",
    url: "/captura",
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
  const { temPermissao, isLoading: loadingPermissoes } = useMinhasPermissoes()
  const canSeePangea = !loadingPermissoes && temPermissao("pangea", "listar")

  const navServicosFiltrado = React.useMemo(() => {
    return navServicos.filter((item) => {
      if (item.url === "/pangea") {
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
