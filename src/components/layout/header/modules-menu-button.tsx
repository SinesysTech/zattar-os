"use client"

import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePermissoes } from "@/providers/user-provider"
import {
  HubPanel,
  getAllItems,
  useRecents,
  type HubNavItem,
} from "@/components/layout/header/command-hub"
import { AccountBar } from "@/components/layout/header/account-bar"

export function ModulesMenuButton() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { data, temPermissao, isLoading } = usePermissoes()
  const { recents, addRecent } = useRecents()

  const canSeePangea = !isLoading && temPermissao("pangea", "listar")
  const canSeeProjetos = !isLoading && temPermissao("projetos", "listar")
  const isSuperAdmin = data?.isSuperAdmin || false

  const sections = React.useMemo(
    () => getAllItems(canSeePangea, canSeeProjetos, isSuperAdmin),
    [canSeePangea, canSeeProjetos, isSuperAdmin]
  )

  const handleNavigate = useCallback(
    (item: HubNavItem) => {
      addRecent(item.id)
      router.push(item.url)
      setIsOpen(false)
    },
    [addRecent, router]
  )

  // Global shortcut: ⌘ + /
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleGlobalKey)
    return () => window.removeEventListener("keydown", handleGlobalKey)
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Menu de módulos"
        title="Menu de módulos (⌘/)"
        className={cn(
          "group relative flex items-center justify-center",
          "size-8 rounded-lg cursor-pointer",
          "transition-all duration-200 ease-out",
          "active:scale-95",
          isOpen
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground/70 hover:bg-primary/6 hover:text-foreground"
        )}
      >
        <LayoutGrid className="size-4 transition-transform duration-200 group-hover:scale-105" />
      </button>

      {isOpen && (
        <HubPanel
          onClose={() => setIsOpen(false)}
          onNavigate={handleNavigate}
          activeUrl={pathname || ""}
          sections={sections}
          recents={recents}
          accountBar={<AccountBar />}
        />
      )}
    </>
  )
}
