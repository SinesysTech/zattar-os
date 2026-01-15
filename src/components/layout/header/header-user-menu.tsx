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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"

function getInitials(name: string): string {
  if (!name) return "U"

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getAvatarPublicUrl(avatarPath: string | null | undefined): string {
  if (!avatarPath) return ""
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return ""
  return `${supabaseUrl}/storage/v1/object/public/avatar/${avatarPath}`
}

export function HeaderUserMenu() {
  const [user, setUser] = React.useState<{
    name: string
    email: string
    avatar: string
  } | null>(null)

  const hasLoadedRef = React.useRef(false)
  const { isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!isAuthenticated) {
      setUser(null)
      return
    }

    if (hasLoadedRef.current) {
      return
    }

    async function loadUser() {
      try {
        hasLoadedRef.current = true

        const response = await fetch('/api/perfil', {
          credentials: 'include',
        })

        if (response.status === 401) {
          hasLoadedRef.current = false
          setUser(null)
          await logout()
          return
        }

        if (!response.ok) {
          try {
            const supabase = createClient()
            const { data: { user: authUser }, error } = await supabase.auth.getUser()

            if (error || !authUser) {
              hasLoadedRef.current = false
              setUser(null)
              await logout()
              return
            }

            setUser({
              name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Usuário",
              email: authUser.email || "",
              avatar: authUser.user_metadata?.avatar_url || "",
            })
          } catch {
            hasLoadedRef.current = false
          }
          return
        }

        const data = await response.json()

        if (data.success && data.data) {
          const usuario = data.data
          setUser({
            name: usuario.nomeExibicao || usuario.nomeCompleto || "Usuário",
            email: usuario.emailCorporativo || usuario.emailPessoal || "",
            avatar: getAvatarPublicUrl(usuario.avatarUrl),
          })
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error)
        hasLoadedRef.current = false

        if (error instanceof Error && error.message.includes('auth')) {
          await logout()
        }
      }
    }

    loadUser()
  }, [isAuthenticated, logout])

  const handleLogout = async () => {
    try {
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
      } catch {
        console.log('Sessão já expirada, limpando cookies via API')
      }

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        console.warn('Erro ao fazer logout via API, mas continuando...')
      }

      router.push("/app/login")
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      router.push("/app/login")
      router.refresh()
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!user) {
    return <Skeleton className="h-8 w-8 rounded-full" />
  }

  const initials = getInitials(user.name)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/perfil')}>
            <BadgeCheck className="mr-2 h-4 w-4" />
            Conta
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/notificacoes')}>
            <Bell className="mr-2 h-4 w-4" />
            Notificações
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.open('/ajuda', '_blank')}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Ajuda
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center justify-between cursor-pointer"
          onSelect={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-2">
            {mounted && theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
