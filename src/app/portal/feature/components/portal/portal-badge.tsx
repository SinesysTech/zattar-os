"use client"

import { type ReactNode } from "react"

type PortalBadgeVariant = "success" | "warning" | "danger" | "info" | "neutral"

interface PortalBadgeProps {
  variant: PortalBadgeVariant
  children: ReactNode
  dot?: boolean  // show colored dot before text
  className?: string
}

const VARIANT_STYLES: Record<PortalBadgeVariant, string> = {
  success: "bg-portal-success-soft text-portal-success",
  warning: "bg-portal-warning-soft text-portal-warning",
  danger: "bg-portal-danger-soft text-portal-danger",
  info: "bg-portal-info-soft text-portal-info",
  neutral: "bg-muted text-muted-foreground",
}

export function PortalBadge({ variant, children, dot = true, className = "" }: PortalBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT_STYLES[variant]} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export type { PortalBadgeVariant }
