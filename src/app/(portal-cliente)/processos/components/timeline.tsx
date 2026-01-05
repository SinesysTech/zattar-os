"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TimelineProps {
  children: React.ReactNode
  className?: string
}

interface TimelineItemProps {
  date: string
  title: string
  description?: string
  icon?: React.ReactNode
  status?: "completed" | "in-progress" | "pending"
  className?: string
  children?: React.ReactNode
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative space-y-4", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ date, title, description, icon, status = "completed", className, children, ...props }, ref) => {
    const statusColors = {
      completed: "bg-black border-gray-200",
      "in-progress": "bg-blue-500 border-blue-200",
      pending: "bg-gray-300 border-gray-200"
    }

    const lineColors = {
      completed: "bg-gray-300",
      "in-progress": "bg-blue-200", 
      pending: "bg-gray-200"
    }

    return (
      <div
        ref={ref}
        className={cn("relative flex gap-6 pb-3", className)}
        {...props}
      >
        {/* Timeline line */}
        <div className="flex flex-col items-center">
          {/* Icon/Status indicator */}
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border-4 bg-white",
              statusColors[status]
            )}
          >
            {icon || (
              <div className="h-3 w-3 rounded-full bg-white" />
            )}
          </div>
          
          {/* Connecting line */}
          <div 
            className={cn(
              "w-0.5 flex-1 mt-1",
              lineColors[status]
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* Date */}
          <time className="text-sm text-muted-foreground font-medium">
            {date}
          </time>
          
          {/* Title */}
          <h3 className="font-semibold text-foreground">
            {title}
          </h3>
          
          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
          
          {/* Additional content */}
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>
      </div>
    )
  }
)
TimelineItem.displayName = "TimelineItem"

export { Timeline, TimelineItem }
