"use client"

import { type ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface PortalStatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  trend?: string
  className?: string
}

export function PortalStatCard({ icon, label, value, trend, className = "" }: PortalStatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-portal-primary-soft text-portal-primary">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-portal-text-muted">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {trend && (
            <p className="text-xs text-portal-text-subtle mt-0.5">{trend}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
