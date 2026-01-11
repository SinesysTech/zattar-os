'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function LogoutButton() {
  const { logout } = useAuth()

  return <Button onClick={logout}>Sair</Button>
}
