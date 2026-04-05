"use client"

import { type ReactNode } from "react"

interface TimelineEvent {
  id: string
  date: string
  title: string
  description?: string
  icon?: ReactNode
  status?: "completed" | "current" | "pending"
}

interface PortalTimelineProps {
  events: TimelineEvent[]
  className?: string
}

const STATUS_STYLES = {
  completed: "bg-portal-success border-portal-success-soft",
  current: "bg-portal-primary border-portal-primary-soft",
  pending: "bg-muted border-border",
}

export function PortalTimeline({ events, className = "" }: PortalTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-portal-text-muted py-8 text-center">
        Nenhuma movimentação registrada.
      </p>
    )
  }

  return (
    <div className={`relative space-y-6 ${className}`}>
      {events.map((event, index) => {
        const status = event.status ?? (index === 0 ? "current" : "completed")
        const isLast = index === events.length - 1

        return (
          <div key={event.id} className="relative flex gap-4">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />
            )}

            {/* Dot */}
            <div className={`relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${STATUS_STYLES[status]}`}>
              {event.icon ? (
                <span className="text-white [&>svg]:h-3 [&>svg]:w-3">{event.icon}</span>
              ) : (
                <span className={`h-2 w-2 rounded-full ${status === "pending" ? "bg-muted-foreground" : "bg-white"}`} />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pb-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{event.title}</p>
                <time className="shrink-0 text-xs font-mono text-portal-text-muted">{event.date}</time>
              </div>
              {event.description && (
                <p className="mt-1 text-sm text-portal-text-muted leading-relaxed">{event.description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
