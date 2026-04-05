import { type ReactNode } from "react"

interface PortalSectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PortalSectionHeader({ title, description, action, className = "" }: PortalSectionHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-portal-text-muted mt-1">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
