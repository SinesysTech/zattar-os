"use client"

import { type ReactNode } from "react"

interface PortalListItemProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function PortalListItem({ children, onClick, className = "" }: PortalListItemProps) {
  const interactive = !!onClick

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.() } } : undefined}
      className={`flex items-center justify-between gap-4 py-4 border-b border-border/50 last:border-0 ${
        interactive ? "cursor-pointer hover:bg-portal-card-hover transition-colors rounded-lg -mx-2 px-2" : ""
      } ${className}`}
    >
      {children}
    </div>
  )
}
