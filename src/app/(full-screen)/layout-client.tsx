"use client"

import { UserProvider, type UserData } from "@/providers/user-provider"
import type { Permissao } from "@/app/(authenticated)/usuarios"

export function FullScreenLayoutClient({
  children,
  initialUser,
  initialPermissoes,
}: {
  children: React.ReactNode
  initialUser: UserData | null
  initialPermissoes: Permissao[]
}) {
  return (
    <UserProvider initialUser={initialUser} initialPermissoes={initialPermissoes}>
      <div className="min-h-svh w-full bg-background">{children}</div>
    </UserProvider>
  )
}
