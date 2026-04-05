"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BadgeCheck,
  Bell,
  HelpCircle,
  LogOut,
  Moon,
  Settings,
  Sun,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { resolveAvatarUrl } from "@/lib/avatar-url"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser, useAuthSession } from "@/providers/user-provider"

function getInitials(name: string): string {
  if (!name?.trim()) return "U"

  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "U"
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }

  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase() || "U"
}

export function HeaderUserMenu() {
  const userData = useUser()
  const { logout } = useAuthSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (userData.isLoading || !userData.nomeExibicao) {
    return <Skeleton className="h-8 w-8 rounded-full" />
  }

  const name = userData.nomeExibicao || userData.nomeCompleto || "Usuário"
  const email = userData.emailCorporativo || userData.emailPessoal || ""
  const avatar = resolveAvatarUrl(userData.avatarUrl) || ""
  const isSuperAdmin = userData.isSuperAdmin || false
  const initials = getInitials(name)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2">
          <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-border/30 transition-all duration-200 hover:ring-primary/40">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-72 rounded-xl border-border/20 bg-popover/80 p-0 shadow-lg backdrop-blur-xl dark:bg-popover/70"
        align="end"
        sideOffset={12}
      >
        {/* ── User identity section ── */}
        <div className="relative overflow-hidden rounded-t-xl px-4 pb-4 pt-5">
          {/* Ambient purple glow behind avatar area */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent" />
          <div className="relative flex items-center gap-3.5">
            <div className="rounded-full bg-gradient-to-br from-primary/40 to-primary/10 p-[2px]">
              <Avatar className="h-11 w-11 ring-2 ring-background">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="grid min-w-0 flex-1 gap-0.5">
              <span className="truncate text-sm font-semibold tracking-tight">
                {name}
              </span>
              <span className="truncate text-xs text-muted-foreground/70">
                {email}
              </span>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator className="mx-3 bg-border/30" />

        {/* ── Navigation items ── */}
        <DropdownMenuGroup className="p-1.5">
          <DropdownMenuItem
            onClick={() => router.push('/perfil')}
            className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 focus:bg-primary/[0.06] focus:text-foreground"
          >
            <BadgeCheck className="h-4 w-4 text-muted-foreground/60" />
            <span>Conta</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push('/notificacoes')}
            className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 focus:bg-primary/[0.06] focus:text-foreground"
          >
            <Bell className="h-4 w-4 text-muted-foreground/60" />
            <span>Notificações</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.open('/ajuda', '_blank')}
            className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 focus:bg-primary/[0.06] focus:text-foreground"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground/60" />
            <span>Ajuda</span>
          </DropdownMenuItem>
          {isSuperAdmin && (
            <DropdownMenuItem
              onClick={() => router.push('/app/configuracoes')}
              className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 focus:bg-primary/[0.06] focus:text-foreground"
            >
              <Settings className="h-4 w-4 text-muted-foreground/60" />
              <span>Configurações</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="mx-3 bg-border/30" />

        {/* ── Theme toggle ── */}
        <div className="p-1.5">
          <DropdownMenuItem
            className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 focus:bg-primary/[0.06] focus:text-foreground"
            onSelect={(e) => e.preventDefault()}
          >
            <div className="flex flex-1 items-center gap-3">
              {mounted && theme === "dark" ? (
                <Moon className="h-4 w-4 text-muted-foreground/60" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground/60" />
              )}
              <span>Tema escuro</span>
            </div>
            {mounted && (
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
              />
            )}
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="mx-3 bg-border/30" />

        {/* ── Logout ── */}
        <div className="p-1.5">
          <DropdownMenuItem
            onClick={() => logout()}
            className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-colors duration-150 focus:bg-destructive/[0.06] focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
