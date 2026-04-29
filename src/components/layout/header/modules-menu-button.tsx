"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
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
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
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

  const toggleMenu = useCallback(() => {
    if (buttonRef.current) {
      setAnchorRect(buttonRef.current.getBoundingClientRect())
    }
    setIsOpen((prev) => !prev)
  }, [])

  // Global shortcut: ⌘ + /
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault()
        toggleMenu()
      }
    }
    window.addEventListener("keydown", handleGlobalKey)
    return () => window.removeEventListener("keydown", handleGlobalKey)
  }, [toggleMenu])

  // Recompute anchor on resize while open (mantém o painel ancorado se o layout mudar)
  useEffect(() => {
    if (!isOpen) return
    function handleResize() {
      if (buttonRef.current) {
        setAnchorRect(buttonRef.current.getBoundingClientRect())
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isOpen])

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        aria-label="Menu de módulos"
        title="Menu de módulos (⌘/)"
        className={cn(
          "group/modules relative flex items-center justify-center",
          "size-9 rounded-xl cursor-pointer",
          "bg-card/80 border border-border",
          "active:scale-95",
          "transition-all duration-200 ease-out",
          isOpen
            ? "bg-primary/10 border-primary/30 shadow-[0_0_16px_oklch(var(--primary)/0.15)]"
            : "hover:bg-primary/8 hover:border-primary/25 hover:shadow-[0_0_16px_oklch(var(--primary)/0.12)]"
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
              "size-1.5 rounded-xs transition-colors duration-200",
              isOpen
                ? "bg-primary"
                : "bg-primary/70 group-hover/modules:bg-primary"
            )}
          />
          <span
            className={cn(
              "size-1.5 rounded-xs transition-colors duration-200",
              isOpen
                ? "bg-primary"
                : "bg-primary/70 group-hover/modules:bg-primary"
            )}
          />
          <span
            className={cn(
              "size-1.5 rounded-xs transition-colors duration-200",
              isOpen
                ? "bg-primary"
                : "bg-primary/70 group-hover/modules:bg-primary"
            )}
          />
          <span
            className={cn(
              "size-1.5 rounded-xs transition-colors duration-200",
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
          anchorRect={anchorRect}
        />
      )}
    </>
  )
}
