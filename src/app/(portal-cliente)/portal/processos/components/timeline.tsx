import * as React from "react"

export interface TimelineItem {
  date: string
  title: string
  description: string
  icon?: React.ReactNode
  status?: 'completed' | 'pending' | 'error'
}

interface TimelineProps {
  children?: React.ReactNode
}

interface TimelineItemComponentProps {
  date: string
  title: string
  description: string
  icon?: React.ReactNode
  status?: 'completed' | 'pending' | 'error'
  children?: React.ReactNode
}

export const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ children, ...props }, ref) => (
    <div ref={ref} className="space-y-8" {...props}>
      {children}
    </div>
  )
)
Timeline.displayName = "Timeline"

export const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemComponentProps>(
  ({ date, title, description, icon, status, children, ...props }, ref) => (
    <div ref={ref} className="flex gap-4" {...props}>
      <div className="flex flex-col items-center">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
          status === 'completed' ? 'border-green-500 bg-green-50' :
          status === 'error' ? 'border-red-500 bg-red-50' :
          'border-blue-500 bg-blue-50'
        }`}>
          {icon}
        </div>
        <div className="mt-2 h-16 w-0.5 bg-gray-200" />
      </div>
      <div className="flex-1 pt-1">
        <p className="text-sm font-medium text-gray-600">{date}</p>
        <h3 className="mt-1 text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        {children}
      </div>
    </div>
  )
)
TimelineItem.displayName = "TimelineItem"
