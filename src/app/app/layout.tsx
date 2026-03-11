"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { UserProvider } from "@/providers/user-provider"

const AUTH_ROUTES = [
  "/app/login",
  "/app/sign-up",
  "/app/sign-up-success",
  "/app/forgot-password",
  "/app/update-password",
  "/app/confirm",
  "/app/error",
]

const MINIMAL_ROUTES = [
  "/app/chat/call",
]

// Lazy-load CopilotKit + Dashboard shell (evita compilar 108MB de módulos no startup)
const CopilotDashboard = dynamic(
  () => import("@/components/layout/copilot-dashboard"),
  { ssr: false }
)

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = AUTH_ROUTES.some(route => pathname?.startsWith(route))

  if (isAuthRoute) {
    return <div className="min-h-svh bg-background">{children}</div>
  }

  const isMinimalRoute = MINIMAL_ROUTES.some(route => pathname?.startsWith(route))
  if (isMinimalRoute) {
    return <>{children}</>
  }

  return (
    <UserProvider>
      <CopilotDashboard>{children}</CopilotDashboard>
    </UserProvider>
  )
}
