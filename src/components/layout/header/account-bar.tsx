"use client"

import Notifications from "@/components/layout/header/notifications"
import { AuthenticatorPopover } from "@/components/layout/header/authenticator-popover"
import { HeaderUserMenu } from "@/components/layout/header/header-user-menu"
import { useUser } from "@/providers/user-provider"
import { Skeleton } from "@/components/ui/skeleton"

export function AccountBar() {
  const { nomeExibicao, nomeCompleto, emailCorporativo, emailPessoal, isLoading } = useUser()

  const name = nomeExibicao || nomeCompleto || "Usuário"
  const email = emailCorporativo || emailPessoal || ""

  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-border/30">
      {/* Identidade à esquerda: avatar + nome/email */}
      <div className="flex items-center gap-2.5 min-w-0">
        <HeaderUserMenu />
        <div className="flex flex-col min-w-0">
          {isLoading ? (
            <>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-1 h-2.5 w-32" />
            </>
          ) : (
            <>
              <span className="text-[13px] font-medium leading-tight truncate">
                {name}
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground/60 truncate">
                {email}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Ações à direita: notificações + 2FA */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Notifications />
        <AuthenticatorPopover />
      </div>
    </div>
  )
}
