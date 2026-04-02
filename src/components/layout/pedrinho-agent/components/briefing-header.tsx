'use client'

import { Minus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BriefingHeaderProps {
  moduleLabel: string
  onMinimize: () => void
  onClose: () => void
}

export function BriefingHeader({ moduleLabel, onMinimize, onClose }: BriefingHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3',
        'border-b border-border/20 dark:border-border/10'
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'size-8 rounded-xl flex items-center justify-center',
            'bg-linear-to-br from-primary/25 to-primary/10',
            'border border-primary/20'
          )}
        >
          <span className="flex gap-1">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="size-1.5 rounded-full bg-primary" />
          </span>
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-foreground leading-tight">Pedrinho</h2>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{moduleLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={onMinimize}
          aria-label="Minimizar painel"
          className={cn(
            'size-7 rounded-lg flex items-center justify-center',
            'text-muted-foreground/60 hover:text-foreground/80',
            'hover:bg-muted/60 dark:hover:bg-white/8',
            'transition-colors duration-150 cursor-pointer'
          )}
          title="Minimizar (Esc)"
        >
          <Minus className="size-3.5" />
        </button>
        <button
          onClick={onClose}
          aria-label="Fechar painel"
          className={cn(
            'size-7 rounded-lg flex items-center justify-center',
            'text-muted-foreground/60 hover:text-foreground/80',
            'hover:bg-muted/60 dark:hover:bg-white/8',
            'transition-colors duration-150 cursor-pointer'
          )}
          title="Fechar"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
