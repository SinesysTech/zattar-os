"use client"

import * as React from "react"
import {
  Bell,
  Bot,
  Calendar,
  FileText,
  FolderOpen,
  Handshake,
  LayoutDashboard,
  Scale,
  Users,
  UserCog,
  Database,
  FileEdit,
  MessageSquare,
  Wallet,
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
    items: [
      { title: "Clientes", url: "/partes/clientes" },
      { title: "Partes Contrárias", url: "/partes/partes-contrarias" },
      { title: "Terceiros", url: "/partes/terceiros" },
      { title: "Representantes", url: "/partes/representantes" },
    ],
  },
  {
    title: "Contratos",
    url: "/contratos",
    icon: FileText,
  },
  {
    title: "Assinatura Digital",
    url: "/assinatura-digital/assinatura",
    icon: FileText,
    items: [
      { title: "Fluxo de Assinatura", url: "/assinatura-digital/assinatura" },
      { title: "Templates", url: "/assinatura-digital/templates" },
      { title: "Formulários", url: "/assinatura-digital/formularios" },
      { title: "Segmentos", url: "/assinatura-digital/segmentos" },
    ],
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
    items: [
      { title: "Semana", url: "/expedientes/semana" },
      { title: "Mês", url: "/expedientes/mes" },
      { title: "Ano", url: "/expedientes/ano" },
      { title: "Lista", url: "/expedientes/lista" },
    ],
  },
  {
    title: "Obrigações",
    url: "/acordos-condenacoes",
    icon: Handshake,
    items: [
      { title: "Lista", url: "/acordos-condenacoes/lista" },
      { title: "Semana", url: "/acordos-condenacoes/semana" },
      { title: "Mês", url: "/acordos-condenacoes/mes" },
      { title: "Ano", url: "/acordos-condenacoes/ano" },
    ],
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: Wallet,
    items: [
      { title: "Orçamentos", url: "/financeiro/orcamentos" },
      { title: "Contas a Pagar", url: "/financeiro/contas-pagar" },
      { title: "Contas a Receber", url: "/financeiro/contas-receber" },
      { title: "Plano de Contas", url: "/financeiro/plano-contas" },
      { title: "Obrigações Financeiras", url: "/financeiro/obrigacoes" },
    ],
  },
]

// Nav Serviços - Ferramentas e utilitários
const navServicos = [
  {
    name: "Documentos",
    url: "/documentos",
    icon: FileEdit,
  },
  {
    name: "Chat",
    url: "/chat",
    icon: MessageSquare,
  },
  {
    name: "Assistentes",
    url: "/assistentes",
    icon: Bot,
  },
  {
    name: "Comunica CNJ",
    url: "/comunica-cnj",
    icon: Bell,
  },
]

// Nav Administração - Configurações e gestão
const navAdministracao = [
  {
    name: "Captura",
    url: "/captura",
    icon: Database,
    items: [
      { title: "Histórico", url: "/captura/historico" },
      { title: "Agendamentos", url: "/captura/agendamentos" },
      { title: "Credenciais", url: "/captura/credenciais" },
      { title: "Tribunais", url: "/captura/tribunais" },
    ],
  },
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
        <NavMain items={navPrincipal} />
        <NavProjects projects={navServicos} label="Serviços" showActions={false} />
        <NavProjects projects={navAdministracao} label="Administração" showActions={false} />
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
