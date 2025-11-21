"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useBreadcrumb } from "@/components/layout/breadcrumb-context"

// Mapeamento de rotas para labels customizados
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  clientes: "Clientes",
  contratos: "Contratos",
  processos: "Processos",
  audiencias: "Audiências",
  expedientes: "Expedientes",
  captura: "Captura",
  usuarios: "Usuários",
  perfil: "Perfil",
  "partes-contrarias": "Partes Contrárias",
  documentos: "Documentos",
  configuracoes: "Configurações",
  relatorios: "Relatórios",
  financeiro: "Financeiro",
  agendamentos: "Agendamentos",
  notificacoes: "Notificações",
  protocolos: "Protocolos",
  publicacoes: "Publicações",
  custas: "Custas",
  honorarios: "Honorários",
  historico: "Histórico",
  movimentacoes: "Movimentações",
  andamentos: "Andamentos",
  "acordos-condenacoes": "Obrigações",
}

// Função para formatar o segmento da rota em um label legível
function formatRouteSegment(segment: string): string {
  // Se existe um label customizado, usa ele
  if (routeLabels[segment]) {
    return routeLabels[segment]
  }

  // Remove hífens e capitaliza palavras
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function AppBreadcrumb() {
  const pathname = usePathname()
  const { overrides } = useBreadcrumb()

  // Divide o pathname em segmentos e remove strings vazias
  const segments = pathname.split("/").filter(Boolean)

  // Se estiver na raiz, não mostra breadcrumb ou mostra apenas "Home"
  if (segments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Início</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  // Gera os breadcrumbs
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")

    // Verifica se existe override para este caminho
    const override = overrides.find((o) => o.path === href)
    const label = override ? override.label : formatRouteSegment(segment)

    const isLast = index === segments.length - 1

    return {
      href,
      label,
      isLast,
    }
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Link para home sempre visível em desktop */}
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link href="/">Início</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.length > 0 && (
          <BreadcrumbSeparator className="hidden md:block" />
        )}
        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.href}>
            {index > 0 && (
              <BreadcrumbSeparator className="hidden md:block" />
            )}
            <BreadcrumbItem>
              {breadcrumb.isLast ? (
                <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

