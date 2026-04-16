'use client'

import { Text } from '@/components/ui/typography'
import { cn } from '@/lib/utils'

interface DocumentPeekCardProps {
  fileName: string
  sender?: string
  date?: string
  className?: string
}

export function DocumentPeekCard({ fileName, sender, date, className }: DocumentPeekCardProps) {
  const subtitle = [sender, date].filter(Boolean).join(' · ')

  return (
    <div
      className={cn(
        'rounded-xl border border-outline-variant/40 bg-surface-container-lowest/60 p-4 backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md border border-outline-variant/50 bg-linear-to-br from-background to-surface-container-low text-[9px] font-bold tracking-wide text-primary">
          PDF
        </div>
        <div className="min-w-0 flex-1">
          <Text variant="label" className="block truncate text-foreground">
            {fileName}
          </Text>
          {subtitle && (
            <Text variant="micro-caption" className="mt-0.5 block text-muted-foreground">
              {subtitle}
            </Text>
          )}
        </div>
      </div>
    </div>
  )
}
