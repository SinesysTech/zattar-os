'use client'

import { Button } from '@/components/ui/button'
import { useAuthSession } from '@/providers/user-provider'

export function LogoutButton() {
  const { logout } = useAuthSession()

  return <Button onClick={logout}>Sair</Button>
}
