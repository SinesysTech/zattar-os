'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { MacOSDock, type DockItem } from '@/components/ui/mac-os-dock'
import { usePermissoes } from '@/providers/user-provider'

// ─── Dock icons (icons8 outline style + Liquid Glass) ──────────────────
// Icons sourced from icons8.com — white outline 96px PNGs
// Liquid Glass effect applied via mac-os-dock.tsx container

function DockIcon({ src, alt, color }: { src: string; alt: string; color?: string }) {
  return (
    <div className="w-full h-full relative">
      {color && (
        <div className="absolute inset-0" style={{ background: color }} />
      )}
      <div className="relative w-full h-full p-[22%]">
        <Image
          src={src}
          alt={alt}
          width={96}
          height={96}
          className="w-full h-full object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
          draggable={false}
        />
      </div>
    </div>
  )
}

// ─── Icon color map (gradient backgrounds per dock item) ────────────────

const iconColors: Record<string, string> = {
  dashboard:      'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  audiencias:     'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  contratos:      'linear-gradient(135deg, #10b981, #059669)',
  expedientes:    'linear-gradient(135deg, #f59e0b, #d97706)',
  obrigacoes:     'linear-gradient(135deg, #ef4444, #dc2626)',
  partes:         'linear-gradient(135deg, #14b8a6, #0d9488)',
  pericias:       'linear-gradient(135deg, #f97316, #ea580c)',
  processos:      'linear-gradient(135deg, #6366f1, #4f46e5)',
  agenda:         'linear-gradient(135deg, #0ea5e9, #0284c7)',
  assinatura:     'linear-gradient(135deg, #22c55e, #16a34a)',
  assistentes:    'linear-gradient(135deg, #a855f7, #9333ea)',
  chat:           'linear-gradient(135deg, #ec4899, #db2777)',
  diario:         'linear-gradient(135deg, #64748b, #475569)',
  documentos:     'linear-gradient(135deg, #06b6d4, #0891b2)',
  email:          'linear-gradient(135deg, #f43f5e, #e11d48)',
  jurisprudencia: 'linear-gradient(135deg, #eab308, #ca8a04)',
  notas:          'linear-gradient(135deg, #fbbf24, #f59e0b)',
  pecas:          'linear-gradient(135deg, #e879f9, #c026d3)',
  projetos:       'linear-gradient(135deg, #84cc16, #65a30d)',
  captura:        'linear-gradient(135deg, #fb923c, #f97316)',
  financeiro:     'linear-gradient(135deg, #34d399, #10b981)',
}

// ─── Navigation data (mirrors app-sidebar.tsx) ──────────────────────────

interface NavItemDef {
  id: string
  title: string
  url: string
}

const navPrincipal: NavItemDef[] = [
  { id: 'dashboard',   title: 'Dashboard',   url: '/app/dashboard'           },
  { id: 'audiencias',  title: 'Audiências',  url: '/app/audiencias/semana'   },
  { id: 'contratos',   title: 'Contratos',   url: '/app/contratos'           },
  { id: 'expedientes', title: 'Expedientes', url: '/app/expedientes'         },
  { id: 'obrigacoes',  title: 'Obrigações',  url: '/app/acordos-condenacoes' },
  { id: 'partes',      title: 'Partes',      url: '/app/partes'              },
  { id: 'pericias',    title: 'Perícias',    url: '/app/pericias'            },
  { id: 'processos',   title: 'Processos',   url: '/app/processos'           },
]

const navServicos: NavItemDef[] = [
  { id: 'agenda',         title: 'Agenda',             url: '/app/calendar'                            },
  { id: 'assinatura',     title: 'Assinatura Digital', url: '/app/assinatura-digital/documentos/lista' },
  { id: 'assistentes',    title: 'Assistentes',        url: '/app/assistentes'                         },
  { id: 'chat',           title: 'Chat',               url: '/app/chat'                                },
  { id: 'diario',         title: 'Diário Oficial',     url: '/app/comunica-cnj'                        },
  { id: 'documentos',     title: 'Documentos',         url: '/app/documentos'                          },
  { id: 'email',          title: 'E-mail',             url: '/app/mail'                                },
  { id: 'jurisprudencia', title: 'Jurisprudência',     url: '/app/pangea'                              },
  { id: 'notas',          title: 'Notas',              url: '/app/notas'                               },
  { id: 'pecas',          title: 'Peças Jurídicas',    url: '/app/pecas-juridicas'                     },
  { id: 'projetos',       title: 'Projetos',           url: '/app/project-management'                  },
]

const navGestao: NavItemDef[] = [
  { id: 'captura',    title: 'Captura',    url: '/app/captura'    },
  { id: 'financeiro', title: 'Financeiro', url: '/app/financeiro' },
]

const DASHBOARD_URL = '/app/dashboard'

// ─── AppDock component ──────────────────────────────────────────────────

export function AppDock() {
  const router = useRouter()
  const pathname = usePathname()
  const { data, temPermissao, isLoading } = usePermissoes()
  const canSeePangea = !isLoading && temPermissao('pangea', 'listar')
  const canSeeProjetos = !isLoading && temPermissao('projetos', 'listar')
  const isSuperAdmin = data?.isSuperAdmin || false

  // Same filtering logic as app-sidebar.tsx
  const allItems = React.useMemo(() => {
    const servicos = navServicos.filter((item) => {
      if (item.url === '/app/project-management') return canSeeProjetos
      if (item.url === '/app/pangea') return canSeePangea
      return true
    })

    const items = [...navPrincipal, ...servicos]
    if (isSuperAdmin) items.push(...navGestao)

    return items.sort((a, b) => {
      if (a.url === DASHBOARD_URL) return -1
      if (b.url === DASHBOARD_URL) return 1
      return a.title.localeCompare(b.title, 'pt-BR')
    })
  }, [canSeePangea, canSeeProjetos, isSuperAdmin])

  // Build dock items with macOS PNG icons
  const dockItems: DockItem[] = React.useMemo(
    () =>
      allItems.map((item) => ({
        id: item.id,
        name: item.title,
        icon: (
          <DockIcon
            src={`/icons/dock/${item.id}.png`}
            alt={item.title}
            color={iconColors[item.id]}
          />
        ),
      })),
    [allItems]
  )

  // Detect active route(s)
  const activeItems = React.useMemo(
    () =>
      allItems
        .filter((item) => pathname?.startsWith(item.url))
        .map((item) => item.id),
    [allItems, pathname]
  )

  const handleItemClick = React.useCallback(
    (itemId: string) => {
      const item = allItems.find((i) => i.id === itemId)
      if (item) router.push(item.url)
    },
    [allItems, router]
  )

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50">
      <MacOSDock
        items={dockItems}
        onItemClick={handleItemClick}
        activeItems={activeItems}
      />
    </div>
  )
}
