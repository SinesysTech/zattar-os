"use client"

import * as React from "react"
import {
  Bot,
  Calendar,
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
  StickyNote,
  CalendarCheck,
  Search,
  ScrollText,
} from "lucide-react"

import { NavMain } from "@/components/layout/sidebar/nav-main"

import { SidebarLogo } from "@/components/layout/sidebar/sidebar-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
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
    items: [
      { title: "Clientes", url: "/app/partes/clientes" },
      { title: "Partes Contrárias", url: "/app/partes/partes-contrarias" },
      { title: "Terceiros", url: "/app/partes/terceiros" },
      { title: "Representantes", url: "/app/partes/representantes" },
    ],
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

// Nav Serviços - Ferramentas e utilitários (ordem alfabética)
const navServicos = [
  {
    title: "Agenda",
    url: "/app/calendar",
    icon: Calendar,
  },
  {
    title: "Assistentes",
    url: "/app/assistentes",
    icon: Bot,
  },
  {
    title: "Assinatura Digital",
    url: "/app/assinatura-digital",
    icon: PenTool,
  },
  {
    title: "Chat",
    url: "/app/chat",
    icon: MessageSquare,
  },
  {
    title: "Documentos",
    url: "/app/documentos",
    icon: FileEdit,
  },
  {
    title: "Notas",
    url: "/app/notas",
    icon: StickyNote,
  },
  {
    title: "Peças Jurídicas",
    url: "/app/pecas-juridicas",
    icon: ScrollText,
  },
  {
    title: "Pesquisa Jurídica",
    url: "/app/pesquisa-juridica",
    icon: Search,
    items: [
      { title: "Diário Oficial", url: "/app/comunica-cnj" },
      { title: "Pangea", url: "/app/pangea" },
    ],
  },
  {
    title: "Planner",
    url: "/app/planner",
    icon: CalendarCheck,
    items: [
      { title: "Kanban", url: "/app/kanban" },
      { title: "Tarefas", url: "/app/tarefas" },
      { title: "To-Do", url: "/app/todo" },
    ],
  },
]

// Nav Gestão - Ferramentas administrativas (apenas super admin)
const navGestao = [
  {
    title: "Financeiro",
    url: "/app/financeiro",
    icon: Wallet,
  },
  {
    title: "Recursos Humanos",
    url: "/app/rh",
    icon: Users,
  },
  {
    title: "Captura",
    url: "/app/captura",
    icon: Database,
    items: [
      { title: "Histórico", url: "/app/captura/historico" },
      { title: "Agendamentos", url: "/app/captura/agendamentos" },
      { title: "Credenciais", url: "/app/captura/credenciais" },
      { title: "Tribunais", url: "/app/captura/tribunais" },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: permissoesData, temPermissao, isLoading: loadingPermissoes } = useMinhasPermissoes()
  const canSeePangea = !loadingPermissoes && temPermissao("pangea", "listar")
  const isSuperAdmin = permissoesData?.isSuperAdmin || false

  const navServicosFiltrado = React.useMemo(() => {
    return navServicos.map((item) => {
      // Filtrar sub-itens do Pangea se não tiver permissão
      if (item.items) {
        const filteredItems = item.items.filter((subItem) => {
          if (subItem.url === "/app/pangea") {
            return canSeePangea
          }
          return true
        })
        return { ...item, items: filteredItems }
      }
      return item
    })
  }, [canSeePangea])

  const todosItens = React.useMemo(() => {
    const items = [...navPrincipal, ...navServicosFiltrado]
    if (isSuperAdmin) {
      items.push(...navGestao)
    }
    return items
  }, [navServicosFiltrado, isSuperAdmin])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={todosItens} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
