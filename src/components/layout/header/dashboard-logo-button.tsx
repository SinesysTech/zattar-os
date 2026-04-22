"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const DASHBOARD_URL = "/app/dashboard"

export function DashboardLogoButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(DASHBOARD_URL)}
      aria-label="Voltar para Dashboard"
      title="Dashboard"
      className={cn(
        "group relative flex items-center justify-center",
        "size-10 rounded-xl cursor-pointer overflow-hidden",
        "transition-all duration-200 ease-out",
        "active:scale-95",
        "hover:bg-muted/50"
      )}
    >
      <div className="absolute inset-0 rounded-xl bg-primary/6 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <Image
        src="/logos/Sem%20Fundo%20SVG/logo-z-light.svg"
        alt="Zattar"
        width={32}
        height={32}
        className="relative h-8 w-8 object-contain dark:hidden"
        priority
      />
      <Image
        src="/logos/Sem%20Fundo%20SVG/logo-z-dark.svg"
        alt="Zattar"
        width={32}
        height={32}
        className="relative h-8 w-8 object-contain hidden dark:block"
        priority
      />
    </button>
  )
}
