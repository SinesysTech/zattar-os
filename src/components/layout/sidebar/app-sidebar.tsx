"use client"

import * as React from "react"
import {
  Bot,
  Briefcase,
  Calendar,
  CalendarCheck,
  Database,
  FileEdit,
  FileText,
  FolderOpen,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  Microscope,
  PenTool,
  Scale,
  ScrollText,
  Search,
  UserCog,
  Users,
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
]

// Nav Serviços - Ferramentas e utilitários
const navServicos = [
  {
    title: "Planner",
    url: "/app/planner",
    icon: CalendarCheck,
    items: [
      { title: "Agenda", url: "/app/calendar" },
      { title: "Kanban", url: "/app/kanban" },
      { title: "Notas", url: "/app/notas" },
      { title: "Tarefas", url: "/app/tarefas" },
    ],
  },
  {
    title: "Documentos",
    url: "/app/documentos",
    icon: FileEdit,
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
    title: "Chat",
    url: "/app/chat",
    icon: MessageSquare,
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
    items: [
      { title: "Documentos", url: "/app/assinatura-digital/documentos/lista" },
      { title: "Templates", url: "/app/assinatura-digital/templates" },
      { title: "Formulários", url: "/app/assinatura-digital/formularios" },
    ],
  },
]

// Nav Gestão - Ferramentas administrativas (apenas super admin)
const navGestao = [
  {
    title: "Financeiro",
    url: "/app/financeiro",
    icon: Briefcase,
    items: [
      { title: "Dashboard", url: "/app/financeiro" },
      { title: "Orçamentos", url: "/app/financeiro/orcamentos" },
      { title: "Contas a Pagar", url: "/app/financeiro/contas-pagar" },
      { title: "Contas a Receber", url: "/app/financeiro/contas-receber" },
      { title: "Plano de Contas", url: "/app/financeiro/plano-contas" },
      { title: "Conciliação", url: "/app/financeiro/conciliacao-bancaria" },
      { title: "DRE", url: "/app/financeiro/dre" },
    ],
  },
  {
    title: "Recursos Humanos",
    url: "/app/rh",
    icon: UserCog,
    items: [
      { title: "Equipe", url: "/app/usuarios" },
      { title: "Salários", url: "/app/rh/salarios" },
      { title: "Folhas de Pagamento", url: "/app/rh/folhas-pagamento" },
    ],
  },
  {
    title: "Captura",
    url: "/app/captura",
    icon: Database,
    items: [
      { title: "Histórico", url: "/app/captura/historico" },
      { title: "Agendamentos", url: "/app/captura/agendamentos" },
      { title: "Advogados", url: "/app/captura/advogados" },
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
