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
  const { logout: _logout } = useAuthSession()
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
  const avatar = resolveAvatarUrl(userData.avatarUrl) || ""
  const initials = getInitials(name)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2">
          <Avatar className="cursor-pointer ring-2 ring-border/30 transition-all duration-200 hover:ring-primary/40">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-52 rounded-xl border-border/20 bg-popover/80 p-0 shadow-lg backdrop-blur-xl dark:bg-popover/70"
        align="start"
        sideOffset={8}
      >
        {/* ── Navigation ── */}
        <DropdownMenuGroup className="p-1 pt-1.5">
          <DropdownMenuItem
            onClick={() => router.push('/perfil')}
            className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors duration-150 focus:bg-primary/6 focus:text-foreground"
          >
            <BadgeCheck className="size-4 shrink-0 text-muted-foreground/60" />
            Conta
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push('/notificacoes')}
            className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors duration-150 focus:bg-primary/6 focus:text-foreground"
          >
            <Bell className="size-4 shrink-0 text-muted-foreground/60" />
            Notificações
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.open('/ajuda', '_blank')}
            className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors duration-150 focus:bg-primary/6 focus:text-foreground"
          >
            <HelpCircle className="size-4 shrink-0 text-muted-foreground/60" />
            Ajuda
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="mx-2 bg-border/30" />

        {/* ── Theme toggle ── */}
        <div className="p-1">
          <DropdownMenuItem
            className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors duration-150 focus:bg-primary/6 focus:text-foreground"
            onSelect={(e) => e.preventDefault()}
          >
            <div className="flex flex-1 items-center gap-2">
              {mounted && theme === "dark" ? (
                <Moon className="size-4 shrink-0 text-muted-foreground/60" />
              ) : (
                <Sun className="size-4 shrink-0 text-muted-foreground/60" />
              )}
              Tema escuro
            </div>
            {mounted && (
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
                className="scale-[0.8] origin-right"
              />
            )}
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="mx-2 bg-border/30" />

        {/* ── Logout ── */}
        <div className="p-1 pb-1.5">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
                .finally(() => { window.location.href = '/login' })
            }}
            className="cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground/70 transition-colors duration-150 focus:bg-destructive/6 focus:text-destructive"
          >
            <LogOut className="size-4 shrink-0" />
            Sair
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
