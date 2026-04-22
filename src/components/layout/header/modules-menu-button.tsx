"use client"

import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
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
          "group/modules relative flex items-center justify-center",
          "size-9 rounded-xl cursor-pointer",
          "border transition-all duration-200 ease-out",
          "active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isOpen
            ? "bg-primary/10 border-primary/30 shadow-[0_0_16px_oklch(var(--primary)/0.15)]"
            : "bg-card/50 border-border/30 hover:bg-primary/8 hover:border-primary/25 hover:shadow-[0_0_16px_oklch(var(--primary)/0.12)]"
        )}
      >
        {/* Glow on hover */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl bg-primary/6 transition-opacity duration-300",
            isOpen ? "opacity-0" : "opacity-0 group-hover/modules:opacity-100"
          )}
        />

        {/* Four-dot grid signature — represents "modules" */}
        <span className="relative grid grid-cols-2 gap-0.75">
          <span
            className={cn(
              "size-1.5 rounded-[2px] transition-colors duration-200",
              isOpen
                ? "bg-primary"
                : "bg-primary/70 group-hover/modules:bg-primary"
            )}
          />
          <span
            className={cn(
              "size-1.5 rounded-[2px] transition-colors duration-200",
              isOpen
                ? "bg-primary"
                : "bg-primary/70 group-hover/modules:bg-primary"
            )}
          />
          <span
            className={cn(
              "size-1.5 rounded-[2px] transition-colors duration-200",
              isOpen
                ? "bg-primary"
                : "bg-primary/70 group-hover/modules:bg-primary"
            )}
          />
          <span
            className={cn(
              "size-1.5 rounded-[2px] transition-colors duration-200",
              isOpen
                ? "bg-primary"
                : "bg-primary/70 group-hover/modules:bg-primary"
            )}
          />
        </span>
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
